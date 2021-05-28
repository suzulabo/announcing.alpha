import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'ap-root',
  styleUrl: 'ap-root.scss',
})
export class ApRoot {
  componentWillLoad() {
    //
  }

  render() {
    return <Host>hello</Host>;
  }
}
