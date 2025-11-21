import json
import math
import urllib.request
import urllib.parse
import os
import boto3
import joblib
import tempfile
import numpy as np
import uuid
from datetime import datetime

# --- 1. Static Data Loading (For Geocoding & Basic Lookups) ---

def load_json(filename):
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return []

try:
    PRICING_LOGIC = load_json('pricing_logic.json')
    NEIGHBORHOOD_PRICES = load_json('bcn_neighborhood_prices.json')
    
    # Map Neighborhood Name -> Data (including district)
    NEIGHBORHOOD_MAP = {item['neighborhood']: item for item in NEIGHBORHOOD_PRICES}
except Exception as e:
    print(f"Error loading local data: {e}")
    PRICING_LOGIC = {}
    NEIGHBORHOOD_MAP = {}

# --- 2. Dynamic Model Loading (From S3) ---

model = None
metadata = None

def load_model_resources():
    global model, metadata
    if model and metadata:
        return
        
    s3 = boto3.client('s3')
    bucket = os.environ.get('MODEL_BUCKET')
    if not bucket:
        print("MODEL_BUCKET not set")
        return

    # Load Model
    try:
        with tempfile.NamedTemporaryFile() as tf:
            s3.download_file(bucket, "production/model.joblib", tf.name)
            model = joblib.load(tf.name)
    except Exception as e:
        print(f"Error loading model from S3: {e}")
        
    # Load Metadata
    try:
        obj = s3.get_object(Bucket=bucket, Key="production/metadata.json")
        metadata = json.loads(obj['Body'].read().decode('utf-8'))
    except Exception as e:
        print(f"Error loading metadata from S3: {e}")
        metadata = {}

# --- 3. Geocoding & Neighborhood Resolution ---

def get_coordinates(address):
    try:
        full_address = f"{address}, Barcelona, Spain"
        url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({
            'q': full_address, 'format': 'json', 'limit': 1
        })
        headers = {'User-Agent': 'BCN_Housing_Price_Estimator_Student_Project/1.0'}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"Geocoding error: {e}")
    return None

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def find_nearest_neighborhood(lat, lon):
    if not PRICING_LOGIC or 'neighborhood_locator' not in PRICING_LOGIC:
        return None
    locator = PRICING_LOGIC['neighborhood_locator']
    nearest = None
    min_dist = float('inf')
    for point in locator:
        try:
            dist = haversine_km(lat, lon, point['latitude'], point['longitude'])
            if dist < min_dist:
                min_dist = dist
                nearest = point['neighborhood']
        except: continue
    return nearest

# --- 4. Feature Engineering (Heuristics matching Fetch Data) ---

def get_heuristics(dist_center_km, district):
    walk_base = max(55, 95 - dist_center_km * 4.5)
    walk_score = int(max(40, min(100, walk_base)))
    
    district_bias = {
        "1": 60, "2": 75, "3": 65, "4": 80, "5": 85,
        "6": 78, "7": 70, "8": 60, "9": 68, "10": 72,
    }
    safety_base = district_bias.get(str(district), 70)
    safety_score = int(max(35, min(95, safety_base)))
    
    amenities_base = 82 - dist_center_km * 4
    amenities_score = int(max(45, min(95, amenities_base)))
    
    distance_metro_min = max(1, int(5 - dist_center_km * 0.3))
    
    return {
        'walk_score': walk_score,
        'safety_score': safety_score,
        'amenities_score': amenities_score,
        'distance_metro_min': distance_metro_min
    }

# --- 5. Database Persistence ---

def save_to_dynamodb(prediction, input_data, neighborhood, lat, lon):
    table_name = os.environ.get('TABLE_NAME')
    if not table_name:
        return
        
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(table_name)
        
        # Create numeric timestamps and string ID
        item = {
            'estimate_id': str(uuid.uuid4()),
            'timestamp': datetime.utcnow().isoformat(),
            'estimated_price': int(prediction),
            'neighborhood': neighborhood,
            'input_features': json.loads(json.dumps(input_data, default=str)), # Sanitize float/decimals
            'coordinates': {'lat': str(lat), 'lon': str(lon)}
        }
        
        # Helper to convert floats to Decimal for DynamoDB
        from decimal import Decimal
        def float_to_decimal(obj):
            if isinstance(obj, float):
                return Decimal(str(obj))
            if isinstance(obj, dict):
                return {k: float_to_decimal(v) for k, v in obj.items()}
            return obj
            
        table.put_item(Item=float_to_decimal(item))
        
    except Exception as e:
        print(f"Error saving to DynamoDB: {e}")

# --- 6. Main Handler ---

def lambda_handler(event, context):
    load_model_resources()
    
    try:
        if 'body' in event:
            body = event['body']
            if isinstance(body, str):
                body = json.loads(body)
        else:
            body = event

        address = body.get('address')
        sqm = float(body.get('sqm', 80))
        
        # 1. Resolve Location
        neighborhood = None
        lat, lon = 0.0, 0.0
        if address:
            coords = get_coordinates(address)
            if coords:
                lat, lon = coords
                neighborhood = find_nearest_neighborhood(lat, lon)
        
        if not neighborhood:
            neighborhood = body.get('neighborhood', "la Dreta de l'Eixample")
            
        nb_info = NEIGHBORHOOD_MAP.get(neighborhood, {})
        district = nb_info.get('district', "2")
        
        # 2. Feature Calculation
        CBD_COORD = (41.387, 2.170)
        if lat and lon:
            dist_center_km = haversine_km(lat, lon, CBD_COORD[0], CBD_COORD[1])
        else:
            dist_center_km = 1.5
            
        heuristics = get_heuristics(dist_center_km, district)
        
        # 3. Construct Input Vector
        if not metadata or 'feature_columns' not in metadata:
            raise ValueError("Model metadata not available.")
            
        feature_cols = metadata['feature_columns']
        input_vector = []
        
        nb_map = metadata.get('neighborhood_map', {})
        floor_map = metadata.get('floor_plan_map', {})
        build_map = metadata.get('building_type_map', {})
        cond_map = metadata.get('condition_map', {})
        mat_map = metadata.get('material_map', {})
        
        def encode(val, mapping, default_key='Unknown'):
            return float(mapping.get(val, mapping.get(default_key, 0)))
            
        input_data = {
            'neighborhood_encoded': encode(neighborhood, nb_map),
            'sqm': sqm,
            'bedrooms': float(body.get('bedrooms', 2)),
            'bathrooms': float(body.get('bathrooms', 1)),
            'floor': 2.0,
            'year_built': 1990.0,
            'renovation_years_ago': 5.0,
            'condition_encoded': encode('Good', cond_map),
            'material_encoded': encode('Standard', mat_map),
            'floor_plan_encoded': encode('Traditional', floor_map),
            'building_type_encoded': encode('Condo', build_map),
            'has_elevator': 1.0 if body.get('has_elevator') else 0.0,
            'has_ac': 1.0 if body.get('has_ac') else 0.0,
            'has_fireplace': 0.0,
            'has_balcony': 0.0,
            'has_terrace': 1.0 if body.get('has_terrace') else 0.0,
            'terrace_sqm': 15.0 if body.get('has_terrace') else 0.0,
            'parking_spots': 0.0,
            'has_pool': 1.0 if body.get('has_pool') else 0.0,
            'has_gym': 0.0,
            'has_doorman': 0.0,
            'hoa_monthly_eur': 100.0,
            'property_tax_rate_pct': 1.0,
            'distance_cbd_km': dist_center_km,
            'distance_metro_min': heuristics['distance_metro_min'],
            'walk_score': heuristics['walk_score'],
            'safety_score': heuristics['safety_score'],
            'amenities_score': heuristics['amenities_score'],
            # Extra metadata for frontend/DB (not used in prediction)
            'address': address 
        }
        
        for col in feature_cols:
            val = input_data.get(col, 0.0)
            input_vector.append(val)
            
        # 4. Predict
        if model:
            prediction = model.predict([input_vector])[0]
        else:
            base = nb_info.get('price_2025_eur_sqm', 4000)
            prediction = base * sqm
            
        # 5. Save to DB
        save_to_dynamodb(prediction, input_data, neighborhood, lat, lon)
            
        return {
            'statusCode': 200,
            'body': json.dumps({
                'estimated_price': round(prediction, 0),
                'price_per_sqm': round(prediction / sqm, 0),
                'details': {
                    'inferred_neighborhood': neighborhood,
                    'coordinates': {'lat': lat, 'lon': lon},
                    'model_used': 'RandomForest (Online)' if model else 'Fallback (Rule-Based)',
                    'input_features': input_data
                }
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
