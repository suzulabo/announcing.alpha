import { Component, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceAndMeta, PostJSON } from 'src/shared';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { redirectRoute } from 'src/shared-ui/utils/route';

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
    this.announceState = undefined;

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

  @Prop()
  postID!: string;

  @Watch('postID')
  watchPostID() {
    this.postState = undefined;
  }

  @Listen('FirestoreUpdated')
  handleFirestoreUpdated(event: FirestoreUpdatedEvent) {
    const { collection, id } = event.detail;
    if (collection == 'announces' && id == this.announceID) {
      this.announceState = undefined;
    }
  }

  @State()
  announceState?: PromiseState<{
    announce: AnnounceAndMeta;
    iconImgPromise?: PromiseState<string>;
  }>;

  @State()
  postState?: PromiseState<{ post: PostJSON; imgPromise?: PromiseState<string>; imgHref?: string }>;

  private naviLinks!: ApNaviLinks;
  private naviLinksLoading!: ApNaviLinks;

  private async loadAnnounce() {
    const id = this.announceID;
    const announce = await this.app.getAnnounceAndMeta(id);
    if (announce) {
      return {
        announce,
        iconImgPromise: announce.icon
          ? new PromiseState(this.app.fetchImage(announce.icon))
          : undefined,
      };
    }
    return;
  }

  private async loadPost() {
    const id = this.announceID;
    const postID = this.postID;
    const post = await this.app.fetchPost(id, postID);
    if (post) {
      return {
        post,
        imgPromise: post.img ? new PromiseState(this.app.fetchImage(post.img)) : undefined,
        imgHref: post.img ? `/${this.announceID}/${this.postID}/image/${post.img}` : undefined,
      };
    }
    return;
  }

  componentWillLoad() {
    this.watchAnnounceID();
  }

  componentWillRender() {
    if (!this.announceState) {
      this.announceState = new PromiseState(this.loadAnnounce());
    }
    if (!this.postState) {
      this.postState = new PromiseState(this.loadPost());
    }
  }

  private shareClick = async () => {
    try {
      await this.app.share(`${this.app.clientSite}/${this.announceID}/${this.postID}`);
    } catch {
      //
    }
  };

  private renderContext() {
    const announceStatus = this.announceState?.status();
    const postStatus = this.postState?.status();
    return {
      announceStatus,
      postStatus,
      loaded: announceStatus?.state == 'fulfilled' && postStatus?.state == 'fulfilled',
    };
  }

  private renderAnnounce(ctx: ReturnType<AppPost['renderContext']>) {
    const status = ctx.announceStatus;
    if (!status) return;

    switch (status.state) {
      case 'rejected':
      case 'fulfilled-empty':
        redirectRoute(`/${this.announceID}`);
        return;
      case 'fulfilled': {
        const enableNotification = this.app.getNotification(this.announceID) != null;
        const isFollow = this.app.getFollow(this.announceID) != null;
        const { announce, iconImgPromise } = status.value;
        return (
          <ap-announce
            announce={announce}
            iconImgPromise={iconImgPromise}
            icons={{ isFollow, enableNotification }}
          />
        );
      }
      default:
        return <ap-spinner />;
    }
  }

  private renderPost(ctx: ReturnType<AppPost['renderContext']>) {
    if (ctx.announceStatus?.state != 'fulfilled') return;

    const status = ctx.postStatus;
    if (!status) return;

    switch (status.state) {
      case 'rejected':
      case 'fulfilled-empty':
        redirectRoute(`/${this.announceID}`);
        return;
      case 'fulfilled': {
        const { post, imgPromise, imgHref } = status.value;

        const { announce } = ctx.announceStatus.value;
        this.app.setTitle(
          this.app.msgs.post.pageTitle(announce.name, post.title || post.body?.substr(0, 20) || ''),
        );

        return (
          <ap-post
            post={post}
            imgPromise={imgPromise}
            imgHref={imgHref}
            msgs={{ datetime: this.app.msgs.common.datetime }}
          />
        );
      }
      default:
        return <ap-spinner />;
    }
  }

  render() {
    const ctx = this.renderContext();

    return (
      <Host>
        {this.renderAnnounce(ctx)}
        {this.renderPost(ctx)}
        <ap-navi links={ctx.loaded ? this.naviLinks : this.naviLinksLoading} />
      </Host>
    );
  }
}
