import json
import boto3
import os
import joblib
import csv
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error
import tempfile

def load_csv_data(s3_client, bucket, key):
    obj = s3_client.get_object(Bucket=bucket, Key=key)
    lines = obj['Body'].read().decode('utf-8').splitlines()
    reader = csv.DictReader(lines)
    
    # Automatically detect columns excluding 'price'
    fieldnames = reader.fieldnames
    feature_cols = [f for f in fieldnames if f != 'price']
    
    X = []
    y = []
    for row in reader:
        X.append([float(row[f]) for f in feature_cols])
        y.append(float(row['price']))
    return np.array(X), np.array(y), feature_cols

def lambda_handler(event, context):
    s3 = boto3.client('s3')
    data_bucket = os.environ['DATA_BUCKET']
    model_bucket = os.environ['MODEL_BUCKET']
    
    if 'readResult' in event:
        train_key = event['readResult']['train_data']
        test_key = event['readResult']['test_data']
        # We also need to promote metadata to model bucket so inference can use it
        meta_key = event['readResult'].get('metadata_key')
    else:
        train_key = event['train_data']
        test_key = event['test_data']
        meta_key = event.get('metadata_key')

    print(f"Training on {train_key}")
    X_train, y_train, features = load_csv_data(s3, data_bucket, train_key)
    X_test, y_test, _ = load_csv_data(s3, data_bucket, test_key)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    rmse = float(mean_squared_error(y_test, predictions, squared=False))
    mae = float(mean_absolute_error(y_test, predictions))
    
    timestamp = train_key.split('/')[1]
    
    # Save Model
    with tempfile.NamedTemporaryFile() as tf:
        joblib.dump(model, tf.name)
        tf.seek(0)
        model_key = f"models/{timestamp}/model.joblib"
        s3.upload_file(tf.name, model_bucket, model_key)
        
    # Copy metadata to model folder for tracking
    if meta_key:
        copy_source = {'Bucket': data_bucket, 'Key': meta_key}
        s3.copy(copy_source, model_bucket, f"models/{timestamp}/metadata.json")

    print(f"RMSE: {rmse}")
    return {
        "modelMetrics": {"rmse": rmse, "mae": mae},
        "modelPath": model_key,
        "metadataPath": f"models/{timestamp}/metadata.json",
        "timestamp": timestamp
    }
