const fs = require('fs');
const path = require('path');

/**
 * 修复 electron-vite 编译后代码中 is.dev 的问题
 *  - 老版本 electron-vite：生成 const is = { dev: !electron.app.isPackaged } → 替换为 getter 形式
 *  - 新版本 electron-vite（≥5.x）：原生生成 function isDev() { process.env.NODE_ENV + !isPackaged } → 已是安全实现，无需处理
 *  - 其它情况：静默跳过（避免"Pattern not found"之类的误导性 warning）
 */

const files = [
  path.join(__dirname, '../out/main/index.js'),
  path.join(__dirname, '../out/preload/index.js')
];

let fixedCount = 0;
files.forEach(file => {
  if (!fs.existsSync(file)) return; // 文件不存在时静默（可能无 preload）

  const content = fs.readFileSync(file, 'utf8');

  // 1) 新 electron-vite 原生修复：function isDev() —— 直接跳过
  if (/function\s+isDev\s*\(\s*\)/.test(content)) return;

  // 2) 老版本 const is = { dev: !electron.app.isPackaged } —— 需要修复
  const legacyPattern = /(const is\s*=\s*\{[^}]*dev:\s*!electron\.app\.isPackaged[^}]*\})/;
  if (legacyPattern.test(content)) {
    const replacement = `const is = {
  get dev() {
    return electron?.app?.isPackaged === false;
  }
}`;
    const next = content.replace(legacyPattern, replacement);
    fs.writeFileSync(file, next, 'utf8');
    fixedCount += 1;
    console.log(`[fix-is] Fixed: ${file}`);
  }

  // 3) 两者都不存在：静默（不输出 noise）
});

const summary = fixedCount > 0
  ? `postbuild fix complete (fixed ${fixedCount} file(s))`
  : 'postbuild fix complete (nothing to do — electron-vite outputs safe isDev natively)';
console.log(summary);
