import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { PostJSON } from 'src/shared';

@Component({
  tag: 'app-post',
  styleUrl: 'app-post.scss',
})
export class AppPost {
  @Prop()
  app!: App;

  @Prop()
  announceID!: string;

  @Prop()
  postID!: string;

  @State()
  post?: PostJSON & { imgLoader?: () => Promise<string> };

  async componentWillLoad() {
    this.app.loadAnnounce(this.announceID);
    await this.app.processLoading(async () => {
      const post = await this.app.fetchPost(this.announceID, this.postID);
      if (post?.state != 'SUCCESS') {
        return;
      }
      this.post = post.value;

      const img = this.post.img;
      if (img) {
        this.post.imgLoader = async () => {
          const v = await this.app.fetchImage(img);
          if (v?.state != 'SUCCESS') {
            throw new Error('fetch error');
          }
          return v.value;
        };
      }
    });
  }

  private shareClick = async () => {
    try {
      await this.app.share(location.href);
    } catch {
      //
    }
  };

  render() {
    const a = this.app.getAnnounceState(this.announceID);

    if (a?.state != 'SUCCESS') {
      return;
    }

    this.app.setTitle(
      this.app.msgs.post.pageTitle(
        a.value.name,
        this.post?.title || this.post?.body?.substr(0, 20) || '',
      ),
    );

    if (!this.post) {
      return (
        <Host>
          <div class="deleted">{this.app.msgs.post.deleted}</div>
          <a class="back" {...this.app.href(`/${this.announceID}`, true)}>
            {this.app.msgs.common.back}
          </a>
        </Host>
      );
    }

    return (
      <Host>
        <ap-post post={this.post} msgs={{ datetime: this.app.msgs.common.datetime }} />
        <a class="back" {...this.app.href(`/${this.announceID}`, true)}>
          {this.app.msgs.common.back}
        </a>
        {this.app.checkShareSupport() && (
          <button class="anchor share" onClick={this.shareClick}>
            {this.app.msgs.post.share}
          </button>
        )}
      </Host>
    );
  }
}
