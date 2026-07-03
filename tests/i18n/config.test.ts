/**
 * i18n 配置测试
 * 覆盖：setLocale, getCurrentLocale, getLocaleName, localeNames
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  setLocale,
  getCurrentLocale,
  getLocaleName,
  localeNames
} from '../../src/locale/i18n'

beforeEach(() => {
  // 重置 locale 为 zh-CN
  setLocale('zh-CN')
})

describe('i18n config - setLocale', () => {
  it('应设置语言为 en-US', () => {
    setLocale('en-US')
    expect(getCurrentLocale()).toBe('en-US')
    expect(localStorage.getItem('voxver-language')).toBe('en-US')
  })

  it('应设置语言为 zh-CN', () => {
    setLocale('en-US')
    setLocale('zh-CN')
    expect(getCurrentLocale()).toBe('zh-CN')
    expect(localStorage.getItem('voxver-language')).toBe('zh-CN')
  })
})

describe('i18n config - getCurrentLocale', () => {
  it('默认应为 zh-CN', () => {
    expect(getCurrentLocale()).toBe('zh-CN')
  })
})

describe('i18n config - getLocaleName', () => {
  it('zh-CN → 简体中文', () => {
    expect(getLocaleName('zh-CN')).toBe('简体中文')
  })

  it('en-US → English', () => {
    expect(getLocaleName('en-US')).toBe('English')
  })
})

describe('i18n config - localeNames', () => {
  it('应有 2 个语言条目', () => {
    expect(Object.keys(localeNames)).toHaveLength(2)
  })

  it('zh-CN → 简体中文', () => {
    expect(localeNames['zh-CN']).toBe('简体中文')
  })

  it('en-US → English', () => {
    expect(localeNames['en-US']).toBe('English')
  })
})
