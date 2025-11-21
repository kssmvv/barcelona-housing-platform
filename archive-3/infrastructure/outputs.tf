
output "toggle_favorite_url" {
  description = "Public URL for toggling favorites"
  value       = aws_lambda_function_url.toggle_favorite_url.function_url
}

output "get_favorites_url" {
  description = "Public URL for fetching favorites"
  value       = aws_lambda_function_url.get_favorites_url.function_url
}

output "track_view_url" {
  description = "Public URL for tracking views"
  value       = aws_lambda_function_url.track_view_url.function_url
}

output "place_bid_url" {
  description = "Public URL for placing bids"
  value       = aws_lambda_function_url.place_bid_url.function_url
}
