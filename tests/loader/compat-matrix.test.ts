/**
 * 加载器兼容矩阵巡检（需网络，默认跳过）
 * 使用：设置环境变量 LOADER_COMPAT_MATRIX=1 后运行
 *   npx vitest run tests/loader/compat-matrix.test.ts
 * 结果写入 tests/fixtures/loader/compat-matrix.json，用于比对元数据覆盖变化。
 */
import { describe, it, expect } from 'vitest'
import { promises as fs } from 'fs'
import * as path from 'path'
import { loaderCatalog } from '../../electron/loaders/catalog'
import type { LoaderKind } from '../../electron/loaders/catalog/types'

const enabled = process.env.LOADER_COMPAT_MATRIX === '1'

/** 抽样版本：覆盖 legacy、现代版本线与 26.x 新版本号体系 */
const SAMPLE_VERSIONS = [
  '1.7.10',
  '1.12.2',
  '1.14.4',
  '1.16.5',
  '1.18.2',
  '1.20.1',
  '1.20.6',
  '1.21.1',
  '1.21.11',
  '26.1.2',
  '26.3'
]

const LOADERS: LoaderKind[] = ['forge', 'neoforge', 'fabric', 'quilt']

describe.skipIf(!enabled)('加载器兼容矩阵（需网络）', () => {
  it('抽样版本 × 四加载器均能给出支持结论', async () => {
    const rows: Array<{
      mcVersion: string
      loader: LoaderKind
      level: string
      builds: number
      reason: string
    }> = []

    for (const mcVersion of SAMPLE_VERSIONS) {
      for (const loader of LOADERS) {
        const support = await loaderCatalog.getSupport(loader, mcVersion)
        rows.push({
          mcVersion,
          loader,
          level: support.level,
          builds: support.builds.length,
          reason: support.reason ?? ''
        })
      }
    }

    const outDir = path.join(process.cwd(), 'tests', 'fixtures', 'loader')
    await fs.mkdir(outDir, { recursive: true })
    await fs.writeFile(
      path.join(outDir, 'compat-matrix.json'),
      JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2),
      'utf8'
    )

    expect(rows).toHaveLength(SAMPLE_VERSIONS.length * LOADERS.length)
  }, 180000)
})
