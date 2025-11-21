# =========================================
# VARIABLES - Configuration values for the project
# =========================================

variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "us-east-1"  # AWS Academy typically uses us-east-1
  # Change to "eu-west-1" if you have a regular AWS account
}

variable "project_name" {
  description = "Project name used for naming resources"
  type        = string
  default     = "housing-price-pred-kssmvv"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "schedule_expression" {
  description = "How often the pipeline runs (cron or rate expression)"
  type        = string
  default     = "rate(7 days)" # Runs weekly
  # Example alternatives:
  # "rate(1 day)" - daily
  # "cron(0 2 * * ? *)" - daily at 2 AM UTC
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "Housing Price Prediction"
    ManagedBy   = "Terraform"
    Environment = "dev"
  }
}

variable "openai_api_key" {
  description = "API key for OpenAI. Provide via TF_VAR_openai_api_key environment variable."
  type        = string
  default     = ""
  sensitive   = true
}
