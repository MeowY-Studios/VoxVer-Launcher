import { describe, it, expect, beforeEach } from 'vitest'
import { locales, localeNames, type LocaleKey, type LocaleMessages } from '../src/locale'
import zhCN from '../src/locale/zh-CN'
import enUS from '../src/locale/en-US'

describe('locale index', () => {
  it('should export both locales', () => {
    expect(locales['zh-CN']).toBeDefined()
    expect(locales['en-US']).toBeDefined()
  })

  it('should have correct locale names', () => {
    expect(localeNames['zh-CN']).toBe('简体中文')
    expect(localeNames['en-US']).toBe('English')
  })

  it('should have all required message modules', () => {
    const requiredModules: (keyof LocaleMessages)[] = [
      'common',
      'home',
      'tabs',
      'auth',
      'game',
      'mod',
      'instance',
      'download',
      'settings',
      'backup',
      'update',
      'component'
    ]

    requiredModules.forEach(module => {
      expect(locales['zh-CN'][module]).toBeDefined()
      expect(locales['en-US'][module]).toBeDefined()
    })
  })

  it('should match exported zhCN with locales', () => {
    expect(locales['zh-CN']).toEqual(zhCN)
  })

  it('should match exported enUS with locales', () => {
    expect(locales['en-US']).toEqual(enUS)
  })
})

describe('translation key consistency', () => {
  const allModules: (keyof LocaleMessages)[] = [
    'common',
    'home',
    'tabs',
    'auth',
    'game',
    'mod',
    'instance',
    'download',
    'settings',
    'backup',
    'update',
    'component'
  ]

  allModules.forEach(module => {
    describe(`${module} module`, () => {
      it('should have same keys in both locales', () => {
        const zhKeys = Object.keys(locales['zh-CN'][module] || {})
        const enKeys = Object.keys(locales['en-US'][module] || {})

        const zhOnly = zhKeys.filter(k => !enKeys.includes(k))
        const enOnly = enKeys.filter(k => !zhKeys.includes(k))

        expect(zhOnly).toEqual([])
        expect(enOnly).toEqual([])
      })
    })
  })
})

describe('LocaleKey type', () => {
  it('should only allow valid locale keys', () => {
    const validKeys: LocaleKey[] = ['zh-CN', 'en-US']
    expect(validKeys.length).toBe(2)
  })
})
