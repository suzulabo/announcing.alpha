import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ap-input',
  styleUrl: 'ap-input.scss',
})
export class ApInput {
  @Prop()
  label: string;

  @Prop()
  value: string;

  @Prop()
  maxLength: number;

  @Prop()
  textarea: boolean;

  render() {
    return (
      <Host>
        <label>
          <div class="label-box">
            <span class="label">{this.label}</span>
            <span class="count">
              ({this.value.length}/{this.maxLength})
            </span>
          </div>
          {!this.textarea && <input value={this.value} maxLength={this.maxLength} />}
          {this.textarea && <textarea maxLength={this.maxLength}>{this.value}</textarea>}
        </label>
      </Host>
    );
  }
}
