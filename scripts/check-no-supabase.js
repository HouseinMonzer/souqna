const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const blocked = [/supabase/i, /@supabase/i, /NEXT_PUBLIC_SUPABASE/i, /VITE_SUPABASE/i]
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'generated'])
const ignoredFiles = new Set(['MIGRATION.md'])
const offenders = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (ignoredFiles.has(entry.name) || entry.name === 'check-no-supabase.js' || entry.name.endsWith('.lock')) continue
    const rel = path.relative(root, full)
    const text = fs.readFileSync(full, 'utf8')
    const lines = text.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (line.includes('check:no-supabase')) return
      if (blocked.some(pattern => pattern.test(line))) {
        offenders.push(`${rel}:${index + 1}: ${line.trim()}`)
      }
    })
  }
}

walk(root)

if (offenders.length > 0) {
  console.error('Forbidden Supabase references found:')
  console.error(offenders.join('\n'))
  process.exit(1)
}

console.log('No Supabase references found.')
