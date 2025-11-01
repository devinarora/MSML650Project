// src/app/app.ts
import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { Feed } from './feed/feed';

// Amplify v6 auth helpers
import {
  getCurrentUser,
  signInWithRedirect,
  signOut,
  fetchAuthSession,
} from 'aws-amplify/auth';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, Feed],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('650Project');

  // auth state
  isAuthed = signal(false);
  username = signal('');

  async ngOnInit() {
    await this.refreshUserState();
  }

  private async refreshUserState() {
    try {
      const user = await getCurrentUser();
      this.isAuthed.set(true);
      this.username.set(user.username ?? '');
    } catch {
      this.isAuthed.set(false);
      this.username.set('');
    }
  }

  // Start Cognito Hosted UI flow
  login() {
    signInWithRedirect();
  }

  async logout() {
    await signOut();
    // back to app root after logout
    window.location.href = environment.cognito.redirectSignOut;
  }

  // (Optional) get ID token for API calls
  async getIdToken(): Promise<string | undefined> {
    const { tokens } = await fetchAuthSession();
    return tokens?.idToken?.toString();
  }
}
