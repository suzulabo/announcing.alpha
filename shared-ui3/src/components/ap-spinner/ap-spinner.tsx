import { Component, h, Host, State } from '@stencil/core';

@Component({
  tag: 'ap-spinner',
  styleUrl: 'ap-spinner.scss',
})
export class ApSpinner {
  @State()
  visible = false;

  componentDidLoad() {
    setTimeout(() => {
      this.visible = true;
    }, 1000);
  }

  // https://codepen.io/adrianmg/pen/Omedpo
  render() {
    return (
      <Host class={{ show: this.visible }}>
        <div></div>
        <div></div>
        <div></div>
      </Host>
    );
  }
}
