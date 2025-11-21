# AI Chatbot Features - v4.0 (Auctions, Favorites & Aesthetics)

## Overview
The platform now includes a sophisticated multi-modal chatbot system powered by **OpenAI (GPT-3.5/4)** running on AWS Lambda. The chatbots are designed to provide both general real estate advice and specific insights into individual property listings.

## Architecture
- **Frontend:** React components (`FloatingAdvisor`, `AdvisorChat`, `ListingDetailView`)
- **Backend:** AWS Lambda (`advisor` function)
- **Model:** OpenAI API (gpt-3.5-turbo)
- **Knowledge Base:** Local JSON data (`bcn_neighborhood_prices.json`) + Live listing attributes

## 1. Floating AI Advisor (Global)
- **Location:** Persistent floating icon at the bottom-right of the screen.
- **Purpose:** Acts as a general guide for the platform and Barcelona real estate market.
- **Capabilities:**
  - Answers questions about neighborhood safety, pricing trends, and investment potential.
  - Explains how to use the platform (e.g., "How do I post a listing?").
  - Maintains conversation context (memory of last 10 messages).
- **Style:** Modern glassmorphism header with blue/purple gradients.

## 2. Property AI Assistant (Contextual)
- **Location:** Embedded in the "Ask AI" sidebar within the `ListingDetailView` modal.
- **Purpose:** Provides specific analysis for the currently viewed property.
- **Capabilities:**
  - **Valuation Analysis:** Explains why a property might be marked as "Overpriced" or "Good Deal" based on its features (AC, pool, size).
  - **Location Context:** Uses the property's neighborhood to give safety and amenity scores.
  - **Comparison:** Can compare the listing's price/m² to the neighborhood average.
- **Context Injection:** Automatically receives the listing's full JSON object (price, features, address) in the system prompt.

## 3. New Aesthetic Features (v4.0)
- **UI Overhaul:** Moved away from basic orange themes to a professional **Blue/Purple Gradient** brand identity.
- **Chat Bubbles:**
  - **User:** Deep blue gradient, rounded corners with a "speech bubble" tail.
  - **AI:** Clean white with subtle border and shadow.
- **Animations:** Smooth slide-in/up transitions for chat windows and messages.
- **Markdown Support:** Properly renders **bold** text and numbered lists for readable advice.

## 4. Interaction Features
- **Favorites:** Users can "heart" listings. Data is stored in DynamoDB (`favorites` table) and persists per session (anonymous user ID).
- **Auctions:** 
  - Sellers can choose "Auction" mode.
  - Buyers can place bids (validated against current highest).
  - Real-time updates on bid counts and prices.
- **Analytics:** View counts are tracked when users open listing details.

## Troubleshooting
- **"Connection Error":** Usually means the Lambda function timed out or the OpenAI API key is invalid/missing.
  - *Fix:* Check AWS Lambda environment variables (`OPENAI_API_KEY`).
- **Hardcoded Answers:** If the API key fails, the system falls back to a basic keyword-matching logic.
- **Styling Issues:** Ensure `tailwind-merge` and `clsx` are installed for the new `cn()` utility class.
