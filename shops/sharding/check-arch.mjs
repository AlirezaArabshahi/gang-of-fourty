// Usage:
//   node check-arch.mjs src                (Standard layer-based architecture)
//   node check-arch.mjs src --feature-based (Feature-based architecture)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, dirname, normalize } from 'node:path'

const root = process.argv[2]
const isFB = process.argv.includes('--feature-based')
if (!root) {
  console.log('Usage: node check-arch.mjs src [--feature-based]')
  process.exit(1)
}

const ALLOWED = {
  main: ['main', 'ui', 'logic', 'data', 'types'],
  ui: ['ui', 'types'],
  logic: ['logic', 'types'],
  data: ['data', 'types'],
  types: ['types'],
}
const FORBIDDEN = {
  types: ['document', 'window', 'fetch', 'localStorage'],
  logic: ['document', 'window', 'fetch', 'localStorage'],
  data: ['document'],
  ui: ['fetch', 'localStorage'],
  main: [],
}
const FUNCTIONS = [
  'getJSON', 'isProduct', 'isCategory', 'isOffer', 'isCartLine',
  'loadProducts', 'loadCategories', 'loadOffers', 'loadStock', 'saveCart', 'loadCart',
  'finalPrice', 'inStock', 'formatPrice', 'addToCart', 'removeFromCart', 'cartCount', 'cartTotal',
  'cartRows', 'visibleProducts', 'toCard',
  'renderStatus', 'renderCategories', 'renderProducts', 'renderCart', 'renderTotal', 'render', 'start',
]
const MAX_LINES = 70

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (name.endsWith('.ts')) files.push(relative(root, p).split('\\').join('/'))
  }
}
walk(root)

const featureOf = (f) => (m => m ? m[1] : null)(f.match(/^features\/([^/]+)\//))
const layerOf = (file) => {
  const parts = file.split('/'), first = parts[0]
  if (file === 'main.ts') return 'main'
  if (file === 'types.ts' || file === 'shared/types.ts' || first === 'types') return 'types'
  if (isFB && first === 'features') return parts[2] === 'ui' ? 'ui' : (['api','storage','data'].includes(parts[2]) ? 'data' : 'logic')
  if (isFB && first === 'shared') return ['api','storage','data'].includes(parts[1]) ? 'data' : (parts[1] === 'ui' ? 'ui' : 'logic')
  if (['api','storage','data'].includes(first)) return 'data'
  if (first === 'ui') return 'ui'
  return 'logic'
}
const codeOf = (t) => t.replace(/\/\/.*$/gm, '').replace(/'(\\.|[^'\\])*'|`(\\.|[^`\\])*`/g, "''")

const problems = [], graph = {}
for (const file of files) {
  const text = readFileSync(join(root, file), 'utf8')
  const layer = layerOf(file), lines = text.trimEnd().split('\n').length
  const first = file.split('/')[0]

  if (isFB && first !== 'features' && first !== 'shared' && file !== 'main.ts') {
    problems.push(`${file}: in feature mode, files must be inside 'shared/' or 'features/'`)
  }

  if (/(^|\/)(utils|helpers|misc|common|stuff)(\/|\.ts$)/.test(file)) problems.push(`${file}: bad file name`)
  if (lines > MAX_LINES) problems.push(`${file}: ${lines} lines (max ${MAX_LINES})`)
  for (const word of FORBIDDEN[layer]) if (new RegExp(`\\b${word}\\b`).test(codeOf(text))) problems.push(`${file}: ${layer} must not use ${word}`)
  
  graph[file] = []
  for (const [, spec] of text.matchAll(/^import\s[^']*'([^']+)'/gm)) {
    if (!spec.startsWith('.')) continue
    let target = normalize(join(dirname(file), spec)).split('\\').join('/').replace(/\.js$/, '.ts')
    if (!target.endsWith('.ts')) target += '.ts'
    if (!files.includes(target)) { problems.push(`${file}: missing file ${spec}`); continue }
    graph[file].push(target)
    
    if (isFB) {
      const sf = featureOf(file), tf = featureOf(target)
      if (sf && tf && sf !== tf) problems.push(`${file} → ${target}: features must not import each other`)
      if (tf && !sf && file !== 'main.ts') problems.push(`${file} → ${target}: shared must not import features`)
      const sameFeatureUiToLogic = (sf !== null && sf === tf && layer === 'ui' && layerOf(target) === 'logic')
      if (!ALLOWED[layer].includes(layerOf(target)) && !sameFeatureUiToLogic) {
        problems.push(`${file} → ${target}: ${layer} must not import ${layerOf(target)}`)
      }
    } else {
      if (!ALLOWED[layer].includes(layerOf(target))) {
        problems.push(`${file} → ${target}: ${layer} must not import ${layerOf(target)}`)
      }
    }
  }
}
const reaches = (f, t, s = new Set()) => graph[f].some(n => n === t || (!s.has(n) && (s.add(n), reaches(n, t, s))))
for (const f of files) if (reaches(f, f)) problems.push(`${f}: is part of an import circle`)

const all = files.map(f => readFileSync(join(root, f), 'utf8')).join('\n')
for (const n of FUNCTIONS) if (!new RegExp(`function\\s+${n}\\b|const\\s+${n}\\s*=`).test(all)) problems.push(`function ${n} is missing`)

const by = {}
for (const f of files) (by[layerOf(f)] ??= []).push(f)
for (const l of ['main','ui','logic','data','types']) console.log(l.padEnd(6), (by[l]||[]).join('  '))
console.log('')
if (problems.length === 0) console.log(`✅ ${files.length} files, every import points down, no circles.`)
else { for (const p of problems) console.log('❌ ' + p); process.exitCode = 1 }