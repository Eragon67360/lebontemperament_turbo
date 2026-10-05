import { CAPS } from "./theme";

/** A centred small-caps label between two hairlines: « Au programme ». */
export default function Ornament({
  children,
  as: Tag = "p",
  className = "",
}: {
  children: string;
  as?: "p" | "h2";
  className?: string;
}) {
  return (
    <Tag
      className={`${CAPS} flex items-center justify-center gap-3.5 text-center before:h-px before:w-10 before:bg-current before:opacity-60 after:h-px after:w-10 after:bg-current after:opacity-60 sm:before:w-16 sm:after:w-16 ${className}`}
    >
      {children}
    </Tag>
  );
}
