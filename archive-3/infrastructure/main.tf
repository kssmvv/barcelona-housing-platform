# =========================================
# MAIN TERRAFORM CONFIGURATION
# Automated Housing Price Prediction Platform
# =========================================

# Configure Terraform and AWS Provider
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# =========================================
# S3 BUCKETS - Data Storage
# =========================================

# Bucket for storing raw and processed housing data
resource "aws_s3_bucket" "data_lake" {
  bucket = "${var.project_name}-data-lake-${var.environment}"
  tags   = merge(var.tags, { Name = "Data Lake Bucket" })
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Bucket for storing artifacts (kept for future extensibility)
resource "aws_s3_bucket" "model_artifacts" {
  bucket = "${var.project_name}-model-artifacts-${var.environment}"
  tags   = merge(var.tags, { Name = "Model Artifacts Bucket" })
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

# =========================================
# FRONTEND HOSTING (S3 Static Website)
# =========================================

# 1. S3 Bucket for Website Hosting
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${var.environment}"
  force_destroy = true
  tags = merge(var.tags, { Name = "Frontend Hosting Bucket" })
}

# 2. Enable Static Website Hosting on the Bucket
resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# 3. Disable "Block Public Access" (Required for S3 Website)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# 4. S3 Bucket Policy (Allow Public Read)
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id
  depends_on = [aws_s3_bucket_public_access_block.frontend]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

# =========================================
# DYNAMODB - Estimate History
# =========================================

resource "aws_dynamodb_table" "estimates" {
  name           = "${var.project_name}-estimates-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "estimate_id"
  
  attribute {
    name = "estimate_id"
    type = "S"
  }

  tags = merge(var.tags, { Name = "Estimates Table" })
}

# =========================================
# IAM ROLES - AWS ACADEMY VERSION
# =========================================
# AWS Academy restricts IAM role creation, so we use the pre-existing LabRole

data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

# =========================================
# LAMBDA LAYERS
# =========================================

# Upload custom layer zip to S3 (to bypass 50MB Lambda direct upload limit)
resource "aws_s3_object" "layer_zip" {
  bucket = aws_s3_bucket.model_artifacts.id
  key    = "layers/sklearn_layer.zip"
  source = "${path.module}/../artifacts/sklearn_layer.zip"
  etag   = filemd5("${path.module}/../artifacts/sklearn_layer.zip")
}

resource "aws_lambda_layer_version" "sklearn_layer" {
  layer_name = "${var.project_name}-sklearn-layer"
  s3_bucket  = aws_s3_bucket.model_artifacts.id
  s3_key     = aws_s3_object.layer_zip.key
  
  compatible_runtimes = ["python3.11"]
  description         = "Custom layer with Scikit-Learn, NumPy, Scipy (Optimized)"

  depends_on = [aws_s3_object.layer_zip]
}

# =========================================
# LAMBDA FUNCTIONS
# =========================================

# 1. Fetch Data (Generator)
data "archive_file" "fetch_data_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/fetch_data"
  output_path = "${path.module}/fetch_data.zip"
}

resource "aws_lambda_function" "data_fetching" {
  filename         = data.archive_file.fetch_data_zip.output_path
  function_name    = "${var.project_name}-data-fetching-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.fetch_data_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60
  memory_size      = 512
  layers           = [aws_lambda_layer_version.sklearn_layer.arn]

  environment {
    variables = {
      DATA_BUCKET = aws_s3_bucket.data_lake.id
      ENVIRONMENT = var.environment
    }
  }
  tags = merge(var.tags, { Name = "Data Fetching Lambda" })
}

# 2. Process Data
data "archive_file" "process_data_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/process_data"
  output_path = "${path.module}/process_data.zip"
}

resource "aws_lambda_function" "data_reading" {
  filename         = data.archive_file.process_data_zip.output_path
  function_name    = "${var.project_name}-data-reading-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.process_data_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 512
  # No layer needed (refactored to remove dependencies)
  layers           = [] 

  environment {
    variables = {
      DATA_BUCKET = aws_s3_bucket.data_lake.id
      ENVIRONMENT = var.environment
    }
  }
  tags = merge(var.tags, { Name = "Data Reading Lambda" })
}

# 3. Train Model
data "archive_file" "train_model_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/train_model"
  output_path = "${path.module}/train_model.zip"
}

resource "aws_lambda_function" "train_model" {
  filename         = data.archive_file.train_model_zip.output_path
  function_name    = "${var.project_name}-train-model-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.train_model_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 1024
  # Custom layer with sklearn
  layers           = [aws_lambda_layer_version.sklearn_layer.arn]

  environment {
    variables = {
      DATA_BUCKET  = aws_s3_bucket.data_lake.id
      MODEL_BUCKET = aws_s3_bucket.model_artifacts.id
      ENVIRONMENT  = var.environment
    }
  }
  tags = merge(var.tags, { Name = "Train Model Lambda" })
}

# 4. Model Comparison
data "archive_file" "compare_models_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/compare_models"
  output_path = "${path.module}/compare_models.zip"
}

resource "aws_lambda_function" "model_comparison" {
  filename         = data.archive_file.compare_models_zip.output_path
  function_name    = "${var.project_name}-model-comparison-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.compare_models_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60

  environment {
    variables = {
      MODEL_BUCKET = aws_s3_bucket.model_artifacts.id
      ENVIRONMENT  = var.environment
    }
  }
  tags = merge(var.tags, { Name = "Model Comparison Lambda" })
}

# 5. Update Baseline
data "archive_file" "update_baseline_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/update_baseline"
  output_path = "${path.module}/update_baseline.zip"
}

resource "aws_lambda_function" "update_baseline" {
  filename         = data.archive_file.update_baseline_zip.output_path
  function_name    = "${var.project_name}-update-baseline-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.update_baseline_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60

  environment {
    variables = {
      MODEL_BUCKET = aws_s3_bucket.model_artifacts.id
      ENVIRONMENT  = var.environment
    }
  }
  tags = merge(var.tags, { Name = "Update Baseline Lambda" })
}

# 6. Inference (User App Backend)
data "archive_file" "inference_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/inference"
  output_path = "${path.module}/inference.zip"
}

resource "aws_lambda_function" "inference" {
  filename         = data.archive_file.inference_zip.output_path
  function_name    = "${var.project_name}-inference-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.inference_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 512
  
  # Restore layer for scikit-learn
  layers           = [aws_lambda_layer_version.sklearn_layer.arn]

  environment {
    variables = {
      ENVIRONMENT  = var.environment
      MODEL_BUCKET = aws_s3_bucket.model_artifacts.id
      TABLE_NAME   = aws_dynamodb_table.estimates.name
    }
  }
  tags = merge(var.tags, { Name = "Inference Lambda" })
}

resource "aws_lambda_function_url" "inference_url" {
  function_name      = aws_lambda_function.inference.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["POST", "GET"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
    max_age           = 86400
  }
}

# 7. AI Advisor (Bedrock)
data "archive_file" "advisor_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/advisor"
  output_path = "${path.module}/advisor.zip"
}

resource "aws_lambda_function" "advisor" {
  filename         = data.archive_file.advisor_zip.output_path
  function_name    = "${var.project_name}-advisor-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.advisor_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 512
  
  environment {
    variables = {
      ENVIRONMENT = var.environment
      OPENAI_API_KEY = var.openai_api_key
    }
  }
  tags = merge(var.tags, { Name = "AI Advisor Lambda" })
}

resource "aws_lambda_function_url" "advisor_url" {
  function_name      = aws_lambda_function.advisor.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
  }
}

# 8. Send Email (SES)
data "archive_file" "email_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/send_email"
  output_path = "${path.module}/email.zip"
}

resource "aws_lambda_function" "send_email" {
  filename         = data.archive_file.email_zip.output_path
  function_name    = "${var.project_name}-send-email-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.email_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  
  environment {
    variables = {
      ENVIRONMENT  = var.environment
      # Default sender - must be verified in SES Console
      SENDER_EMAIL = "daniyar.kassymov@alumni.esade.edu" 
    }
  }
  tags = merge(var.tags, { Name = "Send Email Lambda" })
}

resource "aws_lambda_function_url" "email_url" {
  function_name      = aws_lambda_function.send_email.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
  }
}

# 9. Get History (DynamoDB)
data "archive_file" "history_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/get_history"
  output_path = "${path.module}/history.zip"
}

resource "aws_lambda_function" "get_history" {
  filename         = data.archive_file.history_zip.output_path
  function_name    = "${var.project_name}-get-history-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.history_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  
  environment {
    variables = {
      ENVIRONMENT  = var.environment
      TABLE_NAME   = aws_dynamodb_table.estimates.name
    }
  }
  tags = merge(var.tags, { Name = "Get History Lambda" })
}

resource "aws_lambda_function_url" "history_url" {
  function_name      = aws_lambda_function.get_history.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
  }
}


# =========================================
# STEP FUNCTIONS STATE MACHINE
# =========================================

resource "aws_sfn_state_machine" "mlops_pipeline" {
  name     = "${var.project_name}-pipeline-${var.environment}"
  role_arn = data.aws_iam_role.lab_role.arn

  definition = jsonencode({
    Comment = "Automated MLOps Pipeline for Housing Price Prediction"
    StartAt = "FetchData"
    States = {
      
      # Step 1: Fetch new data (Synthetic Generation)
      FetchData = {
        Type     = "Task"
        Resource = aws_lambda_function.data_fetching.arn
        Comment  = "Generate synthetic housing data"
        ResultPath = "$.fetchResult"
        Next     = "ReadData"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "HandleError"
          ResultPath  = "$.error"
        }]
      }

      # Step 2: Read and process data
      ReadData = {
        Type     = "Task"
        Resource = aws_lambda_function.data_reading.arn
        Comment  = "Read and preprocess data from S3"
        ResultPath = "$.readResult"
        Next     = "TrainModel"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "HandleError"
          ResultPath  = "$.error"
        }]
      }

      # Step 3: Train model (Actual Training)
      TrainModel = {
        Type     = "Task"
        Resource = aws_lambda_function.train_model.arn
        Comment  = "Train RandomForest model"
        ResultPath = "$.trainResult"
        Next     = "CompareModels"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "HandleError"
          ResultPath  = "$.error"
        }]
      }

      # Step 4: Compare new model with current production model
      CompareModels = {
        Type     = "Task"
        Resource = aws_lambda_function.model_comparison.arn
        Comment  = "Compare new model performance with baseline"
        ResultPath = "$.comparisonResult"
        Next     = "IsModelBetter"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "HandleError"
          ResultPath  = "$.error"
        }]
      }

      # Step 5: Decision - Is new model better?
      IsModelBetter = {
        Type    = "Choice"
        Comment = "Check if new model outperforms current model"
        Choices = [{
          Variable      = "$.comparisonResult.isBetter"
          BooleanEquals = true
          Next          = "UpdateBaseline"
        }]
        Default = "SkipDeployment"
      }

      # Step 6: Update baseline metrics and promote model
      UpdateBaseline = {
        Type     = "Task"
        Resource = aws_lambda_function.update_baseline.arn
        Comment  = "Update stored baseline metrics and promote model"
        ResultPath = "$.updateResult"
        Next     = "Success"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "HandleError"
          ResultPath  = "$.error"
        }]
      }

      # Step 7: Skip deployment if model is not better
      SkipDeployment = {
        Type = "Pass"
        Result = {
          message = "New model did not improve performance. Keeping current model."
        }
        ResultPath = "$.skipResult"
        Next       = "Success"
      }

      # Success state
      Success = {
        Type = "Succeed"
      }

      # Error handling
      HandleError = {
        Type = "Pass"
        Result = {
          status  = "failed"
          message = "Pipeline execution failed. Check CloudWatch logs."
        }
        Next = "Fail"
      }

      # Fail state
      Fail = {
        Type = "Fail"
      }
    }
  })

  tags = var.tags
}

# =========================================
# EVENTBRIDGE SCHEDULER
# =========================================

# EventBridge rule to trigger pipeline on schedule
resource "aws_cloudwatch_event_rule" "pipeline_schedule" {
  name                = "${var.project_name}-schedule-${var.environment}"
  description         = "Trigger MLOps pipeline periodically"
  schedule_expression = var.schedule_expression
  
  tags = var.tags
}

# Connect EventBridge rule to Step Functions
resource "aws_cloudwatch_event_target" "step_functions" {
  rule      = aws_cloudwatch_event_rule.pipeline_schedule.name
  target_id = "TriggerStepFunctions"
  arn       = aws_sfn_state_machine.mlops_pipeline.arn
  role_arn  = data.aws_iam_role.lab_role.arn
}

