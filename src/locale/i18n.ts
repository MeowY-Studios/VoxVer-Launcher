import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'
import type { LocaleKey } from './index'

const savedLocale = localStorage.getItem('mcla-language') as LocaleKey || 'zh-CN'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export function setLocale(locale: LocaleKey): void {
  i18n.global.locale.value = locale
  localStorage.setItem('mcla-language', locale)
}

export function getCurrentLocale(): LocaleKey {
  return i18n.global.locale.value as LocaleKey
}

export function getLocaleName(locale: LocaleKey): string {
  const names: Record<LocaleKey, string> = {
    'zh-CN': '简体中文',
    'en-US': 'English'
  }
  return names[locale]
}

export const localeNames: Record<LocaleKey, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English'
}

export default i18n