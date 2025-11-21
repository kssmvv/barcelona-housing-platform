# =========================================
# MESSAGING SYSTEM - In-App Chat
# =========================================

# DynamoDB Table: conversations
resource "aws_dynamodb_table" "conversations" {
  name           = "${var.project_name}-conversations-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "conversation_id"
  range_key      = "timestamp"

  attribute {
    name = "conversation_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  tags = merge(var.tags, { Name = "Conversations Table" })
}

# DynamoDB Table: user_conversations (Index)
resource "aws_dynamodb_table" "user_conversations" {
  name           = "${var.project_name}-user-conversations-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "user_id"
  range_key      = "last_message_timestamp"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "last_message_timestamp"
    type = "S"
  }

  attribute {
    name = "conversation_id"
    type = "S"
  }

  global_secondary_index {
    name            = "conversation_id_index"
    hash_key        = "conversation_id"
    projection_type = "ALL"
  }

  tags = merge(var.tags, { Name = "User Conversations Index" })
}

# Lambda: send_message
data "archive_file" "send_message_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/send_message"
  output_path = "${path.module}/send_message.zip"
}

resource "aws_lambda_function" "send_message" {
  filename         = data.archive_file.send_message_zip.output_path
  function_name    = "${var.project_name}-send-message-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.send_message_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      CONVERSATIONS_TABLE      = aws_dynamodb_table.conversations.name
      USER_CONVERSATIONS_TABLE = aws_dynamodb_table.user_conversations.name
      ENVIRONMENT              = var.environment
    }
  }

  tags = merge(var.tags, { Name = "Send Message Lambda" })
}

resource "aws_lambda_function_url" "send_message_url" {
  function_name      = aws_lambda_function.send_message.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
  }
}

# Lambda: get_conversations
data "archive_file" "get_conversations_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/get_conversations"
  output_path = "${path.module}/get_conversations.zip"
}

resource "aws_lambda_function" "get_conversations" {
  filename         = data.archive_file.get_conversations_zip.output_path
  function_name    = "${var.project_name}-get-conversations-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.get_conversations_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      USER_CONVERSATIONS_TABLE = aws_dynamodb_table.user_conversations.name
      ENVIRONMENT              = var.environment
    }
  }

  tags = merge(var.tags, { Name = "Get Conversations Lambda" })
}

resource "aws_lambda_function_url" "get_conversations_url" {
  function_name      = aws_lambda_function.get_conversations.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
  }
}

# Lambda: get_messages
data "archive_file" "get_messages_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/get_messages"
  output_path = "${path.module}/get_messages.zip"
}

resource "aws_lambda_function" "get_messages" {
  filename         = data.archive_file.get_messages_zip.output_path
  function_name    = "${var.project_name}-get-messages-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.get_messages_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      CONVERSATIONS_TABLE = aws_dynamodb_table.conversations.name
      ENVIRONMENT         = var.environment
    }
  }

  tags = merge(var.tags, { Name = "Get Messages Lambda" })
}

resource "aws_lambda_function_url" "get_messages_url" {
  function_name      = aws_lambda_function.get_messages.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
  }
}

