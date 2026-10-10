// The member's photo is shrunk in the browser before it is sent to
// /api/profile/photo: a phone photo can weigh 5 to 10 MB (over Vercel's
// 4.5 MB request cap), and a profile photo never shows wider than a few
// hundred pixels. Whatever the browser can display (HEIC in Safari
// included) comes out as a JPEG the website accepts.

export const PHOTO_MAX_SIDE = 1024;

/** [width] × [height] scaled down to fit in [max] × [max], never up. */
export function fitWithin(
  width: number,
  height: number,
  max: number = PHOTO_MAX_SIDE,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    image.src = url;
  });
}

/** [file] as a JPEG of at most [PHOTO_MAX_SIDE] px; throws when unreadable. */
export async function resizeToJpeg(file: Blob, quality = 0.85): Promise<Blob> {
  const image = await loadImage(file);
  const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight);
  if (width === 0) throw new Error("empty image");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");
  // A transparent PNG gets a white background rather than black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("encoding failed");
  return blob;
}
