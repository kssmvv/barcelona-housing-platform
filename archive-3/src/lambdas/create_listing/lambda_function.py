import json
import os
import boto3
import uuid
import datetime
from decimal import Decimal

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
        # Parse Body
        if 'body' in event:
            body = event['body']
            if isinstance(body, str):
                body = json.loads(body)
        else:
            body = event

        # Validation
        required_fields = ['address', 'neighborhood', 'price', 'features', 'contact']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f"Missing required field: {field}"})
                }

        # --- 1. Get AI Valuation ---
        ai_price = None
        valuation_status = "Unknown"
        
        try:
            lambda_client = boto3.client('lambda')
            inference_func = os.environ.get('INFERENCE_FUNC')
            
            if inference_func:
                # Prepare payload for inference lambda (it expects a similar structure)
                inference_payload = {
                    'address': body['address'],
                    'neighborhood': body['neighborhood'],
                    'sqm': body['features']['sqm'],
                    'bedrooms': body['features']['bedrooms'],
                    'bathrooms': body['features']['bathrooms'],
                    # Pass through other features if available in UI
                    'has_elevator': body['features'].get('has_elevator', False),
                    'has_pool': body['features'].get('has_pool', False),
                    'has_ac': body['features'].get('has_ac', False),
                    'has_terrace': body['features'].get('has_terrace', False),
                }
                
                response = lambda_client.invoke(
                    FunctionName=inference_func,
                    InvocationType='RequestResponse',
                    Payload=json.dumps(inference_payload)
                )
                
                inference_result = json.loads(response['Payload'].read())
                if 'body' in inference_result:
                    body_content = json.loads(inference_result['body'])
                    ai_price = body_content.get('estimated_price')
                    
                    if ai_price:
                        asking_price = float(body['price'])
                        diff_pct = ((asking_price - ai_price) / ai_price) * 100
                        
                        if diff_pct > 10:
                            valuation_status = "Overpriced"
                        elif diff_pct < -10:
                            valuation_status = "Good Deal"
                        else:
                            valuation_status = "Fair Price"
                            
        except Exception as e:
            print(f"Inference failed: {e}")

        # --- 2. Prepare Item for DynamoDB ---
        listing_id = str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow().isoformat()
        
        # Helper to convert floats to Decimal
        def float_to_decimal(obj):
            if isinstance(obj, float):
                return Decimal(str(obj))
            if isinstance(obj, dict):
                return {k: float_to_decimal(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [float_to_decimal(v) for v in obj]
            return obj

        item = {
            'listing_id': listing_id,
            'owner_id': body.get('owner_id', 'anonymous'),  # Capture owner_id
            'created_at': timestamp,
            'address': body['address'],
            'neighborhood': body['neighborhood'],
            'price': float_to_decimal(body['price']),
            'features': float_to_decimal(body['features']),
            'contact': body['contact'],
            'description': body.get('description', ''),
            'coordinates': float_to_decimal(body.get('coordinates', {})),
            # Auction Fields
            'sale_type': body.get('sale_type', 'fixed'), # fixed or auction
            'auction_end_time': body.get('auction_end_time'),
            'starting_bid': float_to_decimal(body.get('starting_bid', 0)) if body.get('sale_type') == 'auction' else None,
            'current_highest_bid': float_to_decimal(body.get('starting_bid', 0)) if body.get('sale_type') == 'auction' else None,
            'bid_count': 0 if body.get('sale_type') == 'auction' else None,
            # New AI Fields
            'ai_valuation': {
                'estimated_price': float_to_decimal(ai_price) if ai_price else None,
                'status': valuation_status,
                'diff_pct': float_to_decimal(diff_pct) if ai_price else None
            }
        }

        # --- 3. Save to DynamoDB ---
        table_name = os.environ.get('TABLE_NAME')
        if table_name:
            dynamodb = boto3.resource('dynamodb')
            table = dynamodb.Table(table_name)
            table.put_item(Item=item)
            
            # --- 4. Check Retraining Trigger ---
            try:
                # Simplified counter check: scan count (in prod, use a separate counter item)
                count = table.scan(Select='COUNT')['Count']
                threshold = int(os.environ.get('RETRAIN_THRESHOLD', 50))
                
                if count % threshold == 0:
                    sfn = boto3.client('stepfunctions')
                    sfn_arn = os.environ.get('STATE_MACHINE_ARN')
                    if sfn_arn:
                        sfn.start_execution(
                            stateMachineArn=sfn_arn,
                            input=json.dumps({'trigger': 'listing_threshold', 'count': count})
                        )
                        print(f"Triggered retraining at {count} listings")
            except Exception as e:
                print(f"Retraining trigger failed: {e}")

        return {
            'statusCode': 201,
            'body': json.dumps({
                'message': 'Listing created successfully',
                'listing_id': listing_id,
                'ai_valuation': {
                    'status': valuation_status,
                    'estimated_price': ai_price
                }
            })
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
