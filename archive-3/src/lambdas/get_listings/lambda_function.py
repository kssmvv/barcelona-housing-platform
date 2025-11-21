import json
import os
import boto3
from decimal import Decimal

# Helper to convert Decimal to float/int for JSON serialization
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    # Handle OPTIONS (CORS preflight)
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
        if not table_name:
            return {'statusCode': 500, 'body': json.dumps({'error': 'Table name not configured'})}

        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(table_name)

        # Check for owner_id filter
        query_params = event.get("queryStringParameters", {}) or {}
        owner_id_filter = query_params.get("owner_id")

        scan_kwargs = {
            'Limit': 100
        }
        
        if owner_id_filter:
            from boto3.dynamodb.conditions import Attr
            scan_kwargs['FilterExpression'] = Attr('owner_id').eq(owner_id_filter)

        # Scan table
        response = table.scan(**scan_kwargs)
        items = response.get('Items', [])

        return {
            'statusCode': 200,
            'body': json.dumps(items, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

