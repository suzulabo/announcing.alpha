import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ap-checkbox',
  styleUrl: 'ap-checkbox.scss',
})
export class ApCheckBox {
  @Prop()
  checked?: boolean;

  @Prop()
  label?: string;

  render() {
    return (
      <Host>
        <ap-icon icon={this.checked ? 'squareChecked' : 'square'} />
        <span>{this.label}</span>
      </Host>
    );
  }
}
