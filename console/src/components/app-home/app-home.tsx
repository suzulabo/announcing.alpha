import { Component, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
})
export class AppHome {
  @Prop()
  app: App;

  render() {
    return <Host>HOME</Host>;
  }
}
