import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Feed } from './feed/feed';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Feed],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('650Project');
}
