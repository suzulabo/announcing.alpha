import { Component, Fragment, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { Announce, AnnounceMetaBase } from 'src/shared';
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
  announceState?: PromiseState<
    Announce &
      AnnounceMetaBase & {
        announceIcon?: PromiseState<string>;
      }
  >;

  private naviLinks!: ApNaviLinks;
  private permission?: PromiseValue<ReturnType<App['checkNotifyPermission']>>;

  private async loadAnnounce(id: string) {
    const a = await this.app.getAnnounceAndMeta(id);
    if (a) {
      return {
        ...a,
        announceIcon: a.icon ? new PromiseState(this.app.fetchImage(a.icon)) : undefined,
      };
    }
    return;
  }

  componentWillLoad() {
    this.watchAnnounceID();
  }

  async componentWillRender() {
    this.permission = await this.app.checkNotifyPermission(false);
    if (!this.announceState) {
      this.announceState = new PromiseState(this.loadAnnounce(this.announceID));
    }
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
        const name = a.name;
        const latestPost = await this.app.getLatestPost(this.announceID, a);
        const readTime = latestPost?.pT || 0;
        await this.app.setFollow(this.announceID, { name, readTime });
      } else {
        // never
      }
    });
  };

  private renderUnsupported() {
    // TODO
    return (
      <div class="warn">
        <ap-icon icon="frown" />
        <div>{this.app.msgs.announceConfig.unsupported}</div>
      </div>
    );
  }

  private renderDenied() {
    // TODO
    return (
      <div class="warn">
        <ap-icon icon="dizzy" />
        <div>{this.app.msgs.announceConfig.notPermitted}</div>
      </div>
    );
  }

  render() {
    const announceState = this.announceState;
    if (!announceState) {
      return;
    }
    const state = announceState.state();
    const msgs = this.app.msgs;
    const enableNotification = this.app.getNotification(this.announceID) != null;
    const isFollow = this.app.getFollow(this.announceID) != null;

    const renderContent = () => {
      switch (state) {
        case 'rejected':
          redirectRoute(`/${this.announceID}`);
          return;
        case 'fulfilled': {
          const announce = announceState.result();
          if (!announce) {
            redirectRoute(`/${this.announceID}`);
            return;
          }

          this.app.setTitle(this.app.msgs.announceConfig.pageTitle(announce.name));

          const renderNotify = () => {
            if (this.permission == 'unsupported') {
              return this.renderUnsupported();
            }
            if (this.permission != 'granted') {
              return this.renderDenied();
            }

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
          };

          return (
            <Fragment>
              <ap-announce
                announce={announce}
                announceIcon={announce.announceIcon}
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
              <div class="notify">{renderNotify()}</div>
            </Fragment>
          );
        }
        default:
          return <ap-spinner />;
      }
    };

    return (
      <Host>
        {renderContent()}
        <ap-navi links={this.naviLinks} />
      </Host>
    );
  }
}
