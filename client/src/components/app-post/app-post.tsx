import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { DataResult, DATA_ERROR } from 'src/app/datatypes';
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
  @Watch('announceID')
  watchAnnounceID() {
    this.loadData();
  }

  @Prop()
  postID!: string;
  @Watch('postID')
  watchPostID() {
    this.loadData();
  }

  @State()
  post?: DataResult<
    PostJSON & { imgLoader?: () => Promise<string>; imgHrefAttrs?: Record<string, any> }
  >;

  private loadData() {
    this.post = undefined;
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
            this.post.value.imgHrefAttrs = this.app.href(
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

  componentWillLoad() {
    this.loadData();
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
