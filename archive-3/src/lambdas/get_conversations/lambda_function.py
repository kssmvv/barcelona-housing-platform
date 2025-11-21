import json
import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
user_conversations_table = dynamodb.Table(os.environ['USER_CONVERSATIONS_TABLE'])

def lambda_handler(event, context):
    try:
        # Handle CORS preflight
        if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
            return build_response({"message": "ok"})

        # Get user_id from query parameters
        query_params = event.get("queryStringParameters", {}) or {}
        user_id = query_params.get("user_id")
        
        if not user_id:
            return build_response({"error": "user_id is required"}, 400)
        
        # Query all conversations for this user
        response = user_conversations_table.query(
            KeyConditionExpression=Key('user_id').eq(user_id),
            ScanIndexForward=False,  # Sort by timestamp descending (newest first)
            Limit=50  # Limit to 50 most recent conversations
        )
        
        conversations = response.get('Items', [])
        
        return build_response({
            'conversations': conversations,
            'count': len(conversations)
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return build_response({'error': str(e)}, 500)

def build_response(payload, status_code=200):
    return {
        'statusCode': status_code,
        'body': json.dumps(payload, default=str)
    }

