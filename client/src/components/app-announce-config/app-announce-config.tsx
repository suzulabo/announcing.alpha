import { Component, Fragment, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import assert from 'assert';
import { App } from 'src/app/app';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PageVisible } from 'src/shared-ui/utils/pagevisible';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { redirectRoute } from 'src/shared-ui/utils/route';
import { AsyncReturnType } from 'type-fest';

@Component({
  tag: 'app-announce-config',
  styleUrl: 'app-announce-config.scss',
})
export class AppAnnounceConfig {
  @Prop()
  pageVisible!: PageVisible;

  componentShouldUpdate() {
    return this.pageVisible.shouldUpdate();
  }

  @Listen('PageActivated')
  listenPageActivated() {
    this.permission = undefined;
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
        href: `/${this.announceID}`,
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
  announceState?: PromiseState<AsyncReturnType<AppAnnounceConfig['loadAnnounce']>>;

  @State()
   permission?: AsyncReturnType<App["checkNotifyPermission"]>;

  private async loadAnnounce(id: string) {
    const announce = await this.app.getAnnounceAndMeta(id);
    if (announce) {
      return {
        announce,
        iconImgPromise: announce.icon
          ? new PromiseState(this.app.fetchImage(announce.icon))
          : undefined,
      } as const;
    }
    return;
  }

  private naviLinks!: ApNaviLinks;

  componentWillLoad() {
    this.watchAnnounceID();
  }

  private handleEnableNotifyClick = async () => {
    await this.app.processLoading(async () => {
      await this.app.setNotify(this.announceID, true);
    });
  };

  private handleDisableNotifyClick = async () => {
    await this.app.processLoading(async () => {
      await this.app.setNotify(this.announceID, false);
    });
  };

  private handleUnfollowClick = async () => {
    await this.app.processLoading(async () => {
      await this.app.deleteFollow(this.announceID);
    });
  };

  private handleFollowClick = async () => {
    await this.app.processLoading(async () => {
      const a = this.announceState?.result();
      if (a) {
        const name = a.announce.name;
        const latestPost = await this.app.getLatestPost(this.announceID, a.announce);
        const readTime = latestPost?.pT || 0;
        await this.app.setFollow(this.announceID, { name, readTime });
      } else {
        // never
      }
    });
  };


  async componentWillRender() {
    if (!this.announceState) {
      this.announceState = new PromiseState(this.loadAnnounce(this.announceID));
    }
    this.permission =  await this.app.checkNotifyPermission(false);

  }

  private renderContext() {
    const announceStatus = this.announceState?.status();
    assert(announceStatus);
    const icons = {
      follow: this.app.getFollow(this.announceID) != null,
      notification: this.app.getNotification(this.announceID) != null,
    };
    const naviLinks = this.naviLinks;

    const { announce } = this.announceState?.result() || {};
    const pageTitle = announce
      ? this.app.msgs.announceConfig.pageTitle(announce.name)
      : this.app.msgs.common.pageTitle;
    return {
      msgs: this.app.msgs,
      announceID: this.announceID,
      announceStatus,
      permission: this.permission,
      icons,
      naviLinks,
      pageTitle,
      handleUnfollowClick: this.handleUnfollowClick,
      handleFollowClick: this.handleFollowClick,
      handleEnableNotifyClick: this.handleEnableNotifyClick,
      handleDisableNotifyClick: this.handleDisableNotifyClick,
    };
  }

  render() {
    return render(this.renderContext());
  }
}

type RenderContext = ReturnType<AppAnnounceConfig['renderContext']>;

const render = (ctx: RenderContext) => {
  return (
    <Host>
      {renderContent(ctx)}
      <ap-navi links={ctx.naviLinks} />
      <ap-head pageTitle={ctx.pageTitle} />
    </Host>
  );
};

const renderContent = (ctx: RenderContext) => {
  switch (ctx.announceStatus.state) {
    case 'rejected':
    case 'fulfilled-empty':
      redirectRoute(`/${ctx.announceID}`);
      return;
    case 'fulfilled': {
      const { announce, iconImgPromise } = ctx.announceStatus.value;

      return (
        <Fragment>
          <ap-announce
            announce={announce}
            iconImgPromise={iconImgPromise}
            icons={ctx.icons}
            showDetails={true}
          />
          <div class="follow">
            {ctx.icons.follow ? (
              <button onClick={ctx.handleUnfollowClick}>
                {ctx.msgs.announceConfig.unfollowBtn}
              </button>
            ) : (
              <button onClick={ctx.handleFollowClick}>{ctx.msgs.announceConfig.followBtn}</button>
            )}
          </div>
          <div class="notify">{renderNotification(ctx)}</div>
        </Fragment>
      );
    }
    default:
      return <ap-spinner />;
  }
};

const renderNotification = (
  ctx: RenderContext,
) => {
  switch (ctx.permission) {
    case 'unsupported':
      return (
        <div class="warn">
          <ap-icon icon="frown" />
          <div>{ctx.msgs.announceConfig.unsupported}</div>
        </div>
      );
    case 'denied':
      return (
        <div class="warn">
          <ap-icon icon="dizzy" />
          <div>{ctx.msgs.announceConfig.notPermitted}</div>
        </div>
      );
    default:
      return (
        <Fragment>
          {!ctx.icons.notification && (
            <button class="submit" onClick={ctx.handleEnableNotifyClick}>
              {ctx.msgs.announceConfig.enableNotifyBtn}
            </button>
          )}
          {ctx.icons.notification && (
            <button class="submit" onClick={ctx.handleDisableNotifyClick}>
              {ctx.msgs.announceConfig.disableNotifyBtn}
            </button>
          )}
        </Fragment>
      );
  }
};
