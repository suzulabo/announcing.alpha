import { Component, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import assert from 'assert';
import { App } from 'src/app/app';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PageVisible } from 'src/shared-ui/utils/pagevisible';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { redirectRoute } from 'src/shared-ui/utils/route';
import { AsyncReturnType } from 'type-fest';

@Component({
  tag: 'app-post',
  styleUrl: 'app-post.scss',
})
export class AppPost {
  @Prop()
  pageVisible!: PageVisible;

  componentShouldUpdate() {
    return this.pageVisible.shouldUpdate();
  }

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

  @Listen('FirestoreUpdated', { target: 'window' }) handleFirestoreUpdated(
    event: FirestoreUpdatedEvent,
  ) {
    const { collection, id } = event.detail;
    if (collection == 'announces' && id == this.announceID) {
      this.announceState = undefined;
    }
  }

  @State()
  announceState?: PromiseState<AsyncReturnType<AppPost['loadAnnounce']>>;

  @State()
  postState?: PromiseState<AsyncReturnType<AppPost['loadPost']>>;

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
      await this.app.setReadTime(this.announceID, post.pT);

      return {
        post,
        imgPromise: post.img ? new PromiseState(this.app.fetchImage(post.img)) : undefined,
        imgHref: post.img ? `/${this.announceID}/${this.postID}/image/${post.img}` : undefined,
      };
    }
    return;
  }

  private shareClick = async () => {
    try {
      await this.app.share(`${this.app.clientSite}/${this.announceID}/${this.postID}`);
    } catch {
      //
    }
  };

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

  private renderContext() {
    const announceStatus = this.announceState?.status();
    assert(announceStatus);
    const postStatus = this.postState?.status();
    assert(postStatus);
    const icons = {
      follow: this.app.getFollow(this.announceID) != null,
      notification: this.app.getNotification(this.announceID) != null,
    };
    const { announce } = this.announceState?.result() || {};
    const { post } = this.postState?.result() || {};
    const naviLinks = announce && post ? this.naviLinks : this.naviLinksLoading;
    const pageTitle =
      announce && post
        ? this.app.msgs.post.pageTitle(
            announce.name,
            post?.title || post?.body?.substr(0, 20) || '',
          )
        : this.app.msgs.common.pageTitle;
    return {
      msgs: this.app.msgs,
      announceID: this.announceID,
      announceStatus,
      postStatus,
      icons,
      config: this.app.getConfig() || {},
      naviLinks,
      pageTitle,
    };
  }

  render() {
    return render(this.renderContext());
  }
}

type RenderContext = ReturnType<AppPost['renderContext']>;

const render = (ctx: RenderContext) => {
  return (
    <Host>
      {renderAnnounce(ctx)}
      {renderPost(ctx)}
      <ap-navi links={ctx.naviLinks} />
      <ap-head pageTitle={ctx.pageTitle} />
    </Host>
  );
};

const renderAnnounce = (ctx: RenderContext) => {
  const status = ctx.announceStatus;

  switch (status.state) {
    case 'rejected':
    case 'fulfilled-empty':
      redirectRoute(`/${ctx.announceID}`);
      return;
    case 'fulfilled': {
      const { announce, iconImgPromise } = status.value;
      return <ap-announce announce={announce} iconImgPromise={iconImgPromise} icons={ctx.icons} />;
    }
    default:
      return <ap-spinner />;
  }
};

const renderPost = (ctx: RenderContext) => {
  if (ctx.announceStatus.state != 'fulfilled') return;

  const status = ctx.postStatus;

  switch (status.state) {
    case 'rejected':
    case 'fulfilled-empty':
      redirectRoute(`/${ctx.announceID}`);
      return;
    case 'fulfilled': {
      const { post, imgPromise, imgHref } = status.value;

      return (
        <ap-post
          post={post}
          imgPromise={imgPromise}
          imgHref={imgHref}
          msgs={{ datetime: ctx.msgs.common.datetime }}
          showTweet={ctx.config.embedTwitter}
          showYoutube={ctx.config.embedYoutube}
        />
      );
    }
    default:
      return <ap-spinner />;
  }
};
