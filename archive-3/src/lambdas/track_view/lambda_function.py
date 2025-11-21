import json
import os
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

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
        views_table_name = os.environ.get('VIEWS_TABLE_NAME')
        
        dynamodb = boto3.resource('dynamodb')
        listings_table = dynamodb.Table(listings_table_name)
        views_table = dynamodb.Table(views_table_name)

        body = json.loads(event.get('body', '{}'))
        listing_id = body.get('listing_id')
        created_at = body.get('created_at') # Required for PK
        viewer_id = body.get('viewer_id')

        if not listing_id:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Missing listing_id'})}
            
        # Fallback: if created_at is missing, we must Query to find it (expensive but safe)
        if not created_at:
            resp = listings_table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key('listing_id').eq(listing_id)
            )
            if not resp['Items']:
                return {'statusCode': 404, 'body': json.dumps({'error': 'Listing not found'})}
            created_at = resp['Items'][0]['created_at']

        # 1. Record view (same logic)
        timestamp = datetime.utcnow().isoformat()
        is_unique = False
        
        try:
            views_table.put_item(
                Item={
                    'listing_id': listing_id,
                    'viewer_id': viewer_id or f'anon_{timestamp}', # Ensure unique SK if anonymous
                    'timestamp': timestamp
                },
                ConditionExpression='attribute_not_exists(viewer_id)'
            )
            is_unique = True
        except ClientError as e:
            if e.response['Error']['Code'] != 'ConditionalCheckFailedException':
                pass # Already viewed
            else:
                # If anonymous, we might want to count it as unique? 
                # For now, assuming viewer_id is consistent for users.
                pass

        # 2. Update counters
        update_expr = "SET view_count = if_not_exists(view_count, :start) + :inc"
        expr_values = {':inc': 1, ':start': 0}
        
        if is_unique:
            update_expr += ", unique_view_count = if_not_exists(unique_view_count, :start) + :inc"

        listings_table.update_item(
            Key={
                'listing_id': listing_id,
                'created_at': created_at
            },
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values
        )

        return {'statusCode': 200, 'body': json.dumps({'success': True})}

    except Exception as e:
        print(f"Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
