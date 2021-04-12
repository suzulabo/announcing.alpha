import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { Follow } from 'src/app/datatypes';
import { PromiseValue } from 'type-fest';

@Component({
  tag: 'app-announce-config',
  styleUrl: 'app-announce-config.scss',
})
export class AppAnnounceConfig {
  @Prop()
  app: App;

  @Prop()
  announceID: string;

  @State()
  values: { enable: boolean; hours: number[] };

  @State()
  showUnfollowConfirm = false;

  @State()
  showHoursModal = false;

  private permission: PromiseValue<ReturnType<App['checkNotifyPermission']>>;

  private follow: Follow;

  async componentWillLoad() {
    this.app.loading = true;
    try {
      const id = this.announceID;
      await this.app.loadAnnounce(id);
      if (!this.app.getAnnounceState(id)) {
        this.app.redirectRoute('/');
        return;
      }
      this.follow = await this.app.getFollow(id);
      if (!this.follow) {
        this.app.redirectRoute(`/${id}`);
        return;
      }
      console.log(this.follow);

      this.values = { enable: this.follow.notify.enable, hours: this.follow.notify.hours || [] };

      this.permission = await this.app.checkNotifyPermission();
    } finally {
      this.app.loading = false;
    }
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
        this.app.loading = true;
        try {
          await this.app.deleteFollow(this.announceID);
          this.follow = undefined;
        } finally {
          this.app.loading = false;
        }
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
        const hour = parseInt((event.target as HTMLElement).getAttribute('data-hour'));
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
    this.app.loading = true;
    try {
      const hours = this.values.enable ? this.values.hours : [];
      await this.app.registerMessaging(this.announceID, this.values.enable, hours);
      this.app.pushRoute(`/${this.announceID}`);
    } finally {
      this.app.loading = false;
    }
  };

  private renderUnsupported() {
    const msgs = this.app.msgs;

    // TODO
    return (
      <Host>
        <span>Unsupported Brwoser</span>
        <a {...this.app.href(`/${this.announceID}`, true)}>{msgs.common.back}</a>
      </Host>
    );
  }

  private renderDenied() {
    const msgs = this.app.msgs;

    // TODO
    return (
      <Host>
        <span>Not permitted</span>
        <a {...this.app.href(`/${this.announceID}`, true)}>{msgs.common.back}</a>
      </Host>
    );
  }

  render() {
    if (!this.follow) {
      return;
    }

    if (this.permission == 'unsupported') {
      return this.renderUnsupported();
    }
    if (this.permission == 'deny') {
      return this.renderDenied();
    }

    const msgs = this.app.msgs;
    const values = this.values;
    const notify = this.follow.notify;

    const modified =
      values.enable != notify.enable ||
      (values.enable && values.hours.join(':') != notify.hours?.join(':'));

    const canSubmit = modified;

    return (
      <Host>
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