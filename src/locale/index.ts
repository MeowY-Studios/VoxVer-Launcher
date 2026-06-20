export { default as zhCN } from './zh-CN'
export { default as enUS } from './en-US'

export type LocaleKey = 'zh-CN' | 'en-US'

export interface LocaleMessages {
  common: Record<string, string>
  auth: Record<string, string>
  game: Record<string, string>
  mod: Record<string, string>
  instance: Record<string, string>
  download: Record<string, string>
  settings: Record<string, string>
  backup: Record<string, string>
  update: Record<string, string>
}

export const locales: Record<LocaleKey, LocaleMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS
}

export const localeNames: Record<LocaleKey, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English'
}
