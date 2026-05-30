#!/usr/bin/env node
/**
 * CSS Syntax Validator
 * Uses lightningcss (the strict parser from Next.js build) to detect
 * CSS syntax errors without requiring a full build.
 *
 * Catches issues like: var(--x + var(--y)) [invalid nesting]
 *
 * Tolerates CSS Modules syntax (composes, :global, :local) since lightningcss
 * has native CSS Modules support.
 */

import { globSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { transform } from 'lightningcss'

const CSS_PATTERN = '{app,components}/**/*.css'
const files = globSync(CSS_PATTERN).sort()

if (files.length === 0) {
  console.log('No CSS files found.')
  process.exit(0)
}

console.log(`Validating ${files.length} CSS files...`)

let errorCount = 0
const errors = []

for (const file of files) {
  const code = readFileSync(file, 'utf-8')

  try {
    // Use lightningcss.transform with CSS Modules support
    // cssModules: true handles composes, :global, :local syntax
    transform({
      code: Buffer.from(code),
      filename: file,
      cssModules: true,
      minify: false,
    })
  } catch (err) {
    errorCount++
    const loc = err.location
      ? `${file}:${err.location.line}:${err.location.column}`
      : file
    errors.push(`${loc} — ${err.message}`)
  }
}

// Output
if (errorCount === 0) {
  console.log(`✓ All CSS valid`)
  process.exit(0)
}

console.error(`\n✗ ${errorCount} CSS error(s) found:\n`)
errors.forEach(e => console.error(`  ${e}`))
process.exit(1)
