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
  values!: { enable: boolean };

  @State()
  showUnfollowConfirm = false;

  private permission?: PromiseValue<ReturnType<App['checkNotifyPermission']>>;

  private notification!: boolean;

  async componentWillLoad() {
    await this.app.processLoading(async () => {
      const id = this.announceID;
      this.app.loadAnnounce(id);

      const follow = await this.app.getFollow(id);
      if (!follow) {
        this.app.redirectRoute(`/${id}`);
        return;
      }

      this.notification = (await this.app.getNotification(id)) != null;

      this.values = { enable: this.notification };

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

  private handleEnableChange = () => {
    this.values = { ...this.values, enable: !this.values.enable };
  };

  private handleSubmitClick = async () => {
    await this.app.processLoading(async () => {
      await this.app.setNotify(this.announceID, this.values.enable);
      this.app.pushRoute(`/${this.announceID}`);
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
      return;
    }
    if (a.state != 'SUCCESS') {
      this.app.redirectRoute(`/${this.announceID}`);
      return;
    }
    this.app.setTitle(this.app.msgs.announceConfig.pageTitle(a.value.name));

    const msgs = this.app.msgs;
    const values = this.values;

    const modified = values.enable != this.notification;

    const canSubmit = modified;

    const renderNotify = () => {
      if (this.permission == 'unsupported') {
        return this.renderUnsupported();
      }
      if (this.permission != 'granted') {
        return this.renderDenied();
      }

      return (
        <Fragment>
          <label>
            <ap-checkbox
              label={msgs.announceConfig.enable}
              checked={values.enable}
              onClick={this.handleEnableChange}
            />
          </label>
          <button class="submit" disabled={!canSubmit} onClick={this.handleSubmitClick}>
            {msgs.announceConfig.submitBtn}
          </button>
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

        <a class="back" {...this.app.href(`/${this.announceID}`, true)}>
          {msgs.common.back}
        </a>

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
