const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const pkg = require('../package.json')

const version = pkg.version
const finalDir = 'build'

console.log(`Building version ${version}...`)
console.log(`Output: ${finalDir}`)

try {
  // 1. 编译
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') })

  // 2. 清理旧 build 目录
  const destDir = path.join(__dirname, '..', finalDir)
  try {
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true })
    }
  } catch (e) {
    console.warn(`Cannot remove old build directory: ${e.message}`)
  }

  // 3. 直接打包到 build 目录
  execSync(
    `electron-builder --win --publish never`,
    { stdio: 'inherit', cwd: path.join(__dirname, '..') }
  )

  console.log(`Build complete, artifacts are in ${finalDir}`)
} catch (e) {
  console.error('Build failed:', e.message)
  process.exit(1)
}
