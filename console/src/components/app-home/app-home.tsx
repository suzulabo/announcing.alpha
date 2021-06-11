import { Component, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';
import { href, redirectRoute } from 'src/shared-ui/utils/route';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
})
export class AppHome {
  @Prop()
  app!: App;

  private handleSignOutClick = async () => {
    await this.app.signOut();
    redirectRoute('/signin');
  };

  private renderAnnounces() {
    const docs = this.app.getAnnounces();
    return docs?.map(v => {
      return (
        <a class="announce-box" {...href(`/${v.id}`)}>
          <div class="head">
            <span class="name">{v.name}</span>
            {v.iconLoader && <ap-image loader={v.iconLoader} />}
          </div>
          <span class="desc">{v.desc}</span>
        </a>
      );
    });
  }

  render() {
    return (
      <Host>
        <div class="announces-grid">{this.renderAnnounces()}</div>
        <a class="create button" {...href('/create')}>
          {this.app.msgs.home.createAnnounceBtn}
        </a>
        <button class="logout anchor" onClick={this.handleSignOutClick}>
          {this.app.msgs.home.signOut}
        </button>
      </Host>
    );
  }
}
