import json
import os
import urllib.request
import urllib.error
from statistics import mean

def load_prices():
    try:
        path = os.path.join(os.path.dirname(__file__), "bcn_neighborhood_prices.json")
        with open(path, "r") as f:
            return json.load(f)
    except Exception as exc:
        print(f"Failed to load neighborhood data: {exc}")
        return []

NEIGHBORHOOD_DATA = load_prices()
SORTED_DESC = sorted(NEIGHBORHOOD_DATA, key=lambda x: x.get("price_2025_eur_sqm", 0), reverse=True)
SORTED_ASC = list(reversed(SORTED_DESC))
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

def format_neighborhoods(items):
    parts = []
    for item in items:
        parts.append(f"{item['neighborhood']} (~€{int(item['price_2025_eur_sqm']):,}/m²)")
    return ", ".join(parts)

def call_openai_chat(messages, mode="general", listing_data=None):
    """
    Call OpenAI Chat API with conversation history.
    
    Args:
        messages: List of {role: "user"/"assistant", content: str}
        mode: "listing" or "general"
        listing_data: Dict with listing details if mode == "listing"
    """
    if not OPENAI_API_KEY:
        return None

    # Build system prompt based on mode
    if mode == "listing" and listing_data:
        system_prompt = f"""You are a knowledgeable Barcelona real estate expert helping a user understand a specific property listing.

Property Details:
- Address: {listing_data.get('address', 'N/A')}
- Neighborhood: {listing_data.get('neighborhood', 'N/A')}
- Price: €{listing_data.get('price', 0):,}
- Size: {listing_data.get('features', {}).get('sqm', 0)} m²
- Bedrooms: {listing_data.get('features', {}).get('bedrooms', 0)}
- Bathrooms: {listing_data.get('features', {}).get('bathrooms', 0)}
- AI Valuation: {listing_data.get('ai_valuation', {}).get('status', 'N/A')} (Estimated: €{listing_data.get('ai_valuation', {}).get('estimated_price', 0):,})
- Description: {listing_data.get('description', 'N/A')}

Answer questions about this property, the neighborhood, price fairness, investment potential, nearby amenities, schools, safety, transportation, etc. Be specific and helpful."""
    else:
        system_prompt = """You are a helpful Barcelona real estate assistant for an AI-powered marketplace platform.

You help users:
- Understand how our AI price prediction works
- Navigate the marketplace
- Learn about Barcelona neighborhoods
- Make informed buying/selling decisions
- Post listings and interpret AI valuations

Be concise, friendly, and informative. Reference specific Barcelona neighborhoods when relevant."""

    # Prepare messages for OpenAI
    api_messages = [{"role": "system", "content": system_prompt}]
    api_messages.extend(messages)

    payload = {
        "model": "gpt-3.5-turbo",
        "messages": api_messages,
        "temperature": 0.7,
        "max_tokens": 400
    }

    endpoint = "https://api.openai.com/v1/chat/completions"
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    
    req = urllib.request.Request(endpoint, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            response_body = json.loads(resp.read().decode("utf-8"))
            choices = response_body.get("choices", [])
            if not choices:
                return None
            return choices[0].get("message", {}).get("content")
    except urllib.error.HTTPError as http_err:
        error_body = http_err.read().decode('utf-8')
        print(f"OpenAI HTTP error: {error_body}")
        return None
    except Exception as exc:
        print(f"OpenAI invocation error: {exc}")
        return None


def handle_question_fallback(question, context):
    """Fallback rule-based responses when OpenAI is unavailable"""
    q = question.lower()

    if "safe" in q or "safety" in q or "kids" in q or "family" in q:
        safe_zones = ["Sarrià-Sant Gervasi", "Les Corts", "Pedralbes"]
        return (
            "For families focused on safety, look toward upscale residential districts like "
            f"{', '.join(safe_zones[:-1])} and {safe_zones[-1]}. They have quieter streets, good schools, and well-managed buildings. "
            "If you prefer more central areas with good police coverage, parts of Eixample (Dreta / Sant Antoni) are reliable too."
        )

    if "expensive" in q and "neighborhood" in q:
        top = SORTED_DESC[:3]
        return f"The priciest areas right now are {format_neighborhoods(top)}. They combine prime locations, iconic architecture, and strong rental demand."

    if "affordable" in q or ("cheap" in q and "neighborhood" in q):
        cheap = SORTED_ASC[:3]
        return f"For better value consider {format_neighborhoods(cheap)}. These areas still have good connections but lower €/m²."

    if "average price" in q or "price per m" in q:
        prices = [item.get("price_2025_eur_sqm", 0) for item in NEIGHBORHOOD_DATA]
        avg_price = int(mean(prices)) if prices else 0
        return f"The city-wide average price per square meter is roughly €{avg_price:,}. Prime neighborhoods sit well above this figure while emerging districts like {SORTED_ASC[0]['neighborhood']} trend below."

    if "good investment" in q or "invest" in q:
        growth = sorted(NEIGHBORHOOD_DATA, key=lambda x: x.get("slope_per_year", 0), reverse=True)[:3]
        return f"Areas showing healthy upward trends include {format_neighborhoods(growth)} thanks to regeneration projects and strong rental demand."

    return "I'm here to help with Barcelona real estate questions. Ask me about neighborhoods, prices, safety, investments, or specific listings!"

def clean_markdown(text: str) -> str:
    """Remove markdown formatting symbols for cleaner display"""
    # Remove ** for bold (keep the text)
    text = text.replace('**', '')
    # Remove * for italic (keep the text)  
    text = text.replace('*', '')
    # Remove # for headers (keep the text)
    import re
    text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
    return text

def build_response(payload: dict | None = None, status_code: int = 200):
    return {
        'statusCode': status_code,
        'body': json.dumps(payload or {})
    }

def lambda_handler(event, context):
    try:
        http_method = event.get("requestContext", {}).get("http", {}).get("method") if isinstance(event, dict) else None

        # Handle CORS preflight
        if http_method == "OPTIONS":
            return build_response({"message": "ok"})

        body = json.loads(event.get("body", "{}")) if isinstance(event, dict) else {}
        question = body.get("question", "").strip()
        
        # New: Support for conversation history
        history = body.get("history", [])  # [{role: "user/assistant", content: str}]
        
        # New: Support for dual modes
        mode = body.get("mode", "general")  # "listing" or "general"
        listing_data = body.get("listing_data", None)

        if not question:
            return build_response({'error': 'No question provided'}, 400)

        # Build messages list for OpenAI
        messages = []
        
        # Add conversation history (last 5 messages)
        if history:
            messages.extend(history[-10:])  # Last 5 exchanges (10 messages)
        
        # Add current question
        messages.append({"role": "user", "content": question})

        # Call OpenAI
        answer = call_openai_chat(messages, mode=mode, listing_data=listing_data)
        
        # Fallback to rule-based if OpenAI fails
        if not answer:
            answer = handle_question_fallback(question, listing_data or {})
        
        # Clean markdown formatting
        answer = clean_markdown(answer)

        return build_response({'answer': answer})
        
    except Exception as e:
        print(f"Advisor error: {e}")
        return build_response({'answer': f"Sorry, something went wrong. Please try again."}, 500)
