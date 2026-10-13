import type { ReactNode } from "react";

/** A white card with a soft grey line and big round corners (« Les Pupitres »). */
export function MembersCard({
  as: Tag = "div",
  className = "p-5 sm:p-7",
  children,
  ...props
}: {
  as?: "div" | "section" | "article" | "aside";
  className?: string;
  children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className">) {
  return (
    <Tag
      className={`bg-members-card border-members-line rounded-[28px] border-2 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
