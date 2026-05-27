import { SlugValidationContext } from 'sanity'

export async function isUniqueSlugPerLanguage(
  slug: string,
  context: SlugValidationContext
) {
  const { document, getClient } = context
  if (!document) return true
  const client = getClient({ apiVersion: '2025-05-25' })

  const id = document._id.replace(/^drafts\./, '')
  const language = (document as { language?: string }).language

  if (!language) return true

  const result = await client.fetch<string[]>(
    `*[
      _type == $type &&
      !(_id in [$draft, $published]) &&
      slug.current == $slug &&
      language == $language
    ]._id`,
    {
      type: document._type,
      draft: `drafts.${id}`,
      published: id,
      slug,
      language,
    }
  )

  return result.length === 0
}
