import { Component, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';

@Component({
  tag: 'app-signin',
  styleUrl: 'app-signin.scss',
})
export class AppSignIn {
  @Prop()
  app: App;

  private handleGoogleClick = () => {
    void this.app.auth.signIn.google();
  };

  render() {
    return (
      <Host>
        <button onClick={this.handleGoogleClick}>
          <ap-icon icon="google"></ap-icon>
          {this.app.msgs.signIn.social.google}
        </button>
      </Host>
    );
  }
}
