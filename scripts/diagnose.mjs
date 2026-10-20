import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  const errors = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))

  const routes = ['/', '/settings', '/instances']

  for (const route of routes) {
    console.log(`\n=== Testing ${route} ===`)
    errors.length = 0

    await page.goto(`http://localhost:5173/#${route}`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(2000)

    // Check main-content existence and child count
    const mainContent = await page.$('.main-content')
    if (!mainContent) {
      console.log('  FAIL: .main-content not found!')
    } else {
      const children = await mainContent.$$(':scope > *')
      const childTags = []
      for (const c of children) {
        const tag = await c.evaluate(el => el.tagName.toLowerCase())
        const cls = await c.evaluate(el => el.className)
        const hasChildren = (await c.$$(':scope > *')).length
        childTags.push(`${tag}.${cls.split(' ')[0] || '(none)'}(${hasChildren} children)`)
      }
      console.log(`  .main-content has ${children.length} direct children: ${childTags.join(', ')}`)

      // Check if router-view content exists
      const hasVisibleContent = await page.$eval('.main-content', el => {
        return el.textContent?.trim().length > 0
      }).catch(() => false)
      console.log(`  has visible text content: ${hasVisibleContent}`)
    }

    // Take screenshot
    const path = `F:/MClauncher/VOXVER/VoxVer/scripts/diag-${route.replace(/\//g, '-').replace(/^-/, 'root')}.png`
    await page.screenshot({ path, fullPage: false })
    console.log(`  screenshot: ${path}`)

    if (errors.length) {
      console.log(`  console errors: ${errors.slice(0, 5).join(' | ')}`)
    }
  }

  await browser.close()
}

main().catch(e => {
  console.error('Diagnosis failed:', e.message)
  process.exit(1)
})