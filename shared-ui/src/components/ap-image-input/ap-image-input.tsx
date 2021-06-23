import { Component, Event, EventEmitter, Fragment, h, Host, Prop } from '@stencil/core';
import pica from 'pica';

@Component({
  tag: 'ap-image-input',
  styleUrl: 'ap-image-input.scss',
})
export class ApImageInput {
  @Prop()
  resizeRect: { width: number; height: number } = { width: 200, height: 200 };

  @Prop()
  label?: string;

  @Prop()
  data?: string;

  @Prop()
  border?: boolean;

  @Event()
  imageResizing!: EventEmitter<boolean>;

  @Event()
  imageChange!: EventEmitter<string>;

  private handlers = {
    fileInput: null as HTMLInputElement | null,
    ref: (el: HTMLInputElement | undefined) => {
      if (el) this.handlers.fileInput = el;
    },
    click: () => {
      this.handlers.fileInput?.click();
    },
    change: async () => {
      this.imageResizing.emit(true);
      try {
        if (!this.handlers.fileInput?.files) {
          return;
        }
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
      this.imageChange.emit('');
    },
  };

  render() {
    const imageData = this.data;

    const renderContent = () => {
      if (!imageData) {
        return (
          <Fragment>
            <button class="select" onClick={this.handlers.click}>
              {this.label}
            </button>
          </Fragment>
        );
      } else {
        return (
          <Fragment>
            <div class="image">
              <img class={{ border: !!this.border }} src={imageData} />
              <button class="delete clear" onClick={this.handlers.delete}>
                <ap-icon icon="trash" />
              </button>
            </div>
          </Fragment>
        );
      }
    };

    return (
      <Host>
        {renderContent()}
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
      resolve(ev.target?.result as string);
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
    unsharpAmount: 160,
    unsharpRadius: 0.6,
    unsharpThreshold: 1,
    alpha: true,
  });

  // fill white on alpha channel
  const canvas2 = document.createElement('canvas');
  canvas2.width = canvasSize.width;
  canvas2.height = canvasSize.height;
  const ctx = canvas2.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas, 0, 0);
  }

  return canvas2.toDataURL('image/jpeg', 0.85);
};
