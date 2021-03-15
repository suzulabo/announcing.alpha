import { Component, h, Host, Prop, State } from '@stencil/core';
import { Post } from 'announsing-shared';
import { App } from 'src/app/app';

@Component({
  tag: 'app-post',
  styleUrl: 'app-post.scss',
})
export class AppPost {
  @Prop()
  app: App;

  @Prop()
  announceID: string;

  @Prop()
  postID: string;

  @State()
  post: Post;

  async componentWillLoad() {
    this.app.loading = true;
    try {
      this.post = await this.app.fetchPost(this.announceID, this.postID);
    } finally {
      this.app.loading = false;
    }
  }

  render() {
    if (!this.post) {
      return;
    }

    const post = this.post;

    return (
      <Host>
        <span class="date">{this.app.msgs.common.datetime(post.pT)}</span>
        <span class="title">{post.title}</span>
        <hr />
        <div class="body">{post.body}</div>
        {post.img && <img src={this.app.getImageURI(post.img)} />}
        <a class="back" {...this.app.href(`/${this.announceID}`, true)}>
          {this.app.msgs.common.back}
        </a>
      </Host>
    );
  }
}
