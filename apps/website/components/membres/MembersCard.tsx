import type { ReactNode } from "react";

/** A white rounded card on the members area's off-white page. */
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
      className={`bg-members-card border-members-line rounded-[20px] border ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
