const fs = require('fs')
const path = require('path')

// Extract all $t() and t() keys from source files
function readKeys(content) {
  const result = new Set()
  // $t('key') and $t("key")
  const re1 = /\$t\(['"]([^'"]+)['"]/g
  let m
  while ((m = re1.exec(content)) !== null) {
    const k = m[1]
    if (!k.includes('${') && !k.includes('$t') && k) result.add(k)
  }
  // t('key') and t("key") (not preceded by $)
  const re2 = /(?<!\$)t\(['"]([^'"]+)['"]/g
  while ((m = re2.exec(content)) !== null) {
    const k = m[1]
    if (!k.includes('${') && !k.includes('$t') && k) result.add(k)
  }
  return result
}

function walkDir(dir) {
  const results = []
  const list = fs.readdirSync(dir, { withFileTypes: true })
  for (const item of list) {
    const fp = path.join(dir, item.name)
    if (item.isDirectory()) {
      results.push(...walkDir(fp))
    } else {
      results.push(fp)
    }
  }
  return results
}

// Collect all used keys
const usedKeys = new Set()
const srcFiles = walkDir('src')
for (const f of srcFiles) {
  if (!/\.(vue|ts)$/.test(f)) continue
  if (f.includes('node_modules') || f.includes('locale')) continue
  try {
    const c = fs.readFileSync(f, 'utf8')
    readKeys(c).forEach(k => usedKeys.add(k))
  } catch (e) { console.warn('[check-i18n] 读取文件失败:', f, e.message) }
}

// Parse locale files by traversing the module export
// Strategy: dynamically import via ts-node or just parse manually
// For simplicity, let's read the source and use a line-by-line parser

function parseLocaleFile(text) {
  const keys = new Set()
  const stack = []
  // Simple line parser: track nesting via { and }
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/')) continue
    if (t === '') continue
    
    // Match: key: 'value',
    const strMatch = t.match(/^(\w+)\s*:\s*['"`]/)
    if (strMatch) {
      const key = strMatch[1]
      keys.add([...stack, key].join('.'))
    }
    // Match: key: { or key: [
    const nestMatch = t.match(/^(\w+)\s*:\s*[\{[]/)
    if (nestMatch) {
      const key = nestMatch[1]
      stack.push(key)
      keys.add([...stack].join('.'))
    }
    // Match closing }
    if (t === '},' || t === '}' || t === '],' || t === ']' || t === '},') {
      stack.pop()
    }
  }
  return keys
}

const zhText = fs.readFileSync('src/locale/zh-CN.ts', 'utf8')
const enText = fs.readFileSync('src/locale/en-US.ts', 'utf8')
const zhKeys = parseLocaleFile(zhText)
const enKeys = parseLocaleFile(enText)

const missingZh = [...usedKeys].filter(k => !zhKeys.has(k)).sort()
const missingEn = [...usedKeys].filter(k => !enKeys.has(k)).sort()
const onlyZh = [...zhKeys].filter(k => !enKeys.has(k)).sort()

console.log('=== Used in code but MISSING from zh-CN (' + missingZh.length + ') ===')
if (missingZh.length === 0) console.log('None! All good.')
else missingZh.forEach(k => console.log('  ' + k))

console.log('\n=== Used in code but MISSING from en-US (' + missingEn.length + ') ===')
if (missingEn.length === 0) console.log('None! All good.')
else missingEn.forEach(k => console.log('  ' + k))

console.log('\n=== In zh-CN but MISSING from en-US (' + onlyZh.length + ') ===')
if (onlyZh.length === 0) console.log('None! All good.')
else onlyZh.forEach(k => console.log('  ' + k))
