import { Component, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
})
export class AppHome {
  @Prop()
  app: App;

  async componentWillLoad() {
    await this.app.processLoading(async () => {
      await this.app.loadUser();
    });
  }

  private handleSignOutClick = async () => {
    await this.app.signOut();
    this.app.redirectRoute('/signin');
  };

  private renderAnnounces() {
    const docs = this.app.getAnnounces();
    return docs?.map(v => {
      return (
        <a class="announce-box" {...this.app.href(`/${v.id}`)}>
          <div class="head">
            <span class="name">{v.name}</span>
            {v.iconData && <img src={v.iconData} />}
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
        <a class="create button" {...this.app.href('/create')}>
          {this.app.msgs.home.createAnnounceBtn}
        </a>
        <button class="logout anchor" onClick={this.handleSignOutClick}>
          {this.app.msgs.home.signOut}
        </button>
      </Host>
    );
  }
}
