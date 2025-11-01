export const environment = {
  production: false,
  cognito: {
    userPoolId: 'us-east-2_gbq4DlI0c',
    clientId: '20b7ku0u9p4eckronh7183hcst',
    // hostname only, no protocol
    domain: 'us-east-2gbq4dlioc.auth.us-east-2.amazoncognito.com',
    // must exactly match Cognito app client URLs (including trailing slash)
    redirectSignIn:  'http://localhost:4200/',
    redirectSignOut: 'http://localhost:4200/',
  }
};
