window.APP_CONFIG = {
  region: "us-east-2",
  userPoolId: "us-east-2_gBq4DlIOc",
  userPoolClientId: "1usfarvlqk1filbgeqskn2ruul",
  cognitoDomain: "us-east-2gbq4dlioc.auth.us-east-2.amazoncognito.com",
  
  // Production URL (CloudFront)
  redirectUri: "https://dpz1lhckwu42w.cloudfront.net/",
  
  // API Endpoint (Currently pointing to 'dev' stage, which is fine if that's your live API)
  apiBaseUrl: "https://f58yls4u54.execute-api.us-east-2.amazonaws.com/dev/backend",
  
  // Media URL
  // If you have a specific CloudFront domain for images, replace the empty string below.
  // Example: "https://d123456.cloudfront.net/"
  mediaBucketPublicBaseUrl: "" 
};