import json
import os
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    # CORS Preflight
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
        table_name = os.environ.get('TABLE_NAME')
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(table_name)

        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        listing_id = body.get('listing_id')

        if not user_id or not listing_id:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Missing user_id or listing_id'})}

        # Check if already exists
        response = table.get_item(
            Key={
                'user_id': user_id,
                'listing_id': listing_id
            }
        )

        if 'Item' in response:
            # Remove favorite
            table.delete_item(
                Key={
                    'user_id': user_id,
                    'listing_id': listing_id
                }
            )
            is_favorited = False
        else:
            # Add favorite
            table.put_item(
                Item={
                    'user_id': user_id,
                    'listing_id': listing_id,
                    'timestamp': datetime.utcnow().isoformat()
                }
            )
            is_favorited = True

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'is_favorited': is_favorited,
                'listing_id': listing_id
            })
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

