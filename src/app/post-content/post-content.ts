import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-post-content',
  imports: [],
  templateUrl: './post-content.html',
  styleUrl: './post-content.css',
})
export class PostContent {
  @Input() postText: string = '';
  @Input() postId: string;

  @Output() deleteClicked: EventEmitter<any> = new EventEmitter();

  onDeleteSubmit() {
    this.deleteClicked.emit(this.postId);
  }
}
