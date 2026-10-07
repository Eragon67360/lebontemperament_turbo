import { BrandMark } from "@/components/shell/BrandMark";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WEBSITE_URL, websiteHost } from "@/lib/website";

/**
 * The frame of every page outside the dashboard shell (sign-in, password
 * reset, not found, no access, error): a centred 400 px column on the page
 * background with the brand, one card, and the way to the public site.
 * Direction B: no gradient, no decoration, one filled teal button inside.
 *
 * `<body>` does not scroll (the shell owns its scroll container), so this
 * `<main>` is the page's scroll container: nothing is cut on a short screen
 * or with the phone keyboard open.
 */
export function AuthLayout({
  children,
  brandIsHeading = false,
}: {
  children: React.ReactNode;
  /** The sign-in page's h1 is the association's name; other pages title their card. */
  brandIsHeading?: boolean;
}) {
  const BrandName = brandIsHeading ? "h1" : "p";
  return (
    <main
      id="main"
      className="bg-background text-foreground h-dvh overflow-y-auto"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[432px] flex-col justify-center gap-6 px-4 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark />
          <div>
            <BrandName className="text-section text-foreground">
              Le Bon Tempérament
            </BrandName>
            <p className="text-detail text-muted-foreground">Administration</p>
          </div>
        </div>

        <Card className="p-6 sm:p-8">{children}</Card>

        <p className="text-center">
          <a
            href={WEBSITE_URL}
            className="text-detail text-primary-text inline-flex min-h-11 items-center rounded-sm px-2 underline-offset-4 hover:underline"
          >
            Aller sur le site {websiteHost()}
          </a>
        </p>
      </div>
    </main>
  );
}

/** The card's title and its one sentence (`as="h1"` when the brand is not the h1). */
export function AuthCardHeader({
  title,
  intro,
  as: Heading = "h2",
  className,
}: {
  title: string;
  intro?: React.ReactNode;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      <Heading className="text-section text-foreground">{title}</Heading>
      {intro && (
        <p className="text-detail text-muted-foreground mt-1">{intro}</p>
      )}
    </div>
  );
}
