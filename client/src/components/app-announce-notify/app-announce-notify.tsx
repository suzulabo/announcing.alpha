import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';
import { Follow } from 'src/app/datatypes';
import { NotificationMode } from 'src/shared';
import { PromiseValue } from 'type-fest';

@Component({
  tag: 'app-announce-notify',
  styleUrl: 'app-announce-notify.scss',
})
export class AppAnnounceNotify {
  @Prop()
  app: App;

  @Prop()
  announceID: string;

  @State()
  values: { mode: NotificationMode; hours: number[] };

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

      this.values = { mode: this.follow.notify.mode, hours: this.follow.notify.hours || [] };

      this.permission = await this.app.checkNotifyPermission();
    } finally {
      this.app.loading = false;
    }
  }

  private hoursModal = {
    handlers: {
      show: () => {
        this.showHoursModal = true;
      },
      close: () => {
        this.showHoursModal = false;
      },
      hoursClick: (event: MouseEvent) => {
        const hour = parseInt((event.target as HTMLElement).getAttribute('data-hour'));
        let hours = this.values.hours;
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

    return (
      <Host>
        <label>
          <input type="checkbox" />
          {msgs.announceNorify.enable}
        </label>
        <div>
          <button class="slim" onClick={this.hoursModal.handlers.show}>
            {msgs.announceNorify.hoursBtn}
          </button>
        </div>
        <button>{msgs.announceNorify.submitBtn}</button>

        <a {...this.app.href(`/${this.announceID}`, true)}>{msgs.common.back}</a>

        {this.showHoursModal && (
          <ap-modal onClose={this.hoursModal.handlers.close}>
            <div class="hours-modal">
              <div class="hours-box">
                {[...Array(24)].map((_, i) => {
                  return (
                    <span
                      class={{ selected: values.hours.includes(i) }}
                      data-hour={i}
                      onClick={this.hoursModal.handlers.hoursClick}
                    >
                      {msgs.common.hour(i)}
                    </span>
                  );
                })}
              </div>
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
