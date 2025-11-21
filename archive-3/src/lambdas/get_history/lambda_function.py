import json
import boto3
import os
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    try:
        table_name = os.environ.get('TABLE_NAME')
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(table_name)

        # Fetch last 10 items (Scan is okay for small demo tables, Query is better for prod)
        # For a real app, we'd query by User ID. Here we just show global recent activity.
        response = table.scan(Limit=10)
        items = response.get('Items', [])

        # Sort by timestamp descending
        items.sort(key=lambda x: x.get('timestamp', ''), reverse=True)

        # Decimal to float/int for JSON serialization
        def clean_decimal(obj):
            if isinstance(obj, list):
                return [clean_decimal(i) for i in obj]
            elif isinstance(obj, dict):
                return {k: clean_decimal(v) for k, v in obj.items()}
            elif hasattr(obj, 'to_eng_string'): # check for Decimal
                return float(obj)
            else:
                return obj

        cleaned_items = clean_decimal(items)

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,GET'
            },
            'body': json.dumps(cleaned_items)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

