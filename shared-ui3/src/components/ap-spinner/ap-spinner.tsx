import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'ap-spinner',
  styleUrl: 'ap-spinner.scss',
})
export class ApSpinner {
  // https://codepen.io/adrianmg/pen/Omedpo
  render() {
    return (
      <Host>
        <div></div>
        <div></div>
        <div></div>
      </Host>
    );
  }
}
