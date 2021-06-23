import { Component, h, Host, Prop, readTask } from '@stencil/core';

@Component({
  tag: 'ap-input',
  styleUrl: 'ap-input.scss',
})
export class ApInput {
  @Prop()
  label?: string;

  @Prop()
  value?: string;

  @Prop()
  maxLength?: number;

  @Prop()
  textarea?: boolean;

  componentDidLoad() {
    this.autoGrow.run();
  }

  private autoGrow = (() => {
    let el: HTMLTextAreaElement;
    const handleRef = (_el: HTMLTextAreaElement | undefined) => {
      if (_el) el = _el;
    };
    const handleInput = () => {
      this.autoGrow.run();
    };
    const run = () => {
      if (!el) {
        return;
      }
      readTask(() => {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
      });
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
              ({this.value?.length || 0}/{this.maxLength})
            </span>
          </div>
          {!this.textarea && <input value={this.value} maxLength={this.maxLength} />}
          {this.textarea && (
            <textarea
              value={this.value}
              maxLength={this.maxLength}
              ref={this.autoGrow.handleRef}
              onInput={this.autoGrow.handleInput}
            ></textarea>
          )}
        </label>
      </Host>
    );
  }
}
