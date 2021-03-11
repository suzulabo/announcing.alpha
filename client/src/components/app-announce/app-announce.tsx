import { Component, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';

@Component({
  tag: 'app-announce',
  styleUrl: 'app-announce.scss',
})
export class AppAnnounce {
  @Prop()
  app: App;

  @Prop()
  announceID: string;

  async componentWillLoad() {
    this.app.loading = true;
    try {
      const announce = await this.app.getAnnounce(this.announceID);
      console.log(announce);
      const meta = await this.app.fetchAnnounceMeta(this.announceID, announce.mid);
      console.log(meta);
    } finally {
      this.app.loading = false;
    }
  }

  render() {
    return <Host>{this.announceID}</Host>;
  }
}
