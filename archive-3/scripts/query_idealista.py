import requests
import base64
import json
import csv
import time
import os

# API Credentials
apikey = "f0b9ll38z15ywmqa878uklxgofd67cna"
secret = "GTUmTZ12nBER"

# Constants
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

def get_access_token(api_key, api_secret):
    url = "https://api.idealista.com/oauth/token"
    auth = base64.b64encode(f"{api_key}:{api_secret}".encode("utf-8")).decode("utf-8")
    headers = {
        "Authorization": f"Basic {auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}
    
    response = requests.post(url, headers=headers, data=data)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception(f"Failed to get token: {response.status_code} {response.text}")

def search_listings(token, lat, lon, max_items=10):
    url = "https://api.idealista.com/3.5/es/search"
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "country": "es",
        "operation": "sale",
        "propertyType": "homes",
        "center": f"{lat},{lon}",
        "distance": 1000, # 1km radius
        "maxItems": max_items,
        "numPage": 1
    }
    
    response = requests.post(url, headers=headers, params=params)
    if response.status_code == 200:
        return response.json().get("elementList", [])
    else:
        print(f"Error searching at {lat}, {lon}: {response.status_code} {response.text}")
        return []

def main():
    try:
        print("Authenticating...")
        token = get_access_token(apikey, secret)
        print("Authentication successful.")
        
        all_listings = []
        target_per_district = 10
        
        for district_id, coords in DISTRICT_COORDS.items():
            print(f"Querying district {district_id} at {coords}...")
            listings = search_listings(token, coords[0], coords[1], max_items=target_per_district)
            
            # Add district info to listing for reference
            for l in listings:
                l['query_district_id'] = district_id
                
            all_listings.extend(listings)
            print(f"Found {len(listings)} listings.")
            
            # Respect rate limits implicitly by processing time, but small sleep is safer
            time.sleep(1)
            
            if len(all_listings) >= 100:
                break
        
        # Limit to 100 total just in case
        all_listings = all_listings[:100]
        
        if all_listings:
            # Save to data directory relative to script location
            data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
            os.makedirs(data_dir, exist_ok=True)
            filename = os.path.join(data_dir, "idealista_listings_barcelona.csv")
            
            # Extract headers from the first listing, ensuring we catch all possible keys across listings
            keys = set()
            for l in all_listings:
                keys.update(l.keys())
            fieldnames = sorted(list(keys))
            
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(all_listings)
                
            print(f"Successfully saved {len(all_listings)} listings to {filename}")
        else:
            print("No listings found.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
