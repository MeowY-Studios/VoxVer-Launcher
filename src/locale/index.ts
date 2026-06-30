import enUS from './en-US'
import zhCN from './zh-CN'

export { default as zhCN } from './zh-CN'
export { default as enUS } from './en-US'

export type LocaleKey = 'zh-CN' | 'en-US'

type LocaleValue = string | { [key: string]: LocaleValue } | LocaleValue[]

export interface LocaleMessages {
  common: Record<string, LocaleValue>
  home: Record<string, LocaleValue>
  tabs: Record<string, LocaleValue>
  auth: Record<string, LocaleValue>
  game: Record<string, LocaleValue>
  mod: Record<string, LocaleValue>
  instance: Record<string, LocaleValue>
  download: Record<string, LocaleValue>
  settings: Record<string, LocaleValue>
  backup: Record<string, LocaleValue>
  update: Record<string, LocaleValue>
  component: Record<string, LocaleValue>
}

export const locales: Record<LocaleKey, LocaleMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS
}

export const localeNames: Record<LocaleKey, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English'
}
