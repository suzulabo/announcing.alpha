import pica from 'pica';

const calcSize = (srcWidth: number, srcHeight: number, maxWidth: number, maxHeight: number) => {
  const scale = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1);
  return { width: srcWidth * scale, height: srcHeight * scale };
};

export const resizeImage = async (file: File, width: number, height: number) => {
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

  const canvas: HTMLCanvasElement = document.createElement('canvas');
  const canvasSize = calcSize(image.width, image.height, width, height);
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;

  const resizer = pica();
  await resizer.resize(image, canvas, {
    unsharpAmount: 80,
    unsharpRadius: 0.6,
    unsharpThreshold: 2,
  });

  return canvas.toDataURL('image/jpeg', 0.85);
};
