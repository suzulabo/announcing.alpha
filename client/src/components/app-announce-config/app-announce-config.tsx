import { Component, Fragment, h, Host, Prop, Watch } from '@stencil/core';
import { App } from 'src/app/app';
import { ApNaviLinks } from 'src/shared-ui/ap-navi/ap-navi';
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
    this.loadData();
  }

  componentWillLoad() {
    this.loadData();
  }

  private naviLinks!: ApNaviLinks;

  private loadData() {
    this.app.loadAnnounce(this.announceID);

    this.naviLinks = [
      {
        label: this.app.msgs.common.back,
        href: `/${this.announceID}`,
        back: true,
      },
    ];
  }

  private permission?: PromiseValue<ReturnType<App['checkNotifyPermission']>>;
  async componentWillRender() {
    this.permission = await this.app.checkNotifyPermission(false);
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
      const a = this.app.getAnnounceState(this.announceID);
      if (a?.state == 'SUCCESS') {
        const name = a.value.name;
        const readTime = a.value.latestPost?.pT || 0;
        await this.app.setFollow(this.announceID, { name, readTime });
      } else {
        console.warn('getAnnounceState error', a);
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
    const renderContent = () => {
      const a = this.app.getAnnounceState(this.announceID);
      if (!a) {
        return <ap-spinner />;
      }
      if (a.state != 'SUCCESS') {
        this.app.redirectRoute(`/${this.announceID}`);
        return;
      }
      this.app.setTitle(this.app.msgs.announceConfig.pageTitle(a.value.name));

      const msgs = this.app.msgs;
      const announce = a.value;
      const enableNotification = this.app.getNotification(this.announceID) != null;
      const isFollow = this.app.getFollow(this.announceID) != null;

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
            announce={{ ...announce, isFollow, enableNotification, showDetails: true }}
          />
          <div class="follow">
            {isFollow ? (
              <button onClick={this.handleUnfollowClick}>{msgs.announceConfig.unfollowBtn}</button>
            ) : (
              <button onClick={this.handleFollowClick}>{msgs.announceConfig.followBtn}</button>
            )}
          </div>
          <div class="notify">{renderNotify()}</div>
        </Fragment>
      );
    };

    return (
      <Host>
        <ap-navi links={this.naviLinks} />
        {renderContent()}
      </Host>
    );
  }
}
