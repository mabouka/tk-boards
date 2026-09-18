/**
 * Trigger a browser download of an in-memory text file.
 *
 * Client-only — uses DOM APIs (Blob / <a download> / object URL), so call it
 * from event handlers in client components, never on the server.
 */
export function downloadTextFile(
  filename: string,
  content: string,
  mime = 'text/csv;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
