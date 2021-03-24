import { Component, h, Host, Prop, readTask } from '@stencil/core';

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

  private autoGrow = (() => {
    let el: HTMLTextAreaElement;
    const handleRef = (_el: HTMLTextAreaElement) => {
      el = _el;
      this.autoGrow.run();
    };
    const handleInput = () => {
      readTask(() => {
        this.autoGrow.run();
      });
    };
    const run = () => {
      if (!el) {
        return;
      }
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    };

    return { handleRef, handleInput, run };
  })();

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
          {this.textarea && (
            <textarea
              maxLength={this.maxLength}
              ref={this.autoGrow.handleRef}
              onInput={this.autoGrow.handleInput}
            >
              {this.value}
            </textarea>
          )}
        </label>
      </Host>
    );
  }
}
