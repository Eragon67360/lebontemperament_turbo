import NextLink from "next/link";
import { Fragment, type ReactNode } from "react";
import { IoChevronForward } from "react-icons/io5";

/**
 * The top of every members page: « Accueil › Page » trail, one plain h1 and a
 * sentence that says what the page is for.
 */
export function PageHeader({
  current,
  title,
  intro,
  parents = [],
}: {
  /** Pages between « Accueil » and this one. */
  parents?: { label: string; href: string }[];
  /** The last crumb, usually the title. */
  current: string;
  title: string;
  intro?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Fil d’Ariane" className="text-muted text-base">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <NextLink
              href="/membres"
              className="text-primary-text inline-flex min-h-8 items-center font-medium underline-offset-2 hover:underline"
            >
              Accueil
            </NextLink>
          </li>
          {parents.map((parent) => (
            <Fragment key={parent.href}>
              <li aria-hidden="true">
                <IoChevronForward className="h-4 w-4" />
              </li>
              <li>
                <NextLink
                  href={parent.href}
                  className="text-primary-text inline-flex min-h-8 items-center font-medium underline-offset-2 hover:underline"
                >
                  {parent.label}
                </NextLink>
              </li>
            </Fragment>
          ))}
          <li aria-hidden="true">
            <IoChevronForward className="h-4 w-4" />
          </li>
          <li aria-current="page">{current}</li>
        </ol>
      </nav>
      <div className="flex flex-col gap-2">
        <h1 className="text-foreground text-[34px] leading-[1.1] font-semibold tracking-tight md:text-[44px]">
          {title}
        </h1>
        {intro && (
          <p className="text-muted max-w-3xl text-lg md:text-xl">{intro}</p>
        )}
      </div>
    </div>
  );
}
