import { Component, Fragment, h, Host, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { DataResult, DATA_ERROR, PostJSON } from 'src/shared';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';

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
    this.loadAnnounce();
  }

  @Prop()
  postID!: string;
  @Watch('postID')
  watchPostID() {
    this.loadPost();
  }

  @State()
  post?: DataResult<
    PostJSON & { imgLoader?: () => Promise<string>; imgHrefAttrs?: Record<string, any> }
  >;

  private naviLinks!: ApNaviLinks;
  private naviLinksLoading!: ApNaviLinks;

  private loadAnnounce() {
    this.app.loadAnnounce(this.announceID);

    this.naviLinksLoading = [
      {
        label: this.app.msgs.common.back,
        href: `/${this.announceID}`,
        back: true,
      },
    ];
    this.naviLinks = [...this.naviLinksLoading];
    if (this.app.checkShareSupport()) {
      this.naviLinks.push({
        label: this.app.msgs.post.share,
        handler: this.shareClick,
      });
    }
  }

  private loadPost() {
    this.post = undefined;
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

  private shareClick = async () => {
    try {
      await this.app.share(`${this.app.clientSite}/${this.announceID}/${this.postID}`);
    } catch {
      //
    }
  };

  componentWillLoad() {
    this.loadAnnounce();
    this.loadPost();
  }

  render() {
    const a = this.app.getAnnounceState(this.announceID);

    const renderContent = () => {
      if (!a) {
        return <ap-spinner />;
      }

      if (a.state != 'SUCCESS') {
        this.app.pushRoute(`/${this.announceID}`, true);
        return;
      }

      const announce = a.value;
      const enableNotification = this.app.getNotification(this.announceID) != null;
      const isFollow = this.app.getFollow(this.announceID) != null;

      const apAnnounce = (
        <ap-announce
          announce={{ ...announce, isFollow, enableNotification, href: `/${this.announceID}` }}
        />
      );

      if (!this.post) {
        return (
          <Fragment>
            {apAnnounce}
            <ap-spinner />
          </Fragment>
        );
      }

      if (this.post.state != 'SUCCESS') {
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
        <Fragment>
          {apAnnounce}
          <ap-post post={this.post.value} msgs={{ datetime: this.app.msgs.common.datetime }} />
          {this.app.checkShareSupport() && (
            <button class="anchor share" onClick={this.shareClick}>
              {this.app.msgs.post.share}
            </button>
          )}
        </Fragment>
      );
    };

    const loaded = a?.state == 'SUCCESS' && this.post?.state == 'SUCCESS';

    return (
      <Host>
        <ap-navi links={loaded ? this.naviLinks : this.naviLinksLoading} />
        {renderContent()}
      </Host>
    );
  }
}
