import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ap-checkbox',
  styleUrl: 'ap-checkbox.scss',
})
export class ApCheckBox {
  @Prop({ mutable: true })
  checked = false;

  @Prop()
  label: string;

  private handleClick = () => {
    this.checked = !this.checked;
  };

  render() {
    return (
      <Host onClick={this.handleClick}>
        <ap-icon icon={this.checked ? 'squareChecked' : 'square'} />
        <span>{this.label}</span>
      </Host>
    );
  }
}
