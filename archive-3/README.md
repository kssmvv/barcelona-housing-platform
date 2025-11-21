# Barcelona Housing Price Predictor

A serverless, AI-powered marketplace and price prediction platform for Barcelona real estate.

## Features

### Core Functionality
*   **Smart Price Estimation:** ML-powered price predictions using Random Forest trained on Barcelona market data.
*   **AI-Powered Marketplace:** Users can post property listings with automatic AI price validation.
*   **Dual-Mode AI Chatbot (OpenAI GPT-3.5):**
    *   **General Mode:** Answer questions about Barcelona neighborhoods, market trends, platform usage.
    *   **Listing-Specific Mode:** Deep-dive into individual properties with context-aware responses about valuation, neighborhood, investment potential.
    *   **Conversation Memory:** Maintains last 5 message exchanges for natural, contextual conversations.
*   **Interactive Map:** Visualizes property locations using OpenStreetMap & React-Leaflet.
*   **Smart Valuation Badges:** AI evaluates listings as "Good Deal," "Fair Price," or "Overpriced."
*   **Automated Model Retraining:** MLOps pipeline retrains the model every X new listings (configurable threshold).

### Additional Services
*   **My Saved Estimates:** Persistent history of price estimates (DynamoDB).
*   **Official Valuation Reports:** Email-based PDF reports (Amazon SES).
*   **Property Chat:** Ask the AI specific questions about any listing.

## Architecture

The project is fully cloud-native and deployed on AWS:

### Frontend
*   **React (Vite):** Modern single-page application with TypeScript.
*   **Tailwind CSS + Shadcn UI:** Beautiful, accessible component library.
*   **S3 Static Website Hosting:** Fast, cost-effective hosting (HTTP).

### Backend
*   **AWS Lambda:** 11 serverless functions handling:
    *   Inference (price prediction)
    *   AI Advisor (OpenAI-powered chatbot)
    *   Listing CRUD (create/get listings)
    *   Email reports (SES)
    *   History retrieval (DynamoDB)
    *   MLOps pipeline (fetch, process, train, compare, promote)
*   **Amazon DynamoDB:** Two tables:
    *   `estimates`: User price estimates.
    *   `listings`: User-posted property listings.
*   **OpenAI GPT-3.5 Turbo:** Powers the conversational AI advisor.
*   **Amazon SES:** Sends valuation reports via email.
*   **AWS Step Functions:** Orchestrates the full MLOps pipeline (weekly schedule + on-demand trigger).

### MLOps Pipeline
1. **Fetch Data:** Generate synthetic housing data with realistic Barcelona features.
2. **Process Data:** Clean, encode, and split data for training.
3. **Train Model:** Train RandomForestRegressor with hyperparameter tuning.
4. **Compare Models:** Evaluate new model vs. production baseline (RMSE/MAE).
5. **Update Baseline:** Promote new model if performance improves.

Triggered:
- **Weekly:** Automatic schedule via EventBridge.
- **On-Demand:** After every X new user listings (default: 10).

### Infrastructure as Code
*   **Terraform:** All AWS resources (Lambdas, S3, DynamoDB, IAM, Step Functions, EventBridge) defined in `infrastructure/`.

## Deployment

See `DEPLOYMENT.md` for step-by-step instructions.

**Quick Start:**
```bash
# Backend (Terraform)
cd infrastructure
source ../artifacts/.env  # Load OPENAI_API_KEY
export TF_VAR_openai_api_key="$OPENAI_API_KEY"
terraform init
terraform apply

# Frontend (React)
cd ../barcelona-property-guide-main
npm install
npm run build
aws s3 sync dist s3://<frontend-bucket-name>
```

## New Features in v2.2

### Smart AI Chatbot (OpenAI Integration)
- **Dual-Mode Operation:**
  - **General Chatbot:** Floating icon at bottom-right of every page. Ask about Barcelona neighborhoods, market trends, how to use the platform.
  - **Listing-Specific Chatbot:** "Ask AI" button on each listing card opens a modal with full property context injected into the conversation.
- **Conversation Memory:** Remembers last 10 messages (5 exchanges) for contextual follow-ups.
- **Smart Prompts:** System prompts dynamically adapt based on mode and available listing data.

### How It Works
1. User clicks floating chat icon → General mode (Barcelona market questions).
2. User clicks "Ask AI" on a listing → Listing mode (property-specific questions with full context: address, neighborhood, price, AI valuation, features, description).
3. Chatbot sends conversation history + current question to OpenAI API.
4. Backend (advisor Lambda) constructs mode-specific system prompts and returns intelligent, context-aware answers.

### Environment Variables
- **Backend:** `OPENAI_API_KEY` (set via Terraform variable `TF_VAR_openai_api_key`).
- Stored securely in `/artifacts/.env` (not committed to Git).

## Usage

### For Buyers/Renters
1.  Navigate to "Get Estimate" tab.
2.  Enter property details (Address, Size, Bedrooms, Amenities).
3.  View AI-predicted price and neighborhood insights.
4.  Chat with the AI advisor about the estimate or Barcelona market.
5.  Email yourself the official valuation report.

### For Sellers/Landlords
1.  Navigate to "Post Listing" tab.
2.  Fill in property details (address, price, features, contact info).
3.  Submit → AI instantly evaluates your asking price vs. market prediction.
4.  Receive feedback: "Good Deal," "Fair Price," or "Overpriced."
5.  Your listing appears in "Buy / Rent" with an AI valuation badge.

### Chatbot Tips
- **General Questions:** "What's the safest neighborhood in Barcelona?", "How does your AI work?", "Show me affordable areas."
- **Listing-Specific:** Click "Ask AI" on any property → "Why is this a good deal?", "Are there schools nearby?", "What's the investment potential?"

## Technologies

### Backend
*   Python 3.11
*   AWS Lambda, S3, DynamoDB, SES, Step Functions, EventBridge
*   Scikit-Learn (RandomForestRegressor)
*   OpenAI GPT-3.5 Turbo

### Frontend
*   React 18, TypeScript, Vite
*   Tailwind CSS, Shadcn UI
*   React-Leaflet (mapping)

### Infrastructure
*   Terraform (AWS provider)
*   AWS Academy LabRole (restricted IAM permissions)

## Limitations (AWS Academy)

Due to AWS Academy LabRole restrictions:
- **No CloudFront:** Cannot create distributions → Frontend uses plain S3 static website (HTTP only).
- **No EC2:** Cannot self-host models → Using OpenAI API instead of local LLM.
- **No Bedrock:** Access denied → OpenAI API as alternative.

## Future Enhancements

- [ ] Implement user authentication (Cognito).
- [ ] Add property image uploads (S3).
- [ ] Integrate real-time data from Idealista API.
- [ ] Add price trend charts (historical data).
- [ ] Implement neighborhood comparison tool.
- [ ] Add multi-language support (English, Spanish, Catalan).

## License

MIT License - Feel free to use and adapt for your own projects.

## Version History

- **v2.2 (Current):** OpenAI-powered dual-mode chatbot with conversation memory.
- **v2.1:** Smart marketplace with AI price validation and auto-retraining.
- **v2.0:** Full AWS deployment with DynamoDB, SES, Map integration.
- **v1.0:** Initial ML-powered price estimator with Streamlit dashboard.
