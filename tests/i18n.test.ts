import { describe, it, expect } from 'vitest'
import zhCN from '../src/locale/zh-CN'
import enUS from '../src/locale/en-US'

describe('i18n translations', () => {
  describe('Chinese (zh-CN)', () => {
    it('should have common module', () => {
      expect(zhCN.common).toBeDefined()
      expect(zhCN.common.ok).toBe('确定')
      expect(zhCN.common.cancel).toBe('取消')
      expect(zhCN.common.save).toBe('保存')
    })

    it('should have auth module', () => {
      expect(zhCN.auth).toBeDefined()
      expect(zhCN.auth.login).toBe('登录')
      expect(zhCN.auth.logout).toBe('退出登录')
    })

    it('should have game module', () => {
      expect(zhCN.game).toBeDefined()
      expect(zhCN.game.launch).toBe('启动')
      expect(zhCN.game.play).toBe('开始游戏')
    })

    it('should have mod module', () => {
      expect(zhCN.mod).toBeDefined()
      expect(zhCN.mod.install).toBe('安装')
      expect(zhCN.mod.uninstall).toBe('卸载')
    })

    it('should have settings module', () => {
      expect(zhCN.settings).toBeDefined()
      expect(zhCN.settings.language).toBe('语言')
      expect(zhCN.settings.theme).toBe('主题')
    })
  })

  describe('English (en-US)', () => {
    it('should have common module', () => {
      expect(enUS.common).toBeDefined()
      expect(enUS.common.ok).toBe('OK')
      expect(enUS.common.cancel).toBe('Cancel')
      expect(enUS.common.save).toBe('Save')
    })

    it('should have auth module', () => {
      expect(enUS.auth).toBeDefined()
      expect(enUS.auth.login).toBe('Login')
      expect(enUS.auth.logout).toBe('Logout')
    })

    it('should have game module', () => {
      expect(enUS.game).toBeDefined()
      expect(enUS.game.launch).toBe('Launch')
      expect(enUS.game.play).toBe('Play')
    })
  })

  describe('translation completeness', () => {
    const modules = ['common', 'auth', 'game', 'mod', 'instance', 'download', 'settings', 'backup', 'update']

    modules.forEach(module => {
      it(`should have ${module} module in zh-CN`, () => {
        expect(zhCN[module as keyof typeof zhCN]).toBeDefined()
      })

      it(`should have ${module} module in en-US`, () => {
        expect(enUS[module as keyof typeof enUS]).toBeDefined()
      })
    })
  })
})
