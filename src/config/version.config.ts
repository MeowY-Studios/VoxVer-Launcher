import { $t } from '../utils/i18n'

export interface VersionInfo {
  id: string
  description: string
  featured?: boolean
}

export interface VersionTypeColors {
  release: string
  snapshot: string
  old_alpha: string
  old_beta: string
  april: string
}

export const versionTypeColors: VersionTypeColors = {
  release: '#4CAF50',
  snapshot: '#FF9800',
  old_alpha: '#78909C',
  old_beta: '#78909C',
  april: '#E91E63'
}

export const featuredVersions: string[] = [
  '1.21.4',
  '1.21.3',
  '1.20.4',
  '1.20.1',
  '1.19.2',
  '1.18.2',
  '1.16.5',
  '1.12.2'
]

export function isFeaturedVersion(id: string, type: string): boolean {
  return type === 'release' && featuredVersions.includes(id)
}

export function getVersionDesc(id: string): string {
  return $t(`version.descriptions.${id}`) || ''
}

export function getVersionTypeColor(type: string): string {
  return versionTypeColors[type as keyof VersionTypeColors] || '#4CAF50'
}
