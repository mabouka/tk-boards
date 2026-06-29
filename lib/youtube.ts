/**
 * Extract the 11-char video id from any common YouTube URL form:
 * watch?v=, youtu.be/, embed/, shorts/, v/, e/, live/.
 * Shared by the Text + YouTube section and the FAQ rich-text embed.
 */
export function youtubeId(url?: string): string | null {
  if (!url) return null
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/|e\/|live\/)|youtu\.be\/)([\w-]{11})/
  )
  return m ? m[1] : null
}
