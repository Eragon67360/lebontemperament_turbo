import type { ImageLoaderProps } from "next/image";

/**
 * Cloudinary delivery URLs for `next/image`, built the way next-cloudinary's
 * `CldImage` built them (`c_limit,w_<width>/f_auto/q_<quality>/v1/<id>`), but
 * without the library: its URL builder brings zod and @cloudinary/url-gen,
 * about 35 KB of brotli on every page of the site. The delivered image is the
 * same; only the `?_a=` SDK-analytics suffix is gone.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Formats @cloudinary-util/util strips from a URL's public id.
const FORMAT_EXTENSION =
  /\.(ai|avif|gif|png|webp|bmp|bw|djvu|dng|ps|ept|eps|eps3|fbx|flif|glb|gltf|heif|heic|ico|indd|jpg|jpe|jpeg|jp2|wdp|jxr|hdp|obj|pdf|ply|psd|arw|cr2|svg|tga|tif|tiff|u3ma|usdz|3g2|3gp|avi|flv|m3u8|ts|m2ts|mts|mov|mkv|mp4|mpeg|mpd|mxf|ogv|webm|wmv)$/i;

/**
 * The public id behind `src`: a public id is used as is (extension included,
 * like `CldImage` did); a full Cloudinary URL yields the path after its
 * version segment, without the format extension.
 */
export function cloudinaryPublicId(src: string): string {
  if (!/^https?:\/\//i.test(src)) return src;
  const path = src.split(/[?#]/)[0] ?? src;
  const afterVersion = path.match(/\/v\d+\/(.+)$/)?.[1];
  const afterUpload = path.match(/\/upload\/(.+)$/)?.[1];
  const id = afterVersion ?? afterUpload ?? path;
  return decodeURIComponent(id).replace(FORMAT_EXTENSION, "");
}

/** `next/image` loader: `quality` is the image's prop, `auto` when it has none. */
export function cloudinaryLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  const id = encodeURI(cloudinaryPublicId(src)).replace(/,/g, "%2C");
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_limit,w_${width}/f_auto/q_${quality ?? "auto"}/v1/${id}`;
}
