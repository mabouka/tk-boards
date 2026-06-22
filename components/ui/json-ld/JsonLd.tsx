/**
 * Renders a JSON-LD structured-data script.
 * `<` is escaped so CMS-sourced content can never break out of the <script> tag.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
