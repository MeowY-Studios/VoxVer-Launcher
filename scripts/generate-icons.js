/**
 * 从 resources/icons/icon.svg 生成全套应用图标。
 *
 *   node scripts/generate-icons.js
 *
 * 产物：
 *   resources/icons/icon.ico        多尺寸 ICO（16–256），electron-builder 用作
 *                                   应用图标 / 安装器 / 卸载器图标
 *   resources/icons/icon.png        512px PNG（预览 / 部分平台用）
 *   resources/icons/icon_preview.png
 *   resources/icons/LOGO.ico        单尺寸 512 ICO（历史文件名，保持兼容）
 *   public/LOGO.png                 512 ICO（历史文件名，保持兼容）
 *   public/VoxVer/VoxVerLogo-<n>.ico  各尺寸单条 ICO
 *
 * 注意：ICO 内用 PNG 压缩条目（Vista 及以上支持）；透明区域一律保留 alpha。
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SVG_PATH = path.join(ROOT, 'resources/icons/icon.svg');
const PREVIEW_DIR = path.join(ROOT, '.icon-preview');

/** 把若干 { size, data } PNG 打包成 ICO */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  const blobs = [];
  let offset = 6 + 16 * entries.length;

  entries.forEach((entry, i) => {
    const base = 16 * i;
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, base);
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, base + 1);
    dir.writeUInt8(0, base + 2);
    dir.writeUInt8(0, base + 3);
    dir.writeUInt16LE(1, base + 4);
    dir.writeUInt16LE(32, base + 6);
    dir.writeUInt32LE(entry.data.length, base + 8);
    dir.writeUInt32LE(offset, base + 12);
    offset += entry.data.length;
    blobs.push(entry.data);
  });

  return Buffer.concat([header, dir, ...blobs]);
}

async function main() {
  const svg = fs.readFileSync(SVG_PATH);
  const sizes = [16, 24, 32, 48, 64, 128, 192, 256, 512, 1024];

  const rendered = [];
  for (const size of sizes) {
    const data = await sharp(svg)
      .resize(size, size, { kernel: 'lanczos3' })
      .png({ compressionLevel: 9 })
      .toBuffer();
    rendered.push({ size, data });
  }
  const at = (size) => rendered.find((r) => r.size === size);

  // 主图标：ICO 上限 256，其余尺寸单独出 PNG
  fs.writeFileSync(
    path.join(ROOT, 'resources/icons/icon.ico'),
    buildIco(rendered.filter((r) => r.size <= 256))
  );
  fs.writeFileSync(path.join(ROOT, 'resources/icons/icon.png'), at(512).data);
  fs.writeFileSync(path.join(ROOT, 'resources/icons/icon_preview.png'), at(512).data);
  fs.writeFileSync(path.join(ROOT, 'resources/icons/LOGO.ico'), buildIco([at(512)]));

  // public 下的历史文件名
  fs.writeFileSync(path.join(ROOT, 'public/LOGO.png'), buildIco([at(512)]));
  const voxverDir = path.join(ROOT, 'public/VoxVer');
  if (fs.existsSync(voxverDir)) {
    for (const size of [16, 32, 48, 64, 128, 192, 256, 512]) {
      fs.writeFileSync(path.join(voxverDir, `VoxVerLogo-${size}x${size}.ico`), buildIco([at(size)]));
    }
  }

  // 启动画面用的品牌标记（PNG，透明度保留）
  const brandDir = path.join(ROOT, 'public/brand');
  fs.mkdirSync(brandDir, { recursive: true });
  fs.writeFileSync(path.join(brandDir, 'mark-256.png'), at(256).data);
  fs.writeFileSync(path.join(brandDir, 'mark-512.png'), at(512).data);

  // 预览条（深/浅两种底，验证小尺寸可读性）
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  const tiles = [];
  let x = 10;
  for (const r of rendered.filter((v) => v.size <= 256).sort((a, b) => a.size - b.size)) {
    const shown = Math.min(r.size, 128);
    tiles.push({ input: await sharp(r.data).resize(shown, shown).png().toBuffer(), left: x, top: 10 + (128 - shown) / 2 });
    x += shown + 14;
  }
  const width = x + 6;
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="148">
       <rect width="${width}" height="74" fill="#151517"/>
       <rect y="74" width="${width}" height="74" fill="#F1EEE6"/>
     </svg>`
  );
  await sharp(bg).composite(tiles).png().toFile(path.join(PREVIEW_DIR, 'strip.png'));

  console.log(`icons generated: ${sizes.join(', ')}`);
  console.log(`preview: ${path.relative(ROOT, path.join(PREVIEW_DIR, 'strip.png'))}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
