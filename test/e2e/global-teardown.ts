import { execSync } from 'node:child_process'
import { PG_CONTAINER } from './constants'

export default async function globalTeardown() {
  try {
    execSync(`docker rm -f ${PG_CONTAINER}`, { stdio: 'ignore' })
  } catch {
    /* already gone */
  }
}
