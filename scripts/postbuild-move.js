const fs = require('fs')
const path = require('path')
const pkg = require('../package.json')

const version = pkg.version
const buildDir = path.join(__dirname, '..', 'build')
const targetDir = path.join(__dirname, '..', `build-${version}`)

if (!fs.existsSync(buildDir)) {
  console.log(`Build directory not found: ${buildDir}`)
  process.exit(0)
}

// 创建目标目录
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

// 复制 build 目录下的文件到 build-x.x.x
const entries = fs.readdirSync(buildDir, { withFileTypes: true })
for (const entry of entries) {
  const src = path.join(buildDir, entry.name)
  const dest = path.join(targetDir, entry.name)
  if (entry.isDirectory()) {
    fs.cpSync(src, dest, { recursive: true })
  } else {
    fs.copyFileSync(src, dest)
  }
}

console.log(`Copied build files to ${targetDir}`)
