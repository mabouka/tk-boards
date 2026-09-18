import { type Instrumentation } from 'next'

/**
 * Surface server errors in full.
 *
 * In production Next.js sanitises server-side errors before they reach the
 * browser — the client only sees a generic message and a numeric `digest`. The
 * real message and stack are available here, so we print them (with the digest,
 * route and request path) to stdout, where Vercel's Runtime Logs pick them up.
 *
 * This turns the browser's opaque "ERROR <digest>" into a one-line lookup: search
 * the logs for that digest and the full cause is right there. No external service.
 */
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  const digest =
    typeof err === 'object' && err !== null && 'digest' in err
      ? String((err as { digest?: unknown }).digest)
      : 'n/a'

  console.error(
    `[onRequestError] digest=${digest} ${context.routeType} ${request.method} ${request.path} (route: ${context.routePath})`,
    err
  )
}
