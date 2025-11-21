# AI Chatbot Features - v2.2

## Overview

The Barcelona Housing Price Predictor now includes a sophisticated dual-mode AI chatbot powered by OpenAI GPT-3.5 Turbo, with conversation memory and context-aware responses.

## Features

### 1. Dual-Mode Operation

#### **General Mode (Floating Chat Icon)**
- **Location:** Bottom-right corner of every page (floating button).
- **Purpose:** Answer general questions about Barcelona real estate market, platform usage, and neighborhood insights.
- **Examples:**
  - "What's the safest neighborhood in Barcelona?"
  - "How does your AI price prediction work?"
  - "Show me affordable areas for families."
  - "Which neighborhoods have the best investment potential?"

#### **Listing-Specific Mode (Ask AI Button)**
- **Location:** On each property listing card in the "Buy / Rent" section.
- **Purpose:** Provide deep, context-aware insights about a specific property.
- **Context Injected:**
  - Address & Neighborhood
  - Asking Price & Price per m²
  - Property Features (size, bedrooms, bathrooms)
  - AI Valuation Status ("Good Deal", "Overpriced", "Fair Price")
  - Estimated AI Price
  - Property Description
- **Examples:**
  - "Why is this property marked as 'Overpriced'?"
  - "Are there good schools near this address?"
  - "What's the investment ROI for this neighborhood?"
  - "Is this a good deal compared to similar properties?"

### 2. Conversation Memory

- **Remembers last 10 messages** (5 user-assistant exchanges).
- Enables natural follow-up questions without repeating context.
- Example conversation flow:
  ```
  User: "What's the most expensive neighborhood?"
  Bot: "Sarrià-Sant Gervasi is the priciest at ~€5,200/m²..."
  User: "Why is it so expensive?"
  Bot: "Sarrià-Sant Gervasi commands premium prices due to..."
  ```

### 3. Smart System Prompts

The chatbot adapts its behavior based on mode:

#### General Mode Prompt:
```
You are a helpful Barcelona real estate assistant for an AI-powered marketplace platform.

You help users:
- Understand how our AI price prediction works
- Navigate the marketplace
- Learn about Barcelona neighborhoods
- Make informed buying/selling decisions
- Post listings and interpret AI valuations

Be concise, friendly, and informative. Reference specific Barcelona neighborhoods when relevant.
```

#### Listing-Specific Mode Prompt:
```
You are a knowledgeable Barcelona real estate expert helping a user understand a specific property listing.

Property Details:
- Address: [INJECTED]
- Neighborhood: [INJECTED]
- Price: €[INJECTED]
- Size: [INJECTED] m²
- Bedrooms: [INJECTED]
- Bathrooms: [INJECTED]
- AI Valuation: [INJECTED] (Estimated: €[INJECTED])
- Description: [INJECTED]

Answer questions about this property, the neighborhood, price fairness, investment potential, nearby amenities, schools, safety, transportation, etc. Be specific and helpful.
```

## Technical Implementation

### Backend (Lambda: `advisor`)

**File:** `/src/lambdas/advisor/lambda_function.py`

**Key Components:**
1. **`call_openai_chat(messages, mode, listing_data)`:**
   - Constructs mode-specific system prompts.
   - Sends conversation history + current question to OpenAI API.
   - Returns AI-generated response.

2. **Conversation History:**
   - Frontend sends `history` array with last 10 messages.
   - Lambda appends current question and forwards to OpenAI.

3. **Fallback Logic:**
   - If OpenAI API fails, falls back to rule-based responses (neighborhood data from `bcn_neighborhood_prices.json`).

**Environment Variables:**
- `OPENAI_API_KEY`: Your OpenAI API key (set via Terraform).

### Frontend (React Components)

#### **FloatingAdvisor.tsx**
- **Floating chat icon** at bottom-right.
- Maintains local conversation state (last 10 messages).
- Sends `mode`, `history`, and `listing_data` (if in listing mode) to backend.
- Auto-scrolls to latest message.

#### **AdvisorChat.tsx**
- **Embedded chat component** used inside modals (for listing-specific chat).
- Same logic as FloatingAdvisor but embedded in Dialog component.

#### **ListingList.tsx**
- Each listing card has an "Ask AI" button.
- Opens a Dialog modal with `AdvisorChat` component.
- Passes full listing data as `listingData` prop.

### API Payload Structure

**Request to Lambda:**
```json
{
  "question": "Why is this a good deal?",
  "history": [
    {"role": "user", "content": "Tell me about this property"},
    {"role": "assistant", "content": "This is a 3-bedroom apartment..."}
  ],
  "mode": "listing",
  "listing_data": {
    "address": "Carrer de Balmes, 123",
    "neighborhood": "Eixample",
    "price": 450000,
    "features": {
      "sqm": 85,
      "bedrooms": 3,
      "bathrooms": 2
    },
    "ai_valuation": {
      "status": "Good Deal",
      "estimated_price": 520000,
      "diff_pct": -13.5
    },
    "description": "Bright apartment with terrace..."
  }
}
```

**Response from Lambda:**
```json
{
  "answer": "This property is marked as a 'Good Deal' because our AI estimates its fair market value at €520,000, but it's listed at €450,000—a 13.5% discount. In Eixample, properties of this size typically command premium prices due to..."
}
```

## User Experience

### General Chat Flow
1. User visits any page.
2. Sees floating orange chat icon at bottom-right.
3. Clicks icon → Chat card unfolds.
4. Types question: "What's the average price in Barcelona?"
5. Bot responds with data-driven answer.
6. User follows up: "Which is the cheapest?"
7. Bot remembers context and provides targeted answer.

### Listing-Specific Chat Flow
1. User browses "Buy / Rent" section.
2. Sees listings with AI valuation badges.
3. Clicks "Ask AI" button on an "Overpriced" listing.
4. Modal opens with full property details in header.
5. Types: "Why is this overpriced?"
6. Bot explains: "Our AI estimates this property at €380,000, but the asking price is €450,000—an 18% premium. Similar properties in [neighborhood] typically sell for..."
7. User follows up: "Are there schools nearby?"
8. Bot provides neighborhood-specific insights.

## Deployment

### Prerequisites
1. **OpenAI API Key:**
   - Sign up at [OpenAI Platform](https://platform.openai.com/).
   - Create API key.
   - Store in `/artifacts/.env`:
     ```bash
     OPENAI_API_KEY=sk-xxxxxxxxxxxxxx
     ```

### Deploy
```bash
# 1. Backend
cd infrastructure
source ../artifacts/.env
export TF_VAR_openai_api_key="$OPENAI_API_KEY"
terraform init
terraform apply -auto-approve

# 2. Frontend
cd ../barcelona-property-guide-main
npm run build
aws s3 sync dist s3://housing-price-pred-kssmvv-frontend-dev
```

### Verify
1. Visit frontend URL (from Terraform outputs).
2. Check footer: "v2.2 - Smart AI Chatbot (OpenAI)".
3. Test general chat: Click floating icon, ask "What's the safest neighborhood?"
4. Test listing chat: Go to "Buy / Rent", click "Ask AI" on any listing.

## Cost Estimation

### OpenAI API Usage
- **Model:** GPT-3.5 Turbo
- **Pricing:** ~$0.002 per 1K tokens (input + output combined).
- **Average Chat:** ~400 tokens (question + answer + history) = $0.0008.
- **Expected Monthly Cost (100 users, 10 chats each):** ~$0.80.

### AWS Lambda (Advisor)
- **Invocations:** ~1,000/month.
- **Memory:** 512 MB, Avg. duration: 2s.
- **Cost:** ~$0.05/month (within free tier for low usage).

**Total Estimated Monthly Cost:** < $1 for low-medium usage.

## Limitations & Future Enhancements

### Current Limitations
1. **No Chat History Persistence:** Conversation resets when modal/chat is closed. (Future: Store in DynamoDB with session IDs.)
2. **No User Authentication:** Anyone can use the chatbot. (Future: Add Cognito + rate limiting.)
3. **Limited Context:** Only last 10 messages. (Future: Implement vector database for long-term memory.)

### Planned Enhancements
- [ ] Store chat history in DynamoDB (per-user sessions).
- [ ] Add rate limiting (CloudFront + API Gateway).
- [ ] Implement vector search over all listings (Pinecone/OpenSearch).
- [ ] Add voice input/output (OpenAI Whisper + TTS).
- [ ] Multi-language support (detect user language, respond accordingly).
- [ ] Integrate real-time market data (Idealista API).

## Troubleshooting

### Chatbot Returns "Connection error"
- **Check OpenAI API Key:** Verify `OPENAI_API_KEY` is set in Terraform.
- **Check Lambda Logs:** View CloudWatch logs for `advisor` Lambda (if accessible).
- **Test Lambda Directly:** Use AWS Console to invoke with test payload.

### Chatbot Gives Generic Answers
- **Listing-Specific Chat:** Ensure `listingData` prop is correctly passed.
- **Check Payload:** Inspect browser DevTools → Network tab → Check request body includes `mode` and `listing_data`.

### OpenAI API Rate Limit
- **Upgrade OpenAI Tier:** Start with free tier ($5 credit), upgrade to Tier 1 for higher limits.
- **Implement Caching:** Cache common questions in DynamoDB (future enhancement).

## Conclusion

The dual-mode AI chatbot transforms the Barcelona Housing Price Predictor from a simple estimation tool into an **intelligent real estate assistant**, providing personalized, context-aware guidance for both general market insights and specific property evaluations. With conversation memory and OpenAI GPT-3.5 Turbo, users get a truly conversational, helpful experience.

---

**Version:** v2.2  
**Last Updated:** November 20, 2025  
**OpenAI Model:** GPT-3.5 Turbo  
**Conversation Memory:** Last 10 messages (5 exchanges)

