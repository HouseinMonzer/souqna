// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

const block = (selector: string) => {
  const start = css.indexOf(`${selector} {`)
  return css.slice(start, css.indexOf('\n}', start))
}

const declarations = (source: string) =>
  Object.fromEntries([...source.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]))

const palette = declarations(block('@theme static'))

function resolve(vars: Record<string, string>, name: string): string {
  let value = vars[name]
  for (let depth = 0; value?.startsWith('var(') && depth < 5; depth++) {
    const ref = value.slice(6, -1)
    value = vars[ref] ?? palette[ref]
  }
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`--${name} is not a hex colour: ${value}`)
  return value
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// [foreground, background, minimum ratio]
const TEXT = 4.5
const UI = 3
const pairs: [string, string, number][] = [
  ['fg', 'bg', TEXT], ['fg', 'surface', TEXT], ['fg', 'surface-muted', TEXT],
  ['fg-muted', 'bg', TEXT], ['fg-muted', 'surface', TEXT], ['fg-muted', 'surface-muted', TEXT],
  ['fg-subtle', 'surface', TEXT],
  ['primary-fg', 'primary', TEXT], ['primary-fg', 'primary-hover', TEXT],
  ['primary-soft-fg', 'primary-soft', TEXT],
  ['accent-fg', 'accent', TEXT], ['accent-fg', 'accent-hover', TEXT],
  ['accent-soft-fg', 'accent-soft', TEXT],
  ['primary', 'surface', TEXT], ['accent', 'surface', TEXT],
  ['success', 'success-soft', TEXT], ['warning', 'warning-soft', TEXT],
  ['danger', 'danger-soft', TEXT], ['info', 'info-soft', TEXT],
  ['danger', 'surface', TEXT],
  ['border-strong', 'surface', UI], ['border-strong', 'bg', UI], ['ring', 'surface', UI], ['ring', 'bg', UI],
]

describe.each([
  ['light', ':root'],
  ['dark', "[data-theme='dark']"],
])('%s theme contrast', (_name, selector) => {
  const vars = declarations(block(selector))
  it.each(pairs)('%s on %s ≥ %s:1', (fg, bg, min) => {
    expect(contrast(resolve(vars, fg), resolve(vars, bg))).toBeGreaterThanOrEqual(min)
  })
})
