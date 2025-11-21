import json
import boto3
import os

def lambda_handler(event, context):
    s3 = boto3.client('s3')
    bucket = os.environ['MODEL_BUCKET']
    
    # Inputs
    model_path = event['trainResult']['modelPath']
    meta_path = event['trainResult'].get('metadataPath')
    
    # Promote Model
    copy_source = {'Bucket': bucket, 'Key': model_path}
    s3.copy(copy_source, bucket, "production/model.joblib")
    
    # Promote Metadata
    if meta_path:
        copy_meta = {'Bucket': bucket, 'Key': meta_path}
        s3.copy(copy_meta, bucket, "production/metadata.json")
        
    return {
        "status": "promoted",
        "production_model": "production/model.joblib"
    }
