import { alertController } from '@ionic/core';
import { Component, Fragment, h, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { ApButton } from 'src/shared-ui/functionals/button';
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

  private handleUnfollowClick = async () => {
    const unfollow = async () => {
      await this.app.processLoading(async () => {
        await this.app.deleteFollow(this.announceID);
        this.app.pushRoute(`/${this.announceID}`, true);
      });
    };

    const msgs = this.app.msgs;

    const alert = await alertController.create({
      message: msgs.announceConfig.unfollowConfirm,
      buttons: [
        {
          text: msgs.common.cancel,
          role: 'cancel',
        },
        {
          text: msgs.common.ok,
          handler: unfollow,
        },
      ],
    });
    await alert.present();
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
            <ApButton class="submit" onClick={this.handleEnableNotifyClick}>
              {msgs.announceConfig.enableNotifyBtn}
            </ApButton>
          )}
          {this.enableNotification && (
            <ApButton class="submit" onClick={this.handleDisableNotifyClick}>
              {msgs.announceConfig.disableNotifyBtn}
            </ApButton>
          )}
        </Fragment>
      );
    };

    return (
      <ion-content>
        <div class="ap-content">
          {renderNotify()}
          <hr />
          <ApButton onClick={this.handleUnfollowClick}>{msgs.announceConfig.unfollowBtn}</ApButton>

          <ion-router-link class="back" href={`/${this.announceID}`} routerDirection="back">
            {msgs.common.back}
          </ion-router-link>
        </div>
      </ion-content>
    );
  }
}
