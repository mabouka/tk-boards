import { metadata as studioMetadata, viewport as studioViewport } from 'next-sanity/studio'
import { StudioClient } from './studio-client'

export const metadata = studioMetadata
export const viewport = studioViewport
export const dynamic = 'force-dynamic'

export default function StudioPage() {
  return <StudioClient />
}
