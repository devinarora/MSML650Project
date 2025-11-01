import {
  AfterViewInit,
  Component,
  ComponentRef,
  inputBinding,
  outputBinding,
  signal,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostContent } from '../post-content/post-content';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-feed',
  imports: [FormsModule],
  templateUrl: './feed.html',
  styleUrl: './feed.css',
})
export class Feed implements AfterViewInit {
  @ViewChild('feed', { read: ViewContainerRef }) feed: ViewContainerRef;
  private postArray: ComponentRef<PostContent>[];
  constructor() {}

  temporaryTestUser = 'TestUser';
  postText: string;
  testArray = ['Test1', 'Test2', 'Test3', 'Test4', 'Test55'];

  ngOnInit() {
    this.postArray = [];
  }

  ngAfterViewInit() {
    this.createTestPosts();
  }

  createTestPosts() {
    for (let i = 0; i < this.testArray.length; i++) {
      this.createFeedHTML(i.toString(), this.testArray[i]);
    }
  }

  async getPosts() {
    // try {
    //   // Need to connect to AWS API Gateway
    //   const response = await fetch(
    //     '', // API URL 
    //     {
    //       method: 'GET',
    //       headers: {
    //         'Content-Type': 'application/json',
    //         Accept: 'application/json',
    //       },
    //     }
    //   );

    //   if (!response.ok) {
    //     throw new Error(`Error! status: ${response.status}`);
    //   }

    //   // TODO iterate over response posts with createFeedHTML

    // } catch (error) {
    //   console.log('error!');
    // }
  }

  createFeedHTML(postId: string, postText: string) {
    const component = this.feed.createComponent(PostContent, {
      bindings: [
        inputBinding('postText', signal(postText)),
        inputBinding('postId', signal(postId.toString())),
        outputBinding<string>('deleteClicked', (post) => this.deletePost(post)),
      ],
    });
    this.postArray.push(component);
  }

  async onPostSubmit() {
    if (!this.postText) {
      return;
    }
    console.log(this.postText);
    const postID = uuidv4();
    this.createFeedHTML(postID, this.postText);

    // try {
    //   // Need to connect to AWS API Gateway
    //   const response = await fetch(
    //     '', // API URL 
    //     {
    //       method: 'POST',
    //       body: JSON.stringify({
    //         postID: postID,
    //         author: this.temporaryTestUser,
    //         datetime: new Date(),
    //         text: this.postText,
    //       }),
    //       headers: {
    //         'Content-Type': 'application/json',
    //         Accept: 'application/json',
    //       },
    //     }
    //   );

    //   if (!response.ok) {
    //     throw new Error(`Error! status: ${response.status}`);
    //   }

    //   
    // } catch (error) {
    //   console.log('error!');
    // }
    this.postText = '';
  }

  async deletePost(postId: string) {
    const postToDelete = this.postArray.find(
      (post) => post.instance.postId === postId
    ) as ComponentRef<PostContent>;
    const postIndex = this.postArray.indexOf(postToDelete);
    this.feed.remove(postIndex);
    this.postArray.splice(postIndex, 1);
    console.log(postId);

    // try {
    //   // Need to connect to AWS API Gateway
    //   const response = await fetch(
    //     '', // API URL 
    //     {
    //       method: 'Delete',
    //       body: JSON.stringify({
    //         postID: postId
    //       }),
    //       headers: {
    //         'Content-Type': 'application/json',
    //         Accept: 'application/json',
    //       },
    //     }
    //   );

    //   if (!response.ok) {
    //     throw new Error(`Error! status: ${response.status}`);
    //   }

    //   this.createFeedHTML(uuidv4(), this.postText);
    // } catch (error) {
    //   console.log('error!');
    // }
  }
}
