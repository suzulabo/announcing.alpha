import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import { App } from 'src/app/app';
import { resizeImage } from 'src/utils/image';

@Component({
  tag: 'ap-image-input',
  styleUrl: 'ap-image-input.scss',
})
export class ApImageInput {
  @Prop()
  app: App;

  @Prop()
  resizeRect: { width: number; height: number };

  @Prop()
  label: string;

  @Prop()
  data: string;

  @Event()
  imageChange: EventEmitter<string>;

  private handlers = {
    fileInput: null as HTMLInputElement,
    ref: (el: HTMLInputElement) => {
      this.handlers.fileInput = el;
    },
    click: () => {
      this.handlers.fileInput.click();
    },
    change: async () => {
      this.app.loading = true;
      try {
        const newData = await resizeImage(
          this.handlers.fileInput.files[0],
          this.resizeRect.width,
          this.resizeRect.height,
        );
        this.imageChange.emit(newData);
      } finally {
        this.app.loading = false;
      }
      this.handlers.fileInput.value = '';
    },
    delete: () => {
      this.imageChange.emit(null);
    },
  };

  render() {
    const imageData = this.data;

    return (
      <Host>
        <div class={{ 'img-box': true, 'no-img': !imageData }} onClick={this.handlers.click}>
          {imageData && <img src={imageData} />}
          {!imageData && (
            <div class="stack">
              {this.label && <span class="label">{this.label}</span>}
              <ap-icon icon="image" />
            </div>
          )}
        </div>
        {imageData && (
          <button class="delete clear" onClick={this.handlers.delete}>
            <ap-icon icon="trash" />
          </button>
        )}
        <input
          type="file"
          accept="image/*"
          ref={this.handlers.ref}
          onChange={this.handlers.change}
        />
      </Host>
    );
  }
}
