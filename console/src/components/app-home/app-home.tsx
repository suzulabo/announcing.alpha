import { Component, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
})
export class AppHome {
  @Prop()
  app: App;

  private handleSignOutClick = async () => {
    await this.app.signOut();
    this.app.redirectRoute('/signin');
  };

  private renderAnnounces() {
    const docs = this.app.getAnnounces();
    return docs.map(v => {
      return (
        <div class="announce-box">
          <span class="name">{v.name}</span>
          <span class="desc">{v.desc}</span>
          <div class="buttons">
            <a {...this.app.href(`/${v.id}`)}>{this.app.msgs.home.announces.postBtn}</a>
            <a {...this.app.href(`/${v.id}/edit_`)}>{this.app.msgs.home.announces.editBtn}</a>
          </div>
        </div>
      );
    });
  }

  render() {
    return (
      <Host>
        <div class="announces-grid">{this.renderAnnounces()}</div>
        <a class="button" {...this.app.href('/create')}>
          {this.app.msgs.home.createAnnounceBtn}
        </a>
        <button class="logout anchor" onClick={this.handleSignOutClick}>
          {this.app.msgs.home.signOut}
        </button>
      </Host>
    );
  }
}
