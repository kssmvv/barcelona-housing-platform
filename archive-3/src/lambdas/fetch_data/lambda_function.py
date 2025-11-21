import csv
import io
import json
import math
import os
import random
from datetime import datetime
import boto3
import numpy as np

MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
BASELINE_PATH = os.path.join(MODULE_DIR, "bcn_neighborhood_prices.json")
if not os.path.exists(BASELINE_PATH):
    raise FileNotFoundError(
        "Missing bcn_neighborhood_prices.json inside the fetch_data package. "
        "Run scripts/build_bcn_baseline.py and copy the result into src/lambdas/fetch_data/."
    )

with open(BASELINE_PATH, encoding="utf-8") as f:
    BASELINE_DATA = json.load(f)

CBD_COORD = (41.387, 2.170)
DISTRICT_COORDS = {
    "1": (41.380, 2.174),
    "2": (41.391, 2.164),
    "3": (41.373, 2.149),
    "4": (41.385, 2.133),
    "5": (41.401, 2.139),
    "6": (41.407, 2.154),
    "7": (41.429, 2.153),
    "8": (41.447, 2.177),
    "9": (41.435, 2.197),
    "10": (41.417, 2.216),
}


def haversine_km(coord1, coord2):
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def pick_neighborhood_entry():
    weights = [max(1, entry["price_2025_eur_sqm"]) for entry in BASELINE_DATA]
    return random.choices(BASELINE_DATA, weights=weights, k=1)[0]


def random_walk_score(dist_center_km):
    base = max(55, 95 - dist_center_km * 4.5)
    return int(max(40, min(100, random.gauss(base, 5))))


def random_safety_score(district):
    district_bias = {
        "1": 60, "2": 75, "3": 65, "4": 80, "5": 85,
        "6": 78, "7": 70, "8": 60, "9": 68, "10": 72,
    }
    base = district_bias.get(district, 70)
    return int(max(35, min(95, random.gauss(base, 6))))


def generate_apartment(entry):
    neighborhood = entry["neighborhood"]
    base_price_sqm = entry["price_2025_eur_sqm"]
    district = entry["district"]
    coords = DISTRICT_COORDS.get(district, CBD_COORD)
    dist_center_km = round(haversine_km(coords, CBD_COORD), 2) + random.uniform(-0.3, 0.3)
    dist_center_km = max(0.3, dist_center_km)

    sqm = int(np.random.normal(95, 35))
    sqm = max(35, min(sqm, 280))

    bedrooms = max(1, int(round(sqm / random.choice([25, 30, 32, 35]))))
    bathrooms = max(1, min(4, int(math.ceil(bedrooms / 1.5))))

    floor = random.choices(range(11), weights=[8, 12, 12, 12, 10, 10, 10, 8, 6, 6, 6])[0]
    floor_plan = random.choice(["Traditional", "Open", "Loft", "Duplex"])
    building_type = random.choice(["Condo", "Modernista", "Loft Conversion", "New Development"])

    current_year = datetime.now().year
    year_built = int(np.random.triangular(1890, 1975, 2024))
    renovation_recent = random.random() > 0.4
    year_renovated = year_built if not renovation_recent else random.randint(max(year_built, 1960), current_year)
    condition = random.choices(["Excellent", "Good", "Average", "Needs Repair"], weights=[25, 45, 20, 10])[0]
    material_quality = random.choice(["Premium", "Contemporary", "Standard", "Basic"])

    has_elevator = bool(floor <= 1 or random.random() > 0.2)
    has_ac = random.random() > 0.25
    has_fireplace = random.random() > 0.7
    has_balcony = random.random() > 0.5
    has_terrace = random.random() > 0.65 or floor in (0, 10)
    terrace_sqm = int(np.random.exponential(12)) + 5 if has_terrace else 0
    parking_spots = random.choices([0, 1, 2], weights=[60, 30, 10])[0]
    has_pool = random.random() > 0.8
    has_gym = random.random() > 0.6
    has_doorman = random.random() > 0.5

    hoa_fees = random.randint(40, 250) * (1 + has_pool * 0.3 + has_gym * 0.2)
    property_tax_rate = round(random.uniform(0.8, 1.2), 2)

    distance_metro_min = max(1, int(random.gauss(5 - dist_center_km * 0.3, 2)))
    walk_score = random_walk_score(dist_center_km)
    safety_score = random_safety_score(district)
    amenities_score = int(max(45, min(95, random.gauss(82 - dist_center_km * 4, 6))))

    price = base_price_sqm * sqm
    if floor == 0:
        price *= 0.92
    elif floor >= 9:
        price *= 1.18
    else:
        price *= (1 + floor * 0.006)

    condition_factor = {"Excellent": 1.12, "Good": 1.04, "Average": 0.95, "Needs Repair": 0.82}[condition]
    material_factor = {"Premium": 1.08, "Contemporary": 1.03, "Standard": 0.98, "Basic": 0.93}[material_quality]
    price *= condition_factor * material_factor

    if not has_elevator and floor > 2:
        price *= 0.88
    if has_ac:
        price += 4000
    if has_fireplace:
        price += 2500
    if has_balcony:
        price += 1500
    if has_terrace:
        price += terrace_sqm * (base_price_sqm * 0.45)
    if parking_spots:
        price += parking_spots * 28000
    if has_pool:
        price += 18000
    if has_gym:
        price += 8000
    if has_doorman:
        price += 6000

    price *= (1.08 - min(0.5, dist_center_km * 0.015))
    price *= (1.05 - min(0.4, distance_metro_min * 0.01))
    price *= (1 + (walk_score - 70) / 700)
    price *= (1 + (safety_score - 70) / 900)
    price *= (1 + (amenities_score - 75) / 800)
    price *= random.uniform(0.94, 1.08)

    return {
        "neighborhood": neighborhood,
        "district": district,
        "baseline_price_sqm": int(base_price_sqm),
        "price": int(price),
        "sqm": sqm,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "floor": floor,
        "floor_plan": floor_plan,
        "building_type": building_type,
        "year_built": year_built,
        "year_renovated": year_renovated,
        "condition": condition,
        "material_quality": material_quality,
        "has_elevator": int(has_elevator),
        "has_ac": int(has_ac),
        "has_fireplace": int(has_fireplace),
        "has_balcony": int(has_balcony),
        "has_terrace": int(has_terrace),
        "terrace_sqm": terrace_sqm,
        "parking_spots": parking_spots,
        "has_pool": int(has_pool),
        "has_gym": int(has_gym),
        "has_doorman": int(has_doorman),
        "hoa_monthly_eur": round(hoa_fees, 2),
        "property_tax_rate_pct": property_tax_rate,
        "distance_cbd_km": round(dist_center_km, 2),
        "distance_metro_min": distance_metro_min,
        "walk_score": walk_score,
        "safety_score": safety_score,
        "amenities_score": amenities_score,
    }


def lambda_handler(event, context):
    s3 = boto3.client("s3")
    bucket_name = os.environ["DATA_BUCKET"]

    dataset = []
    for _ in range(3000):
        entry = pick_neighborhood_entry()
        dataset.append(generate_apartment(entry))

    csv_buffer = io.StringIO()
    if dataset:
        writer = csv.DictWriter(csv_buffer, fieldnames=dataset[0].keys())
        writer.writeheader()
        writer.writerows(dataset)

    timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    key = f"raw/{timestamp}/housing_data.csv"
    s3.put_object(Bucket=bucket_name, Key=key, Body=csv_buffer.getvalue())

    return {
        "statusCode": 200,
        "body": json.dumps(f"Generated {len(dataset)} Barcelona synthetic records"),
        "s3_key": key,
    }
