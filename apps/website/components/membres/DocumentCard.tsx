import type { ElementType, ReactNode } from "react";
import { MembersCard } from "./MembersCard";

/** A white card with a teal icon tile, a heading, a sentence and its content. */
export function DocumentCard({
  id,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: ElementType;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <MembersCard
      as="section"
      aria-labelledby={id}
      className="flex flex-col gap-5 p-5 sm:p-7"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="bg-primary/10 text-primary-text flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={id} className="text-[22px] leading-snug font-semibold">
            {title}
          </h2>
          {description && <p className="text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </MembersCard>
  );
}
