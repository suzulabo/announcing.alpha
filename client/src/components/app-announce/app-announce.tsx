import { Component, h, Host, Prop, State } from '@stencil/core';
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

  @State()
  values: { name: string; desc: string; link: string; icon: string; posts: string[] };

  async componentWillLoad() {
    this.app.loading = true;
    try {
      const announce = await this.app.getAnnounce(this.announceID);
      const meta = await this.app.fetchAnnounceMeta(this.announceID, announce.mid);
      this.values = {
        name: meta.name,
        desc: meta.desc,
        link: meta.link,
        icon: meta.icon,
        posts: announce.posts || [],
      };
    } finally {
      this.app.loading = false;
    }
  }

  render() {
    if (!this.values) {
      return;
    }
    return (
      <Host>
        {this.values.icon && <img src={this.app.getImageURI(this.values.icon)} />}
        <div class="name">{this.values.name}</div>
        {this.values.desc && <div class="desc">{this.values.desc}</div>}
        {this.values.link && (
          <a href={this.values.link} rel="noopener">
            {this.values.link}
          </a>
        )}
        <hr />
        {this.values.posts.length == 0 && <div>{this.app.msgs.announce.noPosts}</div>}
      </Host>
    );
  }
}
