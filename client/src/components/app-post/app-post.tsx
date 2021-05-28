import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { DataResult, DATA_ERROR } from 'src/app/datatypes';
import { PostJSON } from '@announcing-shared';

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
  post?: DataResult<
    PostJSON & { imgLoader?: () => Promise<string>; imgAnchorAttrs?: { [k: string]: any } }
  >;

  componentWillLoad() {
    this.app.loadAnnounce(this.announceID);
    this.app
      .fetchPost(this.announceID, this.postID)
      .then(result => {
        this.post = result;
        if (this.post?.state == 'SUCCESS') {
          const img = this.post.value.img;
          if (img) {
            this.post.value.imgLoader = async () => {
              const v = await this.app.fetchImage(img);
              if (v?.state != 'SUCCESS') {
                throw new Error('fetch error');
              }
              return v.value;
            };
            this.post.value.imgAnchorAttrs = this.app.href(
              `/${this.announceID}/${this.postID}/image/${img}`,
            );
          }
        }
      })
      .catch(err => {
        this.post = DATA_ERROR;
        throw err;
      });
  }

  private shareClick = async () => {
    try {
      await this.app.share(`${this.app.clientSite}/${this.announceID}/${this.postID}`);
    } catch {
      //
    }
  };

  render() {
    const a = this.app.getAnnounceState(this.announceID);

    if (!a || !this.post) {
      return <ap-spinner />;
    }

    if (a.state != 'SUCCESS' || this.post.state != 'SUCCESS') {
      this.app.pushRoute(`/${this.announceID}`, true);
      return;
    }

    this.app.setTitle(
      this.app.msgs.post.pageTitle(
        a.value.name,
        this.post.value.title || this.post.value.body?.substr(0, 20) || '',
      ),
    );

    return (
      <Host>
        <ap-post post={this.post.value} msgs={{ datetime: this.app.msgs.common.datetime }} />
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
