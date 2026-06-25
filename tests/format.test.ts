import { describe, it, expect } from 'vitest'
import {
  formatFileSize,
  formatRelativeTime,
  formatDate,
  formatDuration,
  formatNumber,
  formatPercent,
  formatSpeed,
  formatVersion,
  getLoaderName,
  LOADER_NAMES
} from '../src/utils/format'

describe('formatFileSize', () => {
  it('should return "0 B" for 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('should return "-" for invalid input', () => {
    expect(formatFileSize(NaN)).toBe('-')
    expect(formatFileSize(null as any)).toBe('-')
    expect(formatFileSize(undefined as any)).toBe('-')
  })

  it('should format bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(1024 * 1024 * 10)).toBe('10 MB')
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB')
    expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB')
  })

  it('should show 1 decimal for sizes < 10', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(9 * 1024)).toBe('9.0 KB')
  })

  it('should show integer for sizes >= 10', () => {
    expect(formatFileSize(10 * 1024)).toBe('10 KB')
    expect(formatFileSize(100 * 1024)).toBe('100 KB')
  })
})

describe('formatRelativeTime', () => {
  it('should show "刚刚" for less than 60 seconds', () => {
    const now = new Date()
    const dateStr = new Date(now.getTime() - 30 * 1000).toISOString()
    expect(formatRelativeTime(dateStr)).toBe('刚刚')
  })

  it('should show minutes for less than 60 minutes', () => {
    const now = new Date()
    const dateStr = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    expect(formatRelativeTime(dateStr)).toBe('5分钟前')
  })

  it('should show hours for less than 24 hours', () => {
    const now = new Date()
    const dateStr = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(dateStr)).toBe('3小时前')
  })

  it('should show days for less than 7 days', () => {
    const now = new Date()
    const dateStr = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(dateStr)).toBe('2天前')
  })

  it('should show weeks for less than 30 days', () => {
    const now = new Date()
    const dateStr = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(dateStr)).toBe('2周前')
  })

  it('should show months for less than 365 days', () => {
    const now = new Date()
    const dateStr = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(dateStr)).toBe('3个月前')
  })

  it('should show years for 365 days or more', () => {
    const now = new Date()
    const dateStr = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(dateStr)).toBe('1年前')
  })
})

describe('formatDate', () => {
  it('should return "-" for invalid date', () => {
    expect(formatDate('invalid-date')).toBe('-')
  })

  it('should format short date', () => {
    const result = formatDate('2024-01-15T10:30:00Z', 'short')
    expect(result).toMatch(/\d{2}\/\d{2}/)
  })

  it('should format long date', () => {
    const result = formatDate('2024-01-15T10:30:00Z', 'long')
    expect(result).toMatch(/2024/)
  })

  it('should format full date with time', () => {
    const result = formatDate('2024-01-15T10:30:00Z', 'full')
    expect(result).toMatch(/2024/)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('formatDuration', () => {
  it('should return "0s" for 0 or negative seconds', () => {
    expect(formatDuration(0)).toBe('0s')
    expect(formatDuration(-10)).toBe('0s')
  })

  it('should format seconds only', () => {
    expect(formatDuration(45)).toBe('45s')
  })

  it('should format minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s')
  })

  it('should format hours and minutes', () => {
    expect(formatDuration(7500)).toBe('2h 5m')
  })

  it('should format hours only when minutes is 0', () => {
    expect(formatDuration(3600)).toBe('1h')
  })
})

describe('formatNumber', () => {
  it('should return "0" for 0 or falsy values', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(null as any)).toBe('0')
    expect(formatNumber(undefined as any)).toBe('0')
  })

  it('should format thousands with commas', () => {
    expect(formatNumber(123)).toBe('123')
    expect(formatNumber(1234)).toBe('1,234')
    expect(formatNumber(9999)).toBe('9,999')
  })

  it('should format 10K+ with K suffix', () => {
    expect(formatNumber(10000)).toBe('10.0K')
    expect(formatNumber(15000)).toBe('15.0K')
    expect(formatNumber(999999)).toBe('1000.0K')
  })

  it('should format 1M+ with M suffix', () => {
    expect(formatNumber(1000000)).toBe('1.0M')
    expect(formatNumber(1500000)).toBe('1.5M')
  })
})

describe('formatPercent', () => {
  it('should return "0%" for zero total', () => {
    expect(formatPercent(50, 0)).toBe('0%')
    expect(formatPercent(50, null as any)).toBe('0%')
  })

  it('should calculate percentage correctly', () => {
    expect(formatPercent(50, 100)).toBe('50%')
    expect(formatPercent(25, 100)).toBe('25%')
    expect(formatPercent(1, 3)).toBe('33%')
  })
})

describe('formatSpeed', () => {
  it('should format speed with /s suffix', () => {
    expect(formatSpeed(0)).toBe('0 B/s')
    expect(formatSpeed(1024)).toBe('1.0 KB/s')
    expect(formatSpeed(1024 * 1024)).toBe('1.0 MB/s')
  })
})

describe('formatVersion', () => {
  it('should return mcVersion only for vanilla', () => {
    expect(formatVersion('1.20.1')).toBe('1.20.1')
    expect(formatVersion('1.20.1', 'vanilla')).toBe('1.20.1')
  })

  it('should include loader type', () => {
    expect(formatVersion('1.20.1', 'fabric')).toBe('1.20.1 fabric')
  })

  it('should include loader type and version', () => {
    expect(formatVersion('1.20.1', 'fabric', '0.15.0')).toBe('1.20.1 fabric 0.15.0')
  })
})

describe('getLoaderName', () => {
  it('should return Chinese name for known loaders', () => {
    expect(getLoaderName('vanilla')).toBe('原版')
    expect(getLoaderName('fabric')).toBe('Fabric')
    expect(getLoaderName('forge')).toBe('Forge')
    expect(getLoaderName('neoforge')).toBe('NeoForge')
    expect(getLoaderName('quilt')).toBe('Quilt')
  })

  it('should return the input for unknown loaders', () => {
    expect(getLoaderName('unknown-loader')).toBe('unknown-loader')
  })

  it('should have all expected loader names in LOADER_NAMES', () => {
    expect(LOADER_NAMES.vanilla).toBe('原版')
    expect(LOADER_NAMES.fabric).toBe('Fabric')
    expect(LOADER_NAMES.forge).toBe('Forge')
    expect(LOADER_NAMES.neoforge).toBe('NeoForge')
    expect(LOADER_NAMES.quilt).toBe('Quilt')
  })
})
