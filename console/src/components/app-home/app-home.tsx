import { Component, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
})
export class AppHome {
  @Prop()
  app: App;

  private handleSignOutClick = () => {
    void this.app.auth.signOut();
  };

  render() {
    return (
      <Host>
        HOME
        <button class="clear" onClick={this.handleSignOutClick}>
          {this.app.msgs.home.signOut}
        </button>
      </Host>
    );
  }
}
