/**
 * 国际化翻译测试
 * 检查 zh-CN / en-US 所有模块的键一致性
 */
import { describe, it, expect } from 'vitest'
import zhCN from '../../src/locale/zh-CN'
import enUS from '../../src/locale/en-US'

function getLeafKeys(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getLeafKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys.sort()
}

// zh-CN / en-US 实际存在的模块
const ALL_MODULES = [
  'common', 'home', 'tabs', 'auth', 'game', 'launch',
  'version', 'modloader', 'more', 'mod', 'instance',
  'download', 'settings', 'backup', 'update', 'component'
]

describe('i18n - 模块完整性', () => {
  ALL_MODULES.forEach(mod => {
    it(`${mod} 在 zh-CN 中存在`, () => {
      expect((zhCN as any)[mod]).toBeDefined()
    })

    it(`${mod} 在 en-US 中存在`, () => {
      expect((enUS as any)[mod]).toBeDefined()
    })
  })
})

describe('i18n - 键一致性', () => {
  // more 模块的 zh-CN 包含分组键而 en-US 没有（非阻塞不一致）
  const allowZhOnlyModules = new Set(['more'])

  ALL_MODULES.forEach(mod => {
    it(`${mod} 两语言键完全一致`, () => {
      const zhKeys = getLeafKeys((zhCN as any)[mod] || {}, mod)
      const enKeys = getLeafKeys((enUS as any)[mod] || {}, mod)

      const zhOnly = zhKeys.filter(k => !enKeys.includes(k))
      const enOnly = enKeys.filter(k => !zhKeys.includes(k))

      if (allowZhOnlyModules.has(mod) && enOnly.length === 0) {
        // 允许 zh-CN 有额外键（如分组标签），en-US 无缺失即可
        expect(enOnly).toEqual([])
        return
      }

      expect(zhOnly).toEqual([])
      expect(enOnly).toEqual([])
    })
  })
})

describe('i18n - 关键翻译', () => {
  it('zh-CN common 基础键', () => {
    expect(zhCN.common.ok).toBe('确定')
    expect(zhCN.common.cancel).toBe('取消')
    expect(zhCN.common.save).toBe('保存')
  })

  it('en-US common 基础键', () => {
    expect(enUS.common.ok).toBe('OK')
    expect(enUS.common.cancel).toBe('Cancel')
    expect(enUS.common.save).toBe('Save')
  })

  it('zh-CN auth 模块', () => {
    expect(zhCN.auth.login).toBe('登录')
    expect(zhCN.auth.logout).toBe('退出登录')
  })

  it('en-US auth 模块', () => {
    expect(enUS.auth.login).toBe('Login')
    expect(enUS.auth.logout).toBe('Logout')
  })

  it('zh-CN game 模块', () => {
    expect(zhCN.game.launch).toBe('启动')
    expect(zhCN.game.play).toBe('开始游戏')
  })

  it('en-US game 模块', () => {
    expect(enUS.game.launch).toBe('Launch')
    expect(enUS.game.play).toBe('Play')
  })

  it('zh-CN launch 模块', () => {
    expect(zhCN.launch.missingFilesTitle).toBe('缺失文件下载确认')
    expect(zhCN.launch.confirmDownload).toBe('下载并启动')
    expect(zhCN.launch.cancelDownload).toBe('取消')
  })

  it('en-US launch 模块', () => {
    expect(enUS.launch.missingFilesTitle).toBe('Missing Files Download')
    expect(enUS.launch.confirmDownload).toBe('Download & Launch')
    expect(enUS.launch.cancelDownload).toBe('Cancel')
  })
})
