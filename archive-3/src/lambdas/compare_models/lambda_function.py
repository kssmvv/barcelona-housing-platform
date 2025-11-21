import json
import boto3
import os

def lambda_handler(event, context):
    s3 = boto3.client('s3')
    bucket = os.environ['MODEL_BUCKET']
    
    new_metrics = event['trainResult']['modelMetrics']
    new_rmse = new_metrics['rmse']
    
    baseline_key = "metrics/baseline.json"
    
    try:
        obj = s3.get_object(Bucket=bucket, Key=baseline_key)
        baseline_data = json.loads(obj['Body'].read())
        baseline_rmse = baseline_data.get('rmse', float('inf'))
    except:
        # No baseline exists, so new model is automatically better
        print("No baseline found. New model is better by default.")
        return {"isBetter": True, "metrics": new_metrics}
        
    print(f"Comparing New RMSE ({new_rmse}) vs Baseline RMSE ({baseline_rmse})")
    
    if new_rmse < baseline_rmse:
        return {"isBetter": True, "metrics": new_metrics}
    else:
        return {"isBetter": False, "metrics": baseline_data}

