import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
conversations_table = dynamodb.Table(os.environ['CONVERSATIONS_TABLE'])
user_conversations_table = dynamodb.Table(os.environ['USER_CONVERSATIONS_TABLE'])

def lambda_handler(event, context):
    try:
        # Handle CORS preflight
        if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
            return build_response({"message": "ok"})

        body = json.loads(event.get("body", "{}"))
        
        # Extract parameters
        sender_id = body.get("sender_id")
        listing_id = body.get("listing_id")
        owner_id = body.get("owner_id")
        message = body.get("message", "").strip()
        listing_address = body.get("listing_address", "")
        listing_neighborhood = body.get("listing_neighborhood", "")
        
        # Validation
        if not all([sender_id, listing_id, owner_id, message]):
            return build_response({"error": "Missing required fields"}, 400)
        
        # Create conversation_id (sorted to ensure consistency)
        participants = sorted([sender_id, owner_id])
        conversation_id = f"listing_{listing_id}_{participants[0]}_{participants[1]}"
        
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Store message in conversations table
        conversations_table.put_item(Item={
            'conversation_id': conversation_id,
            'timestamp': timestamp,
            'sender_id': sender_id,
            'message': message,
            'listing_id': listing_id,
            'listing_address': listing_address,
            'listing_neighborhood': listing_neighborhood
        })
        
        # Update user_conversations index for sender
        update_user_conversation(
            user_id=sender_id,
            conversation_id=conversation_id,
            other_user_id=owner_id,
            timestamp=timestamp,
            listing_address=listing_address,
            listing_neighborhood=listing_neighborhood,
            is_sender=True
        )
        
        # Update user_conversations index for recipient
        update_user_conversation(
            user_id=owner_id,
            conversation_id=conversation_id,
            other_user_id=sender_id,
            timestamp=timestamp,
            listing_address=listing_address,
            listing_neighborhood=listing_neighborhood,
            is_sender=False
        )
        
        return build_response({
            'success': True,
            'conversation_id': conversation_id,
            'timestamp': timestamp
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return build_response({'error': str(e)}, 500)

def update_user_conversation(user_id, conversation_id, other_user_id, timestamp, 
                             listing_address, listing_neighborhood, is_sender):
    """Update or create user conversation index entry"""
    try:
        # Try to get existing conversation
        response = user_conversations_table.get_item(
            Key={
                'user_id': user_id,
                'last_message_timestamp': timestamp
            }
        )
        
        # Check if conversation exists for this user
        existing = None
        try:
            query_response = user_conversations_table.query(
                KeyConditionExpression='user_id = :uid',
                FilterExpression='conversation_id = :cid',
                ExpressionAttributeValues={
                    ':uid': user_id,
                    ':cid': conversation_id
                },
                Limit=1
            )
            if query_response['Items']:
                existing = query_response['Items'][0]
        except:
            pass
        
        # Delete old entry if exists (to update timestamp)
        if existing:
            user_conversations_table.delete_item(
                Key={
                    'user_id': user_id,
                    'last_message_timestamp': existing['last_message_timestamp']
                }
            )
        
        # Create new entry with updated timestamp
        unread_count = 0 if is_sender else (existing.get('unread_count', 0) + 1 if existing else 1)
        
        user_conversations_table.put_item(Item={
            'user_id': user_id,
            'last_message_timestamp': timestamp,
            'conversation_id': conversation_id,
            'other_user_id': other_user_id,
            'listing_address': listing_address,
            'listing_neighborhood': listing_neighborhood,
            'unread_count': unread_count
        })
        
    except Exception as e:
        print(f"Error updating user conversation: {e}")
        # Don't fail the whole request if index update fails
        pass

def build_response(payload, status_code=200):
    return {
        'statusCode': status_code,
        'body': json.dumps(payload, default=str)
    }

