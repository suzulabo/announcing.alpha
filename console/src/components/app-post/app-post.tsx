import { Component, h, Host, Prop } from '@stencil/core';
import { Post } from 'announsing-shared';
import { App } from 'src/app/app';
import { AnnounceState } from 'src/app/datatypes';

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

  private announce: AnnounceState;
  private post: Post;

  async componentWillLoad() {
    const as = await this.app.getAnnounceState(this.announceID.toUpperCase());
    if (!as) {
      this.app.pushRoute(`/${this.announceID}`);
      return;
    }
    this.announce = as;

    this.post = await this.app.getPost(this.announceID, this.postID);
    if (!this.post) {
      this.app.pushRoute(`/${this.announceID}`);
      return;
    }
  }

  render() {
    if (!this.announce || !this.post) {
      return;
    }

    return (
      <Host>
        <span class="title">{this.post.title}</span>
        <hr />
        <span class="body">{this.post.body}</span>
        {this.post.link && <a href={this.post.link}></a>}
        <div class="buttons">
          <a {...this.app.href(`/${this.announceID}/${this.postID}/edit_`)}>
            {this.app.msgs.post.edit}
          </a>
          <a>{this.app.msgs.post.delete}</a>
        </div>
        <a {...this.app.href(`/${this.announceID}`, true)}>{this.app.msgs.common.back}</a>
      </Host>
    );
  }
}
