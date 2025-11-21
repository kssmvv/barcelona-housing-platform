import json
import os
import boto3
from datetime import datetime
from decimal import Decimal
from botocore.exceptions import ClientError

# Helper for Decimal serialization
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Headers': '*'
            },
            'body': ''
        }

    try:
        listings_table_name = os.environ.get('LISTINGS_TABLE_NAME')
        bids_table_name = os.environ.get('BIDS_TABLE_NAME')
        
        dynamodb = boto3.resource('dynamodb')
        listings_table = dynamodb.Table(listings_table_name)
        bids_table = dynamodb.Table(bids_table_name)

        body = json.loads(event.get('body', '{}'))
        listing_id = body.get('listing_id')
        created_at = body.get('created_at')
        bidder_id = body.get('bidder_id')
        amount = Decimal(str(body.get('amount', 0)))

        if not listing_id or not created_at or not bidder_id or amount <= 0:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid input'})}

        # 1. Get current listing state
        resp = listings_table.get_item(
            Key={'listing_id': listing_id, 'created_at': created_at}
        )
        item = resp.get('Item')
        
        if not item:
            return {'statusCode': 404, 'body': json.dumps({'error': 'Listing not found'})}

        if item.get('sale_type') != 'auction':
            return {'statusCode': 400, 'body': json.dumps({'error': 'Not an auction'})}

        # Check time
        auction_end = item.get('auction_end_time')
        if auction_end and datetime.utcnow().isoformat() > auction_end:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Auction ended'})}

        # Check amount
        current_price = item.get('current_highest_bid') or item.get('starting_bid') or item.get('price', 0)
        if amount <= current_price:
            return {'statusCode': 400, 'body': json.dumps({'error': f'Bid must be higher than {current_price}'})}

        # 2. Place Bid (Transaction ideally, but simple update for now)
        # We record the bid first
        timestamp = datetime.utcnow().isoformat()
        bids_table.put_item(
            Item={
                'listing_id': listing_id,
                'timestamp': timestamp,
                'bidder_id': bidder_id,
                'amount': amount
            }
        )

        # 3. Update Listing
        listings_table.update_item(
            Key={'listing_id': listing_id, 'created_at': created_at},
            UpdateExpression="SET current_highest_bid = :amt, highest_bidder_id = :uid, bid_count = if_not_exists(bid_count, :start) + :inc",
            ExpressionAttributeValues={
                ':amt': amount,
                ':uid': bidder_id,
                ':start': 0,
                ':inc': 1
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'success': True, 'new_price': amount}, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

