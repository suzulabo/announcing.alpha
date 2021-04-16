import { Component, h, Host, Prop, State } from '@stencil/core';
import { App } from 'src/app/app';

@Component({
  tag: 'app-signin',
  styleUrl: 'app-signin.scss',
})
export class AppSignIn {
  @Prop()
  app: App;

  @State()
  keepSignedIn = false;

  private handleGoogleClick = () => {
    return this.app.signInGoogle(this.keepSignedIn);
  };

  private handleKeepSignedIn = () => {
    this.keepSignedIn = !this.keepSignedIn;
  };

  render() {
    const msgs = this.app.msgs;

    return (
      <Host>
        <button onClick={this.handleGoogleClick}>
          <ap-icon icon="google"></ap-icon>
          {msgs.signIn.googleBtn}
        </button>
        <ap-checkbox
          label={msgs.signIn.keepSignedIn}
          checked={this.keepSignedIn}
          onClick={this.handleKeepSignedIn}
        />
      </Host>
    );
  }
}
