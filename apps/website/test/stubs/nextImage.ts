import { createElement } from "react";

/**
 * `next/image` as a plain `<img>`: plain Node imports the real module as an
 * object, not a component. The attributes that decide the accessible name
 * and its visibility (`alt`, `aria-hidden`) go through.
 */
export default function Image(props: {
  src: string;
  alt: string;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}) {
  return createElement("img", {
    src: props.src,
    alt: props.alt,
    className: props.className,
    "aria-hidden": props["aria-hidden"],
  });
}
