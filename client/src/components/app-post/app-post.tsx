import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { PostJSON } from 'src/shared';

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
  post: PostJSON & { imgData?: string };

  async componentWillLoad() {
    this.app.loading = true;
    try {
      this.post = await this.app.fetchPost(this.announceID, this.postID);
      if (this.post?.img) {
        this.post.imgData = this.app.getImageURI(this.post.img);
      }
    } finally {
      this.app.loading = false;
    }
  }

  render() {
    if (!this.post) {
      return;
    }

    return (
      <Host>
        <ap-post post={this.post} msgs={{ datetime: this.app.msgs.common.datetime }} />
        <a class="back" {...this.app.href(`/${this.announceID}`, true)}>
          {this.app.msgs.common.back}
        </a>
      </Host>
    );
  }
}
