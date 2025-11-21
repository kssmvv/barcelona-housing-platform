#!/usr/bin/env python3
"""
Builds a consolidated baseline table of Barcelona neighbourhood prices.

Steps:
1. Fetch 2015 €/m2 snapshot per neighbourhood.
2. Fetch 2007-2011 historical €/m2 series per neighbourhood.
3. Fit a simple linear trend from 2007-2011 and project a slope.
4. Combine the 2015 anchor with the slope to estimate 2025 €/m2.
5. Persist the consolidated data to data/bcn_neighborhood_prices.json.
"""

from __future__ import annotations

import json
import math
import pathlib
import re
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple

import requests

API_BASE = "https://opendata-ajuntament.barcelona.cat/data/api/action/datastore_search"
RESOURCE_2015 = "cd9118c6-427c-4390-8334-3670cc3f3f6a"
RESOURCE_HISTORY = "fd130d85-d893-49de-9003-564bbd1d7aff"
OUTPUT_PATH = pathlib.Path(__file__).resolve().parents[1] / "data" / "bcn_neighborhood_prices.json"
LAMBDA_DATA_PATH = pathlib.Path(__file__).resolve().parents[1] / "src" / "lambdas" / "fetch_data" / "bcn_neighborhood_prices.json"

YEARS_HISTORY = [2007, 2008, 2009, 2010, 2011]


def fetch_records(resource_id: str) -> List[dict]:
    limit = 1000
    params = {"resource_id": resource_id, "limit": limit}
    resp = requests.get(API_BASE, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if not data.get("success"):
        raise RuntimeError(f"API error: {data}")
    records = data["result"]["records"]
    return records


def normalize_name(raw: str) -> str:
    if not raw:
        return ""
    name = raw.strip()
    name = re.sub(r"^\d+\.\s*", "", name)
    name = name.replace("G\u00f2", "Gò").replace("Grcia", "Gràcia")  # fix encoding quirks
    name = name.replace("Sant Gervasi-Galvany", "Sant Gervasi - Galvany")
    name = name.replace("Sant Gervasi-la Bonanova", "Sant Gervasi - la Bonanova")
    name = name.replace("les Tres Torres", "Les Tres Torres")
    return name


def parse_thousands_int(val: str) -> Optional[float]:
    if not val or val.lower() == "n.d.":
        return None
    cleaned = val.replace(".", "").replace(",", "")
    if not cleaned or not re.match(r"^-?\d+$", cleaned):
        return None
    return float(cleaned)


def parse_historic_value(val: str) -> Optional[float]:
    base = parse_thousands_int(val)
    if base is None:
        return None
    # Historic dataset stores two implied decimal places.
    return base / 100.0


def regress_slope(points: List[Tuple[int, float]]) -> float:
    if len(points) < 2:
        return 0.0
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    mean_x = sum(xs) / len(xs)
    mean_y = sum(ys) / len(ys)
    numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    denominator = sum((x - mean_x) ** 2 for x in xs)
    if math.isclose(denominator, 0.0):
        return 0.0
    return numerator / denominator


@dataclass
class NeighborhoodPrice:
    neighborhood: str
    district: str
    price_2015_eur_sqm: float
    slope_per_year: float
    price_2025_eur_sqm: float


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    print("Fetching 2015 snapshot…")
    snapshot_records = fetch_records(RESOURCE_2015)
    snapshot = {}
    for rec in snapshot_records:
        raw_name = rec.get("Barris")
        norm = normalize_name(raw_name)
        if not norm or norm.upper() == "BARCELONA":
            continue
        price = parse_thousands_int(rec.get("2015", ""))
        district = str(rec.get("Dte.", "")).strip()
        if price is None:
            continue
        snapshot[norm] = {"price_2015": price, "district": district}

    if not snapshot:
        raise RuntimeError("No snapshot data parsed.")

    print("Fetching historical series…")
    history_records = fetch_records(RESOURCE_HISTORY)
    history_points: Dict[str, List[Tuple[int, float]]] = {}
    history_values: Dict[str, Dict[int, float]] = {}
    slope_lookup: Dict[str, float] = {}
    for rec in history_records:
        norm = normalize_name(rec.get("Barris", ""))
        if not norm:
            continue
        points = []
        year_map = {}
        for year in YEARS_HISTORY:
            val = parse_historic_value(rec.get(str(year), ""))
            if val is not None:
                points.append((year, val))
                year_map[year] = val
        history_points[norm] = points
        history_values[norm] = year_map
        slope_lookup[norm] = regress_slope(points)

    # Compute citywide fallback slope
    slopes = [s for s in slope_lookup.values() if s]
    fallback_slope = sum(slopes) / len(slopes) if slopes else 0.0

    consolidated: List[NeighborhoodPrice] = []
    for name, info in snapshot.items():
        price_2015 = info["price_2015"]
        district = info["district"]
        hist_years = history_values.get(name, {})
        if 2011 in hist_years:
            annual_growth = (price_2015 - hist_years[2011]) / (2015 - 2011)
        else:
            annual_growth = slope_lookup.get(name, 0.0)
        if annual_growth == 0.0:
            annual_growth = fallback_slope
        # prevent runaway collapse
        min_growth = -0.2 * price_2015 / 10  # max 20% drop over decade
        annual_growth = max(annual_growth, min_growth)
        price_2025 = max(0.0, price_2015 + annual_growth * (2025 - 2015))
        consolidated.append(
            NeighborhoodPrice(
                neighborhood=name,
                district=district,
                price_2015_eur_sqm=round(price_2015, 2),
                slope_per_year=round(annual_growth, 2),
                price_2025_eur_sqm=round(price_2025, 2),
            )
        )

    consolidated.sort(key=lambda x: x.neighborhood)
    json_content = json.dumps([asdict(item) for item in consolidated], ensure_ascii=False, indent=2)
    
    OUTPUT_PATH.write_text(json_content, encoding="utf-8")
    print(f"Wrote {len(consolidated)} neighbourhood records to {OUTPUT_PATH}")

    # Also update the lambda package
    LAMBDA_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    LAMBDA_DATA_PATH.write_text(json_content, encoding="utf-8")
    print(f"Wrote {len(consolidated)} neighbourhood records to {LAMBDA_DATA_PATH}")


if __name__ == "__main__":
    main()

