import { Component, Fragment, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import assert from 'assert';
import { App } from 'src/app/app';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PageVisible } from 'src/shared-ui/utils/pagevisible';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { AsyncReturnType } from 'type-fest';

@Component({
  tag: 'app-announce',
  styleUrl: 'app-announce.scss',
})
export class AppAnnounce {
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

    this.naviLinks = [
      {
        label: this.app.msgs.common.back,
        href: '/',
        back: true,
      },
      {
        label: this.app.msgs.announce.detail,
        href: `/${this.announceID}/config`,
      },
    ];
    this.naviLinksLoading = [
      {
        label: this.app.msgs.common.back,
        href: '/',
        back: true,
      },
    ];
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
  announceState?: PromiseState<AsyncReturnType<AppAnnounce['loadAnnounce']>>;

  private async loadAnnounce() {
    const id = this.announceID;
    const announce = await this.app.getAnnounceAndMeta(id);
    if (announce) {
      const postsPromises = this.app.getPosts(id, announce);

      Object.values(postsPromises).forEach(p => {
        p.lazyThen(post => {
          if (post) {
            void this.app.setReadTime(this.announceID, post.pT);
          }
        });
      });

      return {
        announce,
        iconImgPromise: announce.icon
          ? new PromiseState(this.app.fetchImage(announce.icon))
          : undefined,
        postsPromises,
      };
    }
    return;
  }

  private naviLinks!: ApNaviLinks;
  private naviLinksLoading!: ApNaviLinks;

  componentWillLoad() {
    this.watchAnnounceID();
  }

  componentWillRender() {
    if (!this.announceState) {
      this.announceState = new PromiseState(this.loadAnnounce());
    }
  }

  private renderContext() {
    const announceStatus = this.announceState?.status();
    assert(announceStatus);
    const icons = {
      follow: this.app.getFollow(this.announceID) != null,
      notification: this.app.getNotification(this.announceID) != null,
    };
    const { announce } = this.announceState?.result() || {};
    const naviLinks = announce ? this.naviLinks : this.naviLinksLoading;
    const pageTitle = announce
      ? this.app.msgs.announce.pageTitle(announce.name)
      : this.app.msgs.common.pageTitle;
    return {
      msgs: this.app.msgs,
      announceID: this.announceID,
      announceStatus,
      icons,
      naviLinks,
      pageTitle,
    };
  }

  render() {
    return render(this.renderContext());
  }
}

type RenderContext = ReturnType<AppAnnounce['renderContext']>;

const render = (ctx: RenderContext) => {
  return (
    <Host>
      {renderContent(ctx)}
      <ap-navi links={ctx.naviLinks} position="sticky" />
      <ap-head pageTitle={ctx.pageTitle} />
    </Host>
  );
};

const renderContent = (ctx: RenderContext) => {
  switch (ctx.announceStatus.state) {
    case 'rejected':
      return (
        <Fragment>
          <div class="data-error">{ctx.msgs.announce.dataError}</div>
        </Fragment>
      );
    case 'fulfilled-empty':
      return (
        <Fragment>
          <div class="deleted">{ctx.msgs.announce.deleted}</div>
        </Fragment>
      );

    case 'fulfilled': {
      const { announce, iconImgPromise, postsPromises } = ctx.announceStatus.value;

      return (
        <Fragment>
          <ap-announce
            announce={announce}
            href={`/${ctx.announceID}/config`}
            iconImgPromise={iconImgPromise}
            icons={ctx.icons}
          ></ap-announce>
          <ap-posts
            posts={announce.posts}
            postsPromises={postsPromises}
            hrefFormat={`/${ctx.announceID}/:postID`}
            msgs={{
              datetime: ctx.msgs.common.datetime,
              dataError: ctx.msgs.announce.dataError,
            }}
          />
        </Fragment>
      );
    }
    default:
      return <ap-spinner />;
  }
};
