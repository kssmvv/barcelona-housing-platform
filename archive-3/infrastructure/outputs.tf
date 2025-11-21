# =========================================
# OUTPUTS - Important information after deployment
# =========================================

# S3 Bucket Names
output "data_lake_bucket" {
  description = "Name of the S3 bucket for housing data"
  value       = aws_s3_bucket.data_lake.id
}

output "model_artifacts_bucket" {
  description = "Name of the S3 bucket for model artifacts"
  value       = aws_s3_bucket.model_artifacts.id
}

output "frontend_bucket" {
  description = "Name of the S3 bucket hosting the frontend"
  value       = aws_s3_bucket.frontend.id
}

# Lambda Function Names
output "lambda_functions" {
  description = "Names of all Lambda functions"
  value = {
    data_fetching     = aws_lambda_function.data_fetching.function_name
    data_reading      = aws_lambda_function.data_reading.function_name
    train_model       = aws_lambda_function.train_model.function_name
    model_comparison  = aws_lambda_function.model_comparison.function_name
    update_baseline   = aws_lambda_function.update_baseline.function_name
    inference         = aws_lambda_function.inference.function_name
    advisor           = aws_lambda_function.advisor.function_name
    send_email        = aws_lambda_function.send_email.function_name
    get_history       = aws_lambda_function.get_history.function_name
    create_listing    = aws_lambda_function.create_listing.function_name
    get_listings      = aws_lambda_function.get_listings.function_name
  }
}

# Inference API Endpoint
output "inference_api_url" {
  description = "Public URL for the inference API (for external web apps)"
  value       = aws_lambda_function_url.inference_url.function_url
}

output "advisor_api_url" {
  description = "Public URL for the AI Advisor API"
  value       = aws_lambda_function_url.advisor_url.function_url
}

output "email_api_url" {
  description = "Public URL for the Email API"
  value       = aws_lambda_function_url.email_url.function_url
}

output "history_api_url" {
  description = "Public URL for the History API"
  value       = aws_lambda_function_url.history_url.function_url
}

output "create_listing_url" {
  description = "Public URL for creating listings"
  value       = aws_lambda_function_url.create_listing_url.function_url
}

output "get_listings_url" {
  description = "Public URL for fetching listings"
  value       = aws_lambda_function_url.get_listings_url.function_url
}

output "send_message_url" {
  description = "Public URL for sending messages"
  value       = aws_lambda_function_url.send_message_url.function_url
}

output "get_conversations_url" {
  description = "Public URL for fetching user conversations"
  value       = aws_lambda_function_url.get_conversations_url.function_url
}

output "get_messages_url" {
  description = "Public URL for fetching conversation messages"
  value       = aws_lambda_function_url.get_messages_url.function_url
}

# Frontend URL (HTTP - S3 Website)
output "frontend_url" {
  description = "Public URL for the hosted frontend application (HTTP)"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

# Step Functions
output "state_machine_arn" {
  description = "ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.mlops_pipeline.arn
}

output "state_machine_name" {
  description = "Name of the Step Functions state machine"
  value       = aws_sfn_state_machine.mlops_pipeline.name
}

# EventBridge Schedule
output "schedule_expression" {
  description = "How often the pipeline runs"
  value       = aws_cloudwatch_event_rule.pipeline_schedule.schedule_expression
}

# IAM Roles (AWS Academy - using LabRole)
output "lab_role_arn" {
  description = "ARN of the AWS Academy LabRole used for all services"
  value       = data.aws_iam_role.lab_role.arn
}

# Region
output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

# Helpful AWS Console URLs
output "console_urls" {
  description = "Direct links to AWS Console"
  value = {
    step_functions = "https://${var.aws_region}.console.aws.amazon.com/states/home?region=${var.aws_region}#/statemachines/view/${aws_sfn_state_machine.mlops_pipeline.arn}"
    s3_data        = "https://s3.console.aws.amazon.com/s3/buckets/${aws_s3_bucket.data_lake.id}"
    s3_models      = "https://s3.console.aws.amazon.com/s3/buckets/${aws_s3_bucket.model_artifacts.id}"
    s3_frontend    = "https://s3.console.aws.amazon.com/s3/buckets/${aws_s3_bucket.frontend.id}"
    dynamodb       = "https://console.aws.amazon.com/dynamodbv2/home?region=${var.aws_region}#tables:selected=${aws_dynamodb_table.estimates.name}"
    dynamodb_listings = "https://console.aws.amazon.com/dynamodbv2/home?region=${var.aws_region}#tables:selected=${aws_dynamodb_table.listings.name}"
  }
}
