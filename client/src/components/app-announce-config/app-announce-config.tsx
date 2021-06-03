import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
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

  @State()
  enableNotification!: boolean;

  @State()
  isFollow!: boolean;

  @State()
  permission?: PromiseValue<ReturnType<App['checkNotifyPermission']>>;

  private async loadData() {
    this.app.loadAnnounce(this.announceID);
    this.enableNotification = (await this.app.getNotification(this.announceID)) != null;
    this.isFollow = this.app.getFollow(this.announceID) != null;
    this.permission = await this.app.checkNotifyPermission(false);
  }

  async componentWillLoad() {
    await this.loadData();
  }

  private handleEnableNotifyClick = async () => {
    await this.app.processLoading(async () => {
      await this.app.setNotify(this.announceID, true);
      await this.loadData();
    });
  };

  private handleDisableNotifyClick = async () => {
    await this.app.processLoading(async () => {
      await this.app.setNotify(this.announceID, false);
      await this.loadData();
    });
  };

  private handleUnfollowClick = async () => {
    await this.app.processLoading(async () => {
      await this.app.deleteFollow(this.announceID);
      await this.loadData();
    });
  };

  private handleFollowClick = async () => {
    await this.app.processLoading(async () => {
      const a = this.app.getAnnounceState(this.announceID);
      if (a?.state == 'SUCCESS') {
        const name = a.value.name;
        const readTime = a.value.latestPost?.pT || 0;
        await this.app.setFollow(this.announceID, { name, readTime });
        await this.loadData();
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

    const renderNotify = () => {
      if (this.permission == 'unsupported') {
        return this.renderUnsupported();
      }
      if (this.permission != 'granted') {
        return this.renderDenied();
      }

      return (
        <Fragment>
          {!this.enableNotification && (
            <button class="submit" onClick={this.handleEnableNotifyClick}>
              {msgs.announceConfig.enableNotifyBtn}
            </button>
          )}
          {this.enableNotification && (
            <button class="submit" onClick={this.handleDisableNotifyClick}>
              {msgs.announceConfig.disableNotifyBtn}
            </button>
          )}
        </Fragment>
      );
    };

    return (
      <Host>
        <div class="announce">
          <div class="head">
            <div class="name">
              <div class="icons">
                {this.isFollow && <ap-icon icon="heart" />}
                {this.enableNotification && <ap-icon icon="bell" />}
              </div>
              <span>{announce.name}</span>
            </div>
            {announce.iconLoader && <ap-image loader={announce.iconLoader} />}
          </div>
          {announce.desc && <div class="desc">{announce.desc}</div>}
          {announce.link && <div class="link">{announce.link}</div>}
        </div>
        <div class="follow">
          {this.isFollow ? (
            <button onClick={this.handleUnfollowClick}>{msgs.announceConfig.unfollowBtn}</button>
          ) : (
            <button onClick={this.handleFollowClick}>{msgs.announceConfig.followBtn}</button>
          )}
        </div>
        <div class="notify">{renderNotify()}</div>
        <a class="back" {...this.app.href(`/${this.announceID}`, true)}>
          {msgs.common.back}
        </a>
      </Host>
    );
  }
}
