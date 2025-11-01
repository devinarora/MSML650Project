import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { Amplify } from 'aws-amplify';
import { environment } from './environments/environment';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.clientId,
      loginWith: {
        oauth: {
          domain: environment.cognito.domain,        // no https://
          scopes: ['openid', 'email', 'phone'],
          redirectSignIn:  [environment.cognito.redirectSignIn],
          redirectSignOut: [environment.cognito.redirectSignOut],
          responseType: 'code',
        },
      },
    },
  },
});

bootstrapApplication(App, appConfig).catch(err => console.error(err));
