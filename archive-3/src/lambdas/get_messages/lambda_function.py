import json
import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
conversations_table = dynamodb.Table(os.environ['CONVERSATIONS_TABLE'])

def lambda_handler(event, context):
    try:
        # Handle CORS preflight
        if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
            return build_response({"message": "ok"})

        # Get conversation_id from query parameters
        query_params = event.get("queryStringParameters", {}) or {}
        conversation_id = query_params.get("conversation_id")
        
        if not conversation_id:
            return build_response({"error": "conversation_id is required"}, 400)
        
        # Query all messages for this conversation
        response = conversations_table.query(
            KeyConditionExpression=Key('conversation_id').eq(conversation_id),
            ScanIndexForward=True  # Sort by timestamp ascending (oldest first)
        )
        
        messages = response.get('Items', [])
        
        return build_response({
            'messages': messages,
            'count': len(messages)
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return build_response({'error': str(e)}, 500)

def build_response(payload, status_code=200):
    return {
        'statusCode': status_code,
        'body': json.dumps(payload, default=str)
    }

