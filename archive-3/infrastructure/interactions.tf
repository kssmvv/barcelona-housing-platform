# =========================================
# DYNAMODB - Interactions
# =========================================

resource "aws_dynamodb_table" "favorites" {
  name           = "${var.project_name}-favorites-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "user_id"
  range_key      = "listing_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "listing_id"
    type = "S"
  }

  tags = merge(var.tags, { Name = "Favorites Table" })
}

resource "aws_dynamodb_table" "listing_views" {
  name           = "${var.project_name}-views-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "listing_id"
  range_key      = "viewer_id"

  attribute {
    name = "listing_id"
    type = "S"
  }

  attribute {
    name = "viewer_id"
    type = "S"
  }

  tags = merge(var.tags, { Name = "Listing Views Table" })
}

resource "aws_dynamodb_table" "bids" {
  name           = "${var.project_name}-bids-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "listing_id"
  range_key      = "timestamp"

  attribute {
    name = "listing_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  tags = merge(var.tags, { Name = "Bids Table" })
}

# =========================================
# LAMBDA - Favorites
# =========================================

data "archive_file" "toggle_favorite_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/toggle_favorite"
  output_path = "${path.module}/toggle_favorite.zip"
}

resource "aws_lambda_function" "toggle_favorite" {
  filename         = data.archive_file.toggle_favorite_zip.output_path
  function_name    = "${var.project_name}-toggle-favorite-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.toggle_favorite_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 15

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.favorites.name
    }
  }
}

resource "aws_lambda_function_url" "toggle_favorite_url" {
  function_name      = aws_lambda_function.toggle_favorite.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
  }
}

data "archive_file" "get_favorites_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/get_favorites"
  output_path = "${path.module}/get_favorites.zip"
}

resource "aws_lambda_function" "get_favorites" {
  filename         = data.archive_file.get_favorites_zip.output_path
  function_name    = "${var.project_name}-get-favorites-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.get_favorites_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 15

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.favorites.name
    }
  }
}

resource "aws_lambda_function_url" "get_favorites_url" {
  function_name      = aws_lambda_function.get_favorites.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
  }
}

# =========================================
# LAMBDA - Analytics
# =========================================

data "archive_file" "track_view_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/track_view"
  output_path = "${path.module}/track_view.zip"
}

resource "aws_lambda_function" "track_view" {
  filename         = data.archive_file.track_view_zip.output_path
  function_name    = "${var.project_name}-track-view-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.track_view_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 15

  environment {
    variables = {
      LISTINGS_TABLE_NAME = aws_dynamodb_table.listings.name
      VIEWS_TABLE_NAME    = aws_dynamodb_table.listing_views.name
    }
  }
}

resource "aws_lambda_function_url" "track_view_url" {
  function_name      = aws_lambda_function.track_view.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
  }
}

# =========================================
# LAMBDA - Auctions
# =========================================

data "archive_file" "place_bid_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/lambdas/place_bid"
  output_path = "${path.module}/place_bid.zip"
}

resource "aws_lambda_function" "place_bid" {
  filename         = data.archive_file.place_bid_zip.output_path
  function_name    = "${var.project_name}-place-bid-${var.environment}"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.place_bid_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 15

  environment {
    variables = {
      LISTINGS_TABLE_NAME = aws_dynamodb_table.listings.name
      BIDS_TABLE_NAME     = aws_dynamodb_table.bids.name
    }
  }
}

resource "aws_lambda_function_url" "place_bid_url" {
  function_name      = aws_lambda_function.place_bid.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
  }
}

