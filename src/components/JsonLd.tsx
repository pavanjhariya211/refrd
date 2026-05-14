/**
 * Renders a schema.org JSON-LD block as a <script type="application/ld+json">.
 * Server-rendered, so search crawlers and AI answer engines see it in the
 * initial HTML. Pass any plain object built by the helpers in lib/jsonld.ts.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inject — it contains no executable
      // markup, only data. This is the Next.js-documented pattern for JSON-LD.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
