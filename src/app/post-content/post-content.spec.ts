import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostContent } from './post-content';

describe('PostContent', () => {
  let component: PostContent;
  let fixture: ComponentFixture<PostContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostContent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostContent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
