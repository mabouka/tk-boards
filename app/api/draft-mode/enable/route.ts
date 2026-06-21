import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { client } from '@/sanity/lib/client'

// Validates the Presentation preview-url secret, enables Next draft mode, and
// redirects to the previewed URL. Needs a token-scoped client to read drafts.
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN }),
})
