import { Component, Fragment, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { Follow } from 'src/app/datatypes';
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
  values!: { enable: boolean; hours: number[] };

  @State()
  showUnfollowConfirm = false;

  @State()
  showHoursModal = false;

  private permission?: PromiseValue<ReturnType<App['checkNotifyPermission']>>;

  private follow!: Follow;
  private notification?: { hours?: number[] };

  async componentWillLoad() {
    await this.app.processLoading(async () => {
      const id = this.announceID;
      this.app.loadAnnounce(id);

      const follow = await this.app.getFollow(id);
      if (!follow) {
        this.app.redirectRoute(`/${id}`);
        return;
      }
      this.follow = follow;

      this.notification = await this.app.getNotification(id);

      this.values = { enable: !!this.notification, hours: this.notification?.hours || [] };

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

  private hoursModal = {
    handlers: {
      show: () => {
        this.showHoursModal = true;
      },
      close: () => {
        this.showHoursModal = false;
      },
      hourClick: (event: CustomEvent<number>) => {
        const hour = event.detail;
        let hours = [...this.values.hours];
        if (hours.includes(hour)) {
          hours = hours.filter(v => {
            return v != hour;
          });
        } else {
          hours.push(hour);
        }
        hours.sort((a, b) => {
          return a - b;
        });
        this.values = { ...this.values, hours };
      },
      hoursClick: (event: MouseEvent) => {
        const hour = parseInt((event.target as HTMLElement).getAttribute('data-hour') || '');
        let hours = [...this.values.hours];
        if (hours.includes(hour)) {
          hours = hours.filter(v => {
            return v != hour;
          });
        } else {
          hours.push(hour);
        }
        hours.sort();
        this.values = { ...this.values, hours };
      },
    },
  };

  private handleSubmitClick = async () => {
    await this.app.processLoading(async () => {
      const hours = this.values.enable ? this.values.hours : [];
      await this.app.setNotify(this.announceID, this.values.enable, hours);
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

  componentWillRender() {
    const a = this.app.getAnnounceState(this.announceID);
    if (!a) {
      return;
    }
    if (a.state != 'SUCCESS') {
      this.app.redirectRoute('/');
      return;
    }
    this.app.setTitle(this.app.msgs.announceConfig.pageTitle(a.value.name));
  }

  render() {
    if (!this.follow) {
      return;
    }

    const msgs = this.app.msgs;
    const values = this.values;
    const notify = this.notification;

    const modified =
      values.enable != !!notify ||
      (values.enable && values.hours.join(':') != notify?.hours?.join(':'));

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
          {values.hours.length > 0 && (
            <span class={{ disabled: !values.enable }}>
              {msgs.announceConfig.hours(values.hours)}
            </span>
          )}
          <button
            disabled={!values.enable}
            class="slim hours"
            onClick={this.hoursModal.handlers.show}
          >
            {msgs.announceConfig.hoursBtn}
          </button>
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

        {this.showHoursModal && (
          <ap-modal onClose={this.hoursModal.handlers.close}>
            <div class="hours-modal">
              <ap-clock-select
                msgs={{ am: msgs.common.am, pm: msgs.common.pm }}
                selected={values.hours}
                onHourClick={this.hoursModal.handlers.hourClick}
              />
              <button class="anchor close" onClick={this.hoursModal.handlers.close}>
                {msgs.common.close}
              </button>
            </div>
          </ap-modal>
        )}
      </Host>
    );
  }
}
