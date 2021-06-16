import { Component, Fragment, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { AnnounceAndMeta } from 'src/shared';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
import { FirestoreUpdatedEvent } from 'src/shared-ui/utils/firestore';
import { PromiseState } from 'src/shared-ui/utils/promise';
import { redirectRoute } from 'src/shared-ui/utils/route';
import { PromiseValue } from 'type-fest';

@Component({
  tag: 'app-announce-config',
  styleUrl: 'app-announce-config.scss',
})
export class AppAnnounceConfig {
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

  private naviLinks!: ApNaviLinks;
  private permission?: PromiseValue<ReturnType<App['checkNotifyPermission']>>;

  private async loadAnnounce(id: string) {
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
    this.permission = await this.app.checkNotifyPermission(false);

    if (!this.announceState) {
      this.announceState = new PromiseState(this.loadAnnounce(this.announceID));
    }
  }

  private renderNotification() {
    const msgs = this.app.msgs;
    const enableNotification = this.app.getNotification(this.announceID) != null;

    switch (this.permission) {
      case 'unsupported':
        return (
          <div class="warn">
            <ap-icon icon="frown" />
            <div>{msgs.announceConfig.unsupported}</div>
          </div>
        );
      case 'denied':
        return (
          <div class="warn">
            <ap-icon icon="dizzy" />
            <div>{msgs.announceConfig.notPermitted}</div>
          </div>
        );
      default:
        return (
          <Fragment>
            {!enableNotification && (
              <button class="submit" onClick={this.handleEnableNotifyClick}>
                {msgs.announceConfig.enableNotifyBtn}
              </button>
            )}
            {enableNotification && (
              <button class="submit" onClick={this.handleDisableNotifyClick}>
                {msgs.announceConfig.disableNotifyBtn}
              </button>
            )}
          </Fragment>
        );
    }
  }

  private renderContent() {
    const announceState = this.announceState;
    if (!announceState) return;

    const msgs = this.app.msgs;
    const enableNotification = this.app.getNotification(this.announceID) != null;
    const isFollow = this.app.getFollow(this.announceID) != null;

    const status = announceState.status();

    switch (status.state) {
      case 'rejected':
      case 'fulfilled-empty':
        redirectRoute(`/${this.announceID}`);
        return;
      case 'fulfilled': {
        const { announce, iconImgPromise } = status.value;

        this.app.setTitle(this.app.msgs.announceConfig.pageTitle(announce.name));

        return (
          <Fragment>
            <ap-announce
              announce={announce}
              iconImgPromise={iconImgPromise}
              icons={{ isFollow, enableNotification }}
              showDetails={true}
            />
            <div class="follow">
              {isFollow ? (
                <button onClick={this.handleUnfollowClick}>
                  {msgs.announceConfig.unfollowBtn}
                </button>
              ) : (
                <button onClick={this.handleFollowClick}>{msgs.announceConfig.followBtn}</button>
              )}
            </div>
            <div class="notify">{this.renderNotification()}</div>
          </Fragment>
        );
      }
      default:
        return <ap-spinner />;
    }
  }

  render() {
    return (
      <Host>
        {this.renderContent()}
        <ap-navi links={this.naviLinks} />
      </Host>
    );
  }
}
