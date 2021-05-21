import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import pica from 'pica';

@Component({
  tag: 'ap-image-input',
  styleUrl: 'ap-image-input.scss',
})
export class ApImageInput {
  @Prop()
  resizeRect: { width: number; height: number };

  @Prop()
  label: string;

  @Prop()
  data: string;

  @Event()
  imageResizing: EventEmitter<boolean>;

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
      this.imageResizing.emit(true);
      try {
        const newData = await resizeImage(
          this.handlers.fileInput.files[0],
          this.resizeRect.width,
          this.resizeRect.height,
        );
        this.imageChange.emit(newData);
      } finally {
        this.imageResizing.emit(false);
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

const calcSize = (srcWidth: number, srcHeight: number, maxWidth: number, maxHeight: number) => {
  const scale = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1);
  return { width: srcWidth * scale, height: srcHeight * scale };
};

const resizeImage = async (file: File, width: number, height: number) => {
  const dataURL = await new Promise<string>(resolve => {
    const reader = new FileReader();
    reader.onload = ev => {
      resolve(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>(resolve => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.src = dataURL;
  });

  const canvas = document.createElement('canvas');
  const canvasSize = calcSize(image.width, image.height, width, height);
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;

  const resizer = pica();
  await resizer.resize(image, canvas, {
    unsharpAmount: 80,
    unsharpRadius: 0.6,
    unsharpThreshold: 2,
    alpha: true,
  });

  // fill white on alpha channel
  const canvas2 = document.createElement('canvas');
  canvas2.width = canvasSize.width;
  canvas2.height = canvasSize.height;
  const ctx = canvas2.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(canvas, 0, 0);

  return canvas2.toDataURL('image/jpeg', 0.85);
};
