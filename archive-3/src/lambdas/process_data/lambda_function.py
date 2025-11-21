import json
import boto3
import os
import csv
import io
import random
from datetime import datetime


def safe_float(value, default=0.0):
    try:
        if value in ("", None):
            return default
        return float(value)
    except (ValueError, TypeError):
        return default


def encode_with_map(value, mapping):
    if value not in mapping:
        mapping[value] = len(mapping) + 1
    return mapping[value]


def lambda_handler(event, context):
    s3 = boto3.client('s3')
    bucket_name = os.environ['DATA_BUCKET']
    
    input_key = None
    if 's3_key' in event:
        input_key = event['s3_key']
    elif 'fetchResult' in event and 's3_key' in event['fetchResult']:
        input_key = event['fetchResult']['s3_key']
        
    if not input_key:
        response = s3.list_objects_v2(Bucket=bucket_name, Prefix='raw/')
        if 'Contents' in response:
            latest = max(response['Contents'], key=lambda x: x['LastModified'])
            input_key = latest['Key']
        else:
            raise Exception("No data found")

    print(f"Processing {input_key}")
    obj = s3.get_object(Bucket=bucket_name, Key=input_key)
    lines = obj['Body'].read().decode('utf-8').splitlines()
    reader = csv.DictReader(lines)
    data = list(reader)
    
    # Prepare for training
    # We need to encode the neighborhood. 
    # Since the neighborhood list is dynamic (from API), we should probably use hash encoding or frequency encoding in a real system.
    # For simplicity here, we'll build a dynamic map from the data itself.
    
    nb_map = {}
    floor_plan_map = {}
    building_type_map = {}
    condition_map = {}
    material_map = {}
    current_year = datetime.now().year
    
    # Save this map to S3 so inference can use it? 
    # Ideally yes. For now, inference will re-learn or we stick to known list.
    # To make it robust, let's save metadata.
    
    processed_data = []
    for row in data:
        neighborhood = row.get('neighborhood', 'Unknown')
        year_built = safe_float(row.get('year_built'), 1970)
        year_renovated = safe_float(row.get('year_renovated'), year_built)
        renovation_years_ago = max(0.0, current_year - year_renovated)
        condition_label = row.get('condition', 'Unknown')
        material_label = row.get('material_quality', 'Unknown')
        floor_plan = row.get('floor_plan', 'Traditional')
        building_type = row.get('building_type', 'Condo')

        new_row = {
            'neighborhood_encoded': encode_with_map(neighborhood, nb_map),
            'sqm': safe_float(row.get('sqm'), 80),
            'bedrooms': safe_float(row.get('bedrooms'), 2),
            'bathrooms': safe_float(row.get('bathrooms'), 1),
            'floor': safe_float(row.get('floor'), 1),
            'year_built': year_built,
            'renovation_years_ago': renovation_years_ago,
            'condition_encoded': encode_with_map(condition_label, condition_map),
            'material_encoded': encode_with_map(material_label, material_map),
            'floor_plan_encoded': encode_with_map(floor_plan, floor_plan_map),
            'building_type_encoded': encode_with_map(building_type, building_type_map),
            'has_elevator': safe_float(row.get('has_elevator')),
            'has_ac': safe_float(row.get('has_ac')),
            'has_fireplace': safe_float(row.get('has_fireplace')),
            'has_balcony': safe_float(row.get('has_balcony')),
            'has_terrace': safe_float(row.get('has_terrace')),
            'terrace_sqm': safe_float(row.get('terrace_sqm')),
            'parking_spots': safe_float(row.get('parking_spots')),
            'has_pool': safe_float(row.get('has_pool')),
            'has_gym': safe_float(row.get('has_gym')),
            'has_doorman': safe_float(row.get('has_doorman')),
            'hoa_monthly_eur': safe_float(row.get('hoa_monthly_eur')),
            'property_tax_rate_pct': safe_float(row.get('property_tax_rate_pct')),
            'distance_cbd_km': safe_float(row.get('distance_cbd_km')),
            'distance_metro_min': safe_float(row.get('distance_metro_min')),
            'walk_score': safe_float(row.get('walk_score')),
            'safety_score': safe_float(row.get('safety_score')),
            'amenities_score': safe_float(row.get('amenities_score')),
            'price': safe_float(row.get('price'))
        }
        processed_data.append(new_row)
            
    # Save metadata
    metadata = {
        'neighborhood_map': nb_map,
        'floor_plan_map': floor_plan_map,
        'building_type_map': building_type_map,
        'condition_map': condition_map,
        'material_map': material_map,
        'feature_columns': [k for k in processed_data[0].keys() if k != 'price']
    }
    timestamp = input_key.split('/')[1]
    s3.put_object(Bucket=bucket_name, Key=f"processed/{timestamp}/metadata.json", Body=json.dumps(metadata))
    
    # Split
    random.seed(42)
    random.shuffle(processed_data)
    split = int(len(processed_data) * 0.8)
    
    def write_csv(data_list, key):
        if not data_list: return
        out = io.StringIO()
        writer = csv.DictWriter(out, fieldnames=data_list[0].keys())
        writer.writeheader()
        writer.writerows(data_list)
        s3.put_object(Bucket=bucket_name, Key=key, Body=out.getvalue())
        
    train_key = f"processed/{timestamp}/train.csv"
    test_key = f"processed/{timestamp}/test.csv"
    
    write_csv(processed_data[:split], train_key)
    write_csv(processed_data[split:], test_key)
    
    return {
        "train_data": train_key,
        "test_data": test_key,
        "metadata_key": f"processed/{timestamp}/metadata.json"
    }
