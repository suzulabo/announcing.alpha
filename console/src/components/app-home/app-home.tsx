import { Component, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';
import { href } from 'stencil-router-v2';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
})
export class AppHome {
  @Prop()
  app: App;

  private handleSignOutClick = () => {
    return this.app.signOut();
  };

  private renderAnnounces() {
    const docs = this.app.getAnnounces();
    return docs.map(v => {
      return (
        <div class="announce-box">
          <span class="name">{v.name}</span>
          <span class="desc">{v.desc}</span>
          <div class="buttons">
            <a {...href(`/a/${v.id}/posts`)}>{this.app.msgs.home.announces.postBtn}</a>
            <a {...href(`/a/${v.id}/settings`)}>{this.app.msgs.home.announces.configBtn}</a>
          </div>
        </div>
      );
    });
  }

  render() {
    return (
      <Host>
        <div class="announces-grid">{this.renderAnnounces()}</div>
        <a {...href('/a/create')}>+</a>
        <button class="clear" onClick={this.handleSignOutClick}>
          {this.app.msgs.home.signOut}
        </button>
      </Host>
    );
  }
}
