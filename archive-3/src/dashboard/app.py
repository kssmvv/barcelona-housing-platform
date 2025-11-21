import streamlit as st
import boto3
import json
import os

# Load neighborhood data for fallback list
try:
    with open('data/bcn_neighborhood_prices.json', 'r') as f:
        neighborhood_data = json.load(f)
        # Extract neighborhood names and sort them
        NEIGHBORHOOD_LIST = sorted([item['neighborhood'] for item in neighborhood_data])
except Exception as e:
    # Fallback if file read fails
    NEIGHBORHOOD_LIST = ["Eixample", "Sarrià-Sant Gervasi", "Les Corts", "Gràcia", 
             "Sant Martí (Poblenou)", "Ciutat Vella", "Sants-Montjuïc", 
             "Horta-Guinardó", "Sant Andreu", "Nou Barris"]

# Configure page
st.set_page_config(
    page_title="BCN PropValuator",
    page_icon="🏠",
    layout="wide"
)

# Custom CSS for styling
st.markdown("""
    <style>
    .main {
        background-color: #f5f7f9;
    }
    .stButton>button {
        width: 100%;
        background-color: #FF4B4B;
        color: white;
        font-weight: bold;
    }
    .metric-card {
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    </style>
    """, unsafe_allow_html=True)

# Header
col1, col2 = st.columns([3, 1])
with col1:
    st.title("🏠 Barcelona Apartment Valuator")
    st.caption("AI-Powered Fair Price Estimation (2025 Projections)")
with col2:
    st.image("https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Barcelona_skyline_from_Tibidabo.jpg/640px-Barcelona_skyline_from_Tibidabo.jpg", caption="Barcelona Skyline")

# Sidebar Context
with st.sidebar:
    st.header("📍 Location Context")
    st.info("""
    **How it works:**
    1. Enter the **Address**.
    2. We infer the **Neighborhood**.
    3. We apply **2025 Projected Base Prices**.
    4. We adjust based on **Features** (Pool, Elevator, etc.).
    """)
    
    st.divider()
    st.caption("Connected to AWS Lambda Inference Engine")

# Main Input Form
st.subheader("Describe the Property")

with st.form("valuation_form"):
    col_loc, col_size, col_amen = st.columns(3)
    
    with col_loc:
        st.markdown("#### 📍 Location")
        address = st.text_input("Street Address (e.g., Carrer de Mallorca, 123)", "")
        st.caption("Leave empty to use manual neighborhood selection below (fallback).")
        
        neighborhood_fallback = st.selectbox(
            "Neighborhood (Fallback)",
            NEIGHBORHOOD_LIST,
            index=0,
            help="Used only if address is not found."
        )

    with col_size:
        st.markdown("#### 📐 Size & Layout")
        sqm = st.slider("Total Area (m²)", 30, 250, 80)
        bedrooms = st.number_input("Bedrooms", 0, 6, 2)
        bathrooms = st.number_input("Bathrooms", 1, 4, 1)

    with col_amen:
        st.markdown("#### ✨ Amenities")
        has_elevator = st.checkbox("🛗 Elevator", value=True)
        has_ac = st.checkbox("❄️ Air Conditioning", value=False)
        has_pool = st.checkbox("🏊 Pool", value=False)
        has_terrace = st.checkbox("☀️ Terrace / Balcony", value=False)

    submitted = st.form_submit_button("🚀 Calculate Fair Price")

# Results Section
if submitted:
    payload = {
        "address": address,
        "neighborhood": neighborhood_fallback,
        "sqm": sqm,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "has_elevator": has_elevator,
        "has_ac": has_ac,
        "has_pool": has_pool,
        "has_terrace": has_terrace
    }
    
    with st.spinner("🤖 AI is analyzing market trends..."):
        try:
            # Initialize Lambda Client
            # Note: Ensure your AWS credentials are set in environment or ~/.aws/credentials
            lambda_client = boto3.client('lambda', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
            
            # Find function dynamically
            functions = lambda_client.list_functions()
            inference_fn = None
            for fn in functions['Functions']:
                if 'inference' in fn['FunctionName']:
                    inference_fn = fn['FunctionName']
                    break
            
            if inference_fn:
                response = lambda_client.invoke(
                    FunctionName=inference_fn,
                    InvocationType='RequestResponse',
                    Payload=json.dumps(payload)
                )
                
                response_payload = json.loads(response['Payload'].read())
                
                if 'body' in response_payload:
                    body = json.loads(response_payload['body'])
                    if 'error' in body:
                        st.error(f"Prediction error: {body['error']}")
                        st.stop()
                        
                    price = body.get('estimated_price')
                    price_sqm = body.get('price_per_sqm')
                    details = body.get('details', {})
                    
                    # Display Logic
                    st.divider()
                    st.markdown("### 💰 Valuation Result")
                    
                    # Top Metrics
                    res_col1, res_col2, res_col3 = st.columns(3)
                    with res_col1:
                        st.metric("Estimated Value", f"€{price:,.0f}")
                    with res_col2:
                        st.metric("Price per m²", f"€{price_sqm:,.0f}/m²")
                    with res_col3:
                        inferred_nb = details.get('inferred_neighborhood', 'Unknown')
                        st.metric("Neighborhood", inferred_nb)
                        
                    # Breakdown
                    st.markdown("#### 📊 Price Breakdown")
                    
                    # Base Price
                    base = details.get('base_price_sqm', 0)
                    st.write(f"**Base Price (2025 Projections) for {inferred_nb}:** €{base:,.2f}/m²")
                    
                    # Adjustments
                    adjustments = details.get('adjustments_pct', {})
                    if adjustments:
                        st.write("**Adjustments Applied:**")
                        adj_col1, adj_col2 = st.columns(2)
                        for k, v in adjustments.items():
                            adj_col1.write(f"- {k.replace('_', ' ').title()}: **{v}**")
                    
                    st.write(f"**Total Multiplier:** {details.get('total_multiplier', 1.0):.2f}x")
                    
                else:
                    st.error("Received invalid response from Lambda.")
            else:
                st.error("Inference Lambda not found. Please ensure infrastructure is deployed.")
                
        except Exception as e:
            st.error(f"Error connecting to backend: {e}")
