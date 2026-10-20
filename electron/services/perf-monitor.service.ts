/**
 * VoxVer Launcher - 游戏性能监控服务
 * 监控 Minecraft 进程的 CPU、内存使用情况，通过 IPC 推送到渲染进程
 */
import { exec } from 'child_process'
import { logger } from '../utils/logger'

const log = logger.child('PerfMonitor')

export interface PerfSnapshot {
  pid: number
  alive: boolean
  cpu: number       // CPU 使用率百分比
  memoryMB: number  // 内存占用 (MB)
  uptimeMs: number  // 运行时长 (ms)
  timestamp: number
}

let monitorInterval: ReturnType<typeof setInterval> | null = null
let monitoredPid: number | null = null
let startTime: number = 0
// 上次采样的累计 CPU 秒数与时间戳，用于计算采样区间内的 CPU 利用率
let lastCpuSeconds: number | null = null
let lastSampleAt = 0

/** 原始采样数据：cpuSeconds 为进程启动至今的累计 CPU 时间（秒） */
interface RawPerf {
  cpuSeconds: number
  memoryBytes: number
}

/**
 * 解析 Windows `Get-Process` 输出
 */
function parseWindowsPerf(pid: number): Promise<RawPerf> {
  return new Promise((resolve) => {
    // WorkingSet 是 Int32，超过 2GB 会溢出为负数，必须用 WorkingSet64
    const cmd = `powershell -NoProfile -Command "Get-Process -Id ${pid} -ErrorAction SilentlyContinue | Select-Object CPU,WorkingSet64 | ConvertTo-Json"`
    exec(cmd, { timeout: 3000 }, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve({ cpuSeconds: 0, memoryBytes: 0 })
        return
      }
      try {
        const data = JSON.parse(stdout.trim())
        resolve({
          cpuSeconds: data.CPU || 0,
          memoryBytes: data.WorkingSet64 || 0
        })
      } catch {
        resolve({ cpuSeconds: 0, memoryBytes: 0 })
      }
    })
  })
}

/**
 * 解析 CPU 累计时间 [[dd-]hh:]mm:ss 为秒数
 */
function parseCpuTimeToSeconds(raw: string): number {
  const segs = raw.trim().replace('-', ':').split(':').map((s) => parseFloat(s) || 0)
  // 长度 2: mm:ss / 3: hh:mm:ss / 4: dd:hh:mm:ss
  if (segs.length >= 4) return segs[0] * 86400 + segs[1] * 3600 + segs[2] * 60 + segs[3]
  if (segs.length === 3) return segs[0] * 3600 + segs[1] * 60 + segs[2]
  return segs[0] * 60 + (segs[1] || 0)
}

/**
 * 解析 Unix `ps` 输出
 */
function parseUnixPerf(pid: number): Promise<RawPerf> {
  return new Promise((resolve) => {
    exec(`ps -p ${pid} -o time=,rss= 2>/dev/null`, { timeout: 3000 }, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve({ cpuSeconds: 0, memoryBytes: 0 })
        return
      }
      try {
        const parts = stdout.trim().split(/\s+/)
        const cpuSeconds = parseCpuTimeToSeconds(parts[0] || '0')
        const rssKB = parseFloat(parts[1]) || 0
        resolve({ cpuSeconds, memoryBytes: rssKB * 1024 })
      } catch {
        resolve({ cpuSeconds: 0, memoryBytes: 0 })
      }
    })
  })
}

/**
 * 获取进程性能数据
 */
async function getPerfSnapshot(pid: number): Promise<PerfSnapshot> {
  try {
    // 先检查进程是否存活
    try {
      process.kill(pid, 0) // Signal 0 just checks if process exists
    } catch {
      return {
        pid,
        alive: false,
        cpu: 0,
        memoryMB: 0,
        uptimeMs: Date.now() - startTime,
        timestamp: Date.now()
      }
    }

    const isWindows = process.platform === 'win32'
    const perf = isWindows
      ? await parseWindowsPerf(pid)
      : await parseUnixPerf(pid)

    // CPU 利用率 = 采样区间内累计 CPU 时间增量 / 墙钟时间 × 100%
    // （多核进程可超过 100%；首次采样无基准，记 0）
    const now = Date.now()
    let cpuPercent = 0
    if (lastCpuSeconds !== null && now > lastSampleAt) {
      const elapsedSec = (now - lastSampleAt) / 1000
      const deltaSec = Math.max(0, perf.cpuSeconds - lastCpuSeconds)
      cpuPercent = (deltaSec / elapsedSec) * 100
    }
    lastCpuSeconds = perf.cpuSeconds
    lastSampleAt = now

    return {
      pid,
      alive: true,
      cpu: Math.round(cpuPercent * 10) / 10,
      memoryMB: Math.round((perf.memoryBytes / (1024 * 1024)) * 10) / 10,
      uptimeMs: now - startTime,
      timestamp: now
    }
  } catch {
    return {
      pid,
      alive: false,
      cpu: 0,
      memoryMB: 0,
      uptimeMs: Date.now() - startTime,
      timestamp: Date.now()
    }
  }
}

/**
 * 开始监控指定 PID 的游戏进程
 */
export function startMonitor(
  pid: number,
  onSnapshot: (snap: PerfSnapshot) => void,
  intervalMs = 2000
): void {
  stopMonitor()

  monitoredPid = pid
  startTime = Date.now()
  log.info(`[start] pid=${pid}, interval=${intervalMs}ms`)

  // 立即发送一次
  getPerfSnapshot(pid).then(onSnapshot)

  monitorInterval = setInterval(async () => {
    const snap = await getPerfSnapshot(pid)
    onSnapshot(snap)

    // 进程已退出则停止监控
    if (!snap.alive) {
      stopMonitor()
    }
  }, intervalMs)
}

/**
 * 停止性能监控
 */
export function stopMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval)
    monitorInterval = null
    log.info('[stop] monitor stopped')
  }
  monitoredPid = null
  startTime = 0
  lastCpuSeconds = null
  lastSampleAt = 0
}

/**
 * 获取当前监控状态
 */
export function getMonitorStatus(): { active: boolean; pid: number | null } {
  return {
    active: monitorInterval !== null,
    pid: monitoredPid
  }
}
