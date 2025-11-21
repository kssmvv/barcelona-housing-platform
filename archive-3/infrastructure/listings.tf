
# =========================================
# DYNAMODB - User Listings
# =========================================

resource "aws_dynamodb_table" "listings" {
  name           = "${var.project_name}-listings-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "listing_id"
  range_key      = "created_at"
  
  attribute {
    name = "listing_id"
    type = "S"
  }
  
  attribute {
    name = "created_at"
    type = "S"
  }

  tags = merge(var.tags, { Name = "Listings Table" })
}

# =========================================
# LAMBDA - Listings Management
# =========================================

# 10. Create Listing
data "archive_file" "create_listing_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/create_listing"
  output_path = "${path.module}/create_listing.zip"
}

resource "aws_lambda_function" "create_listing" {
  filename         = data.archive_file.create_listing_zip.output_path
  function_name    = "${var.project_name}-create-listing-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.create_listing_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  
  environment {
    variables = {
      ENVIRONMENT       = var.environment
      TABLE_NAME        = aws_dynamodb_table.listings.name
      INFERENCE_FUNC    = aws_lambda_function.inference.function_name
      STATE_MACHINE_ARN = aws_sfn_state_machine.mlops_pipeline.arn
      RETRAIN_THRESHOLD = "10"
    }
  }
  tags = merge(var.tags, { Name = "Create Listing Lambda" })
}

resource "aws_lambda_function_url" "create_listing_url" {
  function_name      = aws_lambda_function.create_listing.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
  }
}

# 11. Get Listings
data "archive_file" "get_listings_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/get_listings"
  output_path = "${path.module}/get_listings.zip"
}

resource "aws_lambda_function" "get_listings" {
  filename         = data.archive_file.get_listings_zip.output_path
  function_name    = "${var.project_name}-get-listings-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.get_listings_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  
  environment {
    variables = {
      ENVIRONMENT = var.environment
      TABLE_NAME  = aws_dynamodb_table.listings.name
    }
  }
  tags = merge(var.tags, { Name = "Get Listings Lambda" })
}

resource "aws_lambda_function_url" "get_listings_url" {
  function_name      = aws_lambda_function.get_listings.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
  }
}
