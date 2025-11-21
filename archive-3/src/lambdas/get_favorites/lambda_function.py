import json
import os
import boto3
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

        query_params = event.get('queryStringParameters', {}) or {}
        user_id = query_params.get('user_id')

        if not user_id:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Missing user_id'})}

        response = table.query(
            KeyConditionExpression=Key('user_id').eq(user_id)
        )

        items = response.get('Items', [])
        # Return list of listing IDs
        favorites = [item['listing_id'] for item in items]

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'favorites': favorites
            })
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

