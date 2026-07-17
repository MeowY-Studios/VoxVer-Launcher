const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const pkg = require('../package.json')

const version = pkg.version
const tmpDir = `build-${version}`
const finalDir = 'build'

console.log(`Building version ${version}...`)
console.log(`Output: ${tmpDir} -> ${finalDir}`)

try {
  // 1. 编译
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') })

  // 2. 打包到 build-x.x.x
  execSync(
    `electron-builder --win --publish never --config.directories.output=${tmpDir}`,
    { stdio: 'inherit', cwd: path.join(__dirname, '..') }
  )

  // 3. 复制 build-x.x.x 到 build
  const srcDir = path.join(__dirname, '..', tmpDir)
  const destDir = path.join(__dirname, '..', finalDir)

  // 尝试清理旧 build 目录
  try {
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true })
    }
  } catch (e) {
    console.warn(`Cannot remove old build directory: ${e.message}`)
    console.warn('Skipping copy to build, artifacts are in', tmpDir)
    return
  }

  copyDirSync(srcDir, destDir)
  console.log(`Copied ${tmpDir} -> ${finalDir}`)
} catch (e) {
  console.error('Build failed:', e.message)
  process.exit(1)
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}
