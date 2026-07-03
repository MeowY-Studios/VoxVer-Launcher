/**
 * Format 工具函数测试
 * 覆盖：formatFileSize, formatRelativeTime, formatDate, formatDuration,
 *       formatNumber, formatPercent, formatSpeed, formatVersion, getLoaderName
 */
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
} from '../../src/utils/format'

// ====== formatFileSize ======

describe('formatFileSize', () => {
  it('0 字节 → "0 B"', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('非法输入 → "-"', () => {
    expect(formatFileSize(NaN)).toBe('-')
    expect(formatFileSize(null as any)).toBe('-')
    expect(formatFileSize(undefined as any)).toBe('-')
  })

  it('字节范围', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(1023)).toBe('1023 B')
  })

  it('KB 范围（< 10 → 1 位小数）', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(9 * 1024)).toBe('9.0 KB')
  })

  it('KB 范围（>= 10 → 整数）', () => {
    expect(formatFileSize(10 * 1024)).toBe('10 KB')
    expect(formatFileSize(100 * 1024)).toBe('100 KB')
    expect(formatFileSize(999 * 1024)).toBe('999 KB')
  })

  it('MB 范围', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB')
    expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB')
  })

  it('GB 范围', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB')
  })

  it('TB 范围', () => {
    expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB')
  })
})

// ====== formatRelativeTime ======

describe('formatRelativeTime', () => {
  it('< 60 秒 → "刚刚"', () => {
    const t = new Date(Date.now() - 30 * 1000).toISOString()
    expect(formatRelativeTime(t)).toBe('刚刚')
  })

  it('< 60 分钟 → X分钟前', () => {
    const t = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(formatRelativeTime(t)).toBe('5分钟前')
  })

  it('< 24 小时 → X小时前', () => {
    const t = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(t)).toBe('3小时前')
  })

  it('< 7 天 → X天前', () => {
    const t = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(t)).toBe('2天前')
  })

  it('< 30 天 → X周前', () => {
    const t = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(t)).toBe('2周前')
  })

  it('< 365 天 → X个月前', () => {
    const t = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(t)).toBe('3个月前')
  })

  it('>= 365 天 → X年前', () => {
    const t = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(t)).toBe('1年前')
  })
})

// ====== formatDate ======

describe('formatDate', () => {
  it('非法日期 → "-"', () => {
    expect(formatDate('invalid')).toBe('-')
  })

  it('short 格式 → MM/DD', () => {
    const r = formatDate('2024-01-15T10:30:00Z', 'short')
    expect(r).toMatch(/\d{2}\/\d{2}/)
  })

  it('long 格式 → 含年份', () => {
    const r = formatDate('2024-01-15T10:30:00Z', 'long')
    expect(r).toMatch(/2024/)
  })

  it('full 格式 → 含时分', () => {
    const r = formatDate('2024-01-15T10:30:00Z', 'full')
    expect(r).toMatch(/\d{2}:\d{2}/)
  })

  it('默认 short 格式', () => {
    const r = formatDate('2024-06-01T00:00:00Z')
    expect(r).toMatch(/\d{2}\/\d{2}/)
  })
})

// ====== formatDuration ======

describe('formatDuration', () => {
  it('<= 0 → "0s"', () => {
    expect(formatDuration(0)).toBe('0s')
    expect(formatDuration(-1)).toBe('0s')
  })

  it('仅秒', () => {
    expect(formatDuration(45)).toBe('45s')
  })

  it('分 + 秒', () => {
    expect(formatDuration(125)).toBe('2m 5s')
  })

  it('时 + 分', () => {
    expect(formatDuration(7500)).toBe('2h 5m')
  })

  it('整小时 → 仅 h', () => {
    expect(formatDuration(3600)).toBe('1h')
  })

  it('整分钟 → 仅 m', () => {
    expect(formatDuration(120)).toBe('2m')
  })
})

// ====== formatNumber ======

describe('formatNumber', () => {
  it('0 或 falsy → "0"', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(null as any)).toBe('0')
    expect(formatNumber(undefined as any)).toBe('0')
  })

  it('< 10000 → 千分位格式', () => {
    expect(formatNumber(123)).toBe('123')
    expect(formatNumber(1000)).toBe('1,000')
    expect(formatNumber(9999)).toBe('9,999')
  })

  it('>= 10000 → K 后缀', () => {
    expect(formatNumber(10000)).toBe('10.0K')
    expect(formatNumber(15000)).toBe('15.0K')
    expect(formatNumber(999999)).toBe('1000.0K')
  })

  it('>= 1000000 → M 后缀', () => {
    expect(formatNumber(1000000)).toBe('1.0M')
    expect(formatNumber(1500000)).toBe('1.5M')
  })
})

// ====== formatPercent ======

describe('formatPercent', () => {
  it('分母为 0 → "0%"', () => {
    expect(formatPercent(50, 0)).toBe('0%')
    expect(formatPercent(50, null as any)).toBe('0%')
  })

  it('正常百分比', () => {
    expect(formatPercent(50, 100)).toBe('50%')
    expect(formatPercent(1, 3)).toBe('33%')
    expect(formatPercent(3, 3)).toBe('100%')
  })
})

// ====== formatSpeed ======

describe('formatSpeed', () => {
  it('0 → "0 B/s"', () => {
    expect(formatSpeed(0)).toBe('0 B/s')
  })

  it('KB/s', () => {
    expect(formatSpeed(1024)).toBe('1.0 KB/s')
  })

  it('MB/s', () => {
    expect(formatSpeed(1024 * 1024)).toBe('1.0 MB/s')
  })
})

// ====== formatVersion ======

describe('formatVersion', () => {
  it('纯版本号（无 loader）', () => {
    expect(formatVersion('1.20.1')).toBe('1.20.1')
  })

  it('vanilla → 仅版本号', () => {
    expect(formatVersion('1.20.1', 'vanilla')).toBe('1.20.1')
  })

  it('含 loader 类型', () => {
    expect(formatVersion('1.20.1', 'fabric')).toBe('1.20.1 fabric')
  })

  it('含 loader 类型 + 版本', () => {
    expect(formatVersion('1.20.1', 'forge', '47.1.0')).toBe('1.20.1 forge 47.1.0')
  })
})

// ====== getLoaderName / LOADER_NAMES ======

describe('getLoaderName / LOADER_NAMES', () => {
  it('已知 loader → 中文名', () => {
    expect(getLoaderName('vanilla')).toBe('原版')
    expect(getLoaderName('fabric')).toBe('Fabric')
    expect(getLoaderName('forge')).toBe('Forge')
    expect(getLoaderName('neoforge')).toBe('NeoForge')
    expect(getLoaderName('quilt')).toBe('Quilt')
  })

  it('未知 loader → 原文返回', () => {
    expect(getLoaderName('unknown')).toBe('unknown')
  })

  it('LOADER_NAMES 应有全部 5 个条目', () => {
    expect(Object.keys(LOADER_NAMES)).toHaveLength(5)
    expect(LOADER_NAMES.vanilla).toBe('原版')
    expect(LOADER_NAMES.fabric).toBe('Fabric')
    expect(LOADER_NAMES.forge).toBe('Forge')
    expect(LOADER_NAMES.neoforge).toBe('NeoForge')
    expect(LOADER_NAMES.quilt).toBe('Quilt')
  })
})
