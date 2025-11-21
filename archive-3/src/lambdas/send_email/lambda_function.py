import json
import boto3
import os

def lambda_handler(event, context):
    try:
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        email = body.get('email')
        estimate = body.get('estimate')
        details = body.get('details', {})
        
        if not email or not estimate:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Missing email or estimate'})}

        ses = boto3.client('ses', region_name='us-east-1')
        sender = os.environ.get('SENDER_EMAIL', 'housing-predictor@example.com')

        subject = "Your Barcelona Property Valuation Report"
        
        html_body = f"""
        <html>
        <body>
            <h1>Property Valuation Report</h1>
            <p>Thank you for using our Barcelona Housing Predictor.</p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h2 style="color: #0284c7; margin-top: 0;">Estimated Value: €{estimate:,}</h2>
                <p><strong>Address:</strong> {details.get('input_features', {}).get('address', 'N/A')}</p>
                <p><strong>Neighborhood:</strong> {details.get('inferred_neighborhood', 'Unknown')}</p>
                <p><strong>Size:</strong> {details.get('input_features', {}).get('sqm', 0)} m²</p>
            </div>
            
            <h3>Property Features</h3>
            <ul>
                <li>Bedrooms: {details.get('input_features', {}).get('bedrooms')}</li>
                <li>Bathrooms: {details.get('input_features', {}).get('bathrooms')}</li>
                <li>Elevator: {'Yes' if details.get('input_features', {}).get('has_elevator') else 'No'}</li>
                <li>Pool: {'Yes' if details.get('input_features', {}).get('has_pool') else 'No'}</li>
            </ul>
            
            <p style="font-size: 12px; color: #666;">
                This is an automated estimate based on market data. It is not an official appraisal.
            </p>
        </body>
        </html>
        """

        ses.send_email(
            Source=sender,
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {'Data': subject},
                'Body': {
                    'Html': {'Data': html_body}
                }
            }
        )

        return {
            'statusCode': 200,
             'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps({'message': 'Email sent successfully'})
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

