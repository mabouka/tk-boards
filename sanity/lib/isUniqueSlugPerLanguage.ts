import { SlugValidationContext } from 'sanity'

export async function isUniqueSlugPerLanguage(
  slug: string,
  context: SlugValidationContext
) {
  const { document, getClient } = context
  const client = getClient({ apiVersion: '2025-05-25' })

  const id = document._id.replace(/^drafts\./, '')

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
      language: document.language,
    }
  )

  return result.length === 0
}
