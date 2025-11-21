# Barcelona Housing Price Predictor - Cloud Deployment Guide

This guide documents the cloud architecture and deployment steps for the Barcelona Housing Price Predictor application.

## Architecture Overview

The application is fully serverless and deployed on AWS. It consists of two main components:

1.  **Backend (ML Ops & Inference):**
    *   **AWS Step Functions:** Orchestrates the ML pipeline (Data Fetching -> Processing -> Training -> Evaluation -> Deployment).
    *   **AWS Lambda:**
        *   `inference`: Serves real-time price predictions via a public Function URL.
        *   `fetch_data`: Generates/scrapes housing data.
        *   `process_data`, `train_model`, etc.: Handle the ML workflow.
    *   **AWS S3:** Stores data lakes (`data_lake_bucket`) and model artifacts (`model_artifacts_bucket`).
    *   **EventBridge Scheduler:** Triggers the retraining pipeline weekly.

2.  **Frontend (Web Interface):**
    *   **AWS S3 (Static Website):** Hosts the React/Lovable application files (`index.html`, JS, CSS).
    *   **Note on HTTPS:** Due to AWS Academy permission restrictions (`cloudfront:CreateDistribution` denied), this environment is limited to **HTTP only** via S3 Static Website Hosting.

## Prerequisites

*   Terraform installed (`>= 1.0`).
*   AWS CLI configured with valid credentials (e.g., AWS Academy `LabRole`).
*   Node.js/npm (for building the frontend).
*   **OpenAI API Key:** Required for the AI chatbot. Store in `/artifacts/.env`:
    ```bash
    # /artifacts/.env
    OPENAI_API_KEY=sk-xxxxxxxxxxxxxx
    ```

## Deployment Instructions

### 1. Deploy Infrastructure

Navigate to the infrastructure directory and apply the Terraform configuration:

```bash
cd infrastructure

# Load OpenAI API key from .env file
source ../artifacts/.env
export TF_VAR_openai_api_key="$OPENAI_API_KEY"

# Deploy infrastructure
terraform init
terraform apply -auto-approve
```

**Important Outputs:**
After a successful apply, note the following outputs:
*   `inference_api_url`: The backend API URL (e.g., `https://xyz...lambda-url...`).
*   `frontend_bucket`: The S3 bucket name for uploading frontend files.
*   `frontend_url`: The HTTP URL to access your live website.

### 2. Connect Frontend to Backend

In your local frontend project (Lovable/React):
1.  Locate the API call logic.
2.  Replace the placeholder URL with your `inference_api_url`.
3.  Save the changes.

### 3. Build and Deploy Frontend

1.  Build your frontend project:
    ```bash
    npm run build
    # This typically creates a 'dist' or 'build' directory
    ```

2.  Upload the build artifacts to the S3 bucket:
    ```bash
    # Replace <YOUR_FRONTEND_BUCKET> with the actual bucket name from Step 1
    aws s3 sync ./dist s3://<YOUR_FRONTEND_BUCKET> --delete
    ```

### 4. Access the Application

Open the `frontend_url` in your browser. You should see your application interacting with the live backend.

## Troubleshooting

*   **403 Forbidden on Frontend:** Ensure the S3 bucket "Block Public Access" settings are disabled and the bucket policy allows `public-read` (Terraform handles this automatically).
*   **CORS Errors:** The `inference` Lambda Function URL is configured to allow all origins (`*`). If you see CORS errors, check the browser console network tab.
*   **"Not Secure" Warning:** This is expected as we are using standard S3 Website hosting (HTTP) due to environment restrictions.
