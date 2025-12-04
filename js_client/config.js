// === Fill these with your environment values ===
window.APP_CONFIG = {
  region: "us-east-2", // e.g., "us-east-1"
  userPoolId: "us-east-2_gBq4DlIOc",
  userPoolClientId: "1usfarvlqk1filbgeqskn2ruul",
  cognitoDomain: "us-east-2gbq4dlioc.auth.us-east-2.amazoncognito.com", // e.g., "myapp.auth.us-east-1.amazoncognito.com"
  redirectUri: "https://dpz1lhckwu42w.cloudfront.net/", // change to "http://localhost:4200/" only when testing
  apiBaseUrl: "https://f58yls4u54.execute-api.us-east-2.amazonaws.com/dev/backend", // no trailing slash
  mediaBucketPublicBaseUrl: "https://YOUR_CLOUDFRONT_DOMAIN/media/", // if you front S3 media with CloudFront; optional
};