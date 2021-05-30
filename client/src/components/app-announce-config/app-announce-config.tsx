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
  private enableNotification!: boolean;

  @State()
  showUnfollowConfirm = false;

  private permission?: PromiseValue<ReturnType<App['checkNotifyPermission']>>;

  async componentWillLoad() {
    await this.app.processLoading(async () => {
      const id = this.announceID;
      this.app.loadAnnounce(id);

      const follow = await this.app.getFollow(id);
      if (!follow) {
        this.app.redirectRoute(`/${id}`);
        return;
      }

      this.enableNotification = (await this.app.getNotification(id)) != null;

      this.permission = await this.app.checkNotifyPermission(true);
    });
  }

  private unfollow = {
    handlers: {
      confirm: () => {
        this.showUnfollowConfirm = true;
      },
      close: () => {
        this.showUnfollowConfirm = false;
      },
      unfollow: async () => {
        this.showUnfollowConfirm = false;
        await this.app.processLoading(async () => {
          await this.app.deleteFollow(this.announceID);
          this.app.pushRoute(`/${this.announceID}`);
        });
      },
    },
  };

  private handleEnableNotifyClick = async () => {
    await this.app.processLoading(async () => {
      await this.app.setNotify(this.announceID, true);
      this.enableNotification = true;
    });
  };

  private handleDisableNotifyClick = async () => {
    await this.app.processLoading(async () => {
      await this.app.setNotify(this.announceID, false);
      this.enableNotification = false;
    });
  };

  private renderUnsupported() {
    // TODO
    return (
      <div class="notif-warn">
        <ap-icon icon="frown" />
        <div>{this.app.msgs.announceConfig.unsupported}</div>
      </div>
    );
  }

  private renderDenied() {
    // TODO
    return (
      <div class="notif-warn">
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
        {renderNotify()}
        <hr />
        <button class="anchor unfollow" onClick={this.unfollow.handlers.confirm}>
          {msgs.announceConfig.unfollowBtn}
        </button>

        <ion-router-link class="back" href={`/${this.announceID}`} routerDirection="back">
          {msgs.common.back}
        </ion-router-link>

        {this.showUnfollowConfirm && (
          <ap-modal onClose={this.unfollow.handlers.close}>
            <div class="unfollow-modal">
              <div>{msgs.announceConfig.unfollowConfirm}</div>
              <div class="buttons">
                <button onClick={this.unfollow.handlers.close}>{msgs.common.cancel}</button>
                <button onClick={this.unfollow.handlers.unfollow}>{msgs.common.ok}</button>
              </div>
            </div>
          </ap-modal>
        )}
      </Host>
    );
  }
}
