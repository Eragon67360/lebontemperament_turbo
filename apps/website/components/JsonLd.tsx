// Server component — renders a JSON-LD script tag. Use only in server components.
// `<` is escaped so text typed in the admin (a concert's informations, for
// instance) can never close the script tag; JSON parsers read \u003c as `<`.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
