import { Component, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';
import { Follow } from 'src/app/datatypes';

@Component({
  tag: 'app-announce-notify',
  styleUrl: 'app-announce-notify.scss',
})
export class AppAnnounceNotify {
  @Prop()
  app: App;

  @Prop()
  announceID: string;

  private permission: boolean;

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

      this.permission = await this.app.checkNotifyPermission();
    } finally {
      this.app.loading = false;
    }
  }

  render() {
    if (!this.follow) {
      return;
    }

    const msgs = this.app.msgs;

    return (
      <Host>
        {!this.permission && <span>通知が許可されていません</span>}
        <label>
          <input type="checkbox" />
          新しいお知らせを通知する
        </label>
        <a {...this.app.href(`/${this.announceID}`, true)}>{msgs.common.back}</a>
      </Host>
    );
  }
}
