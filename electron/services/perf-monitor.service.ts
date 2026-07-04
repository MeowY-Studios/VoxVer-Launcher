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

/**
 * 解析 Windows `Get-Process` 输出
 */
function parseWindowsPerf(pid: number): Promise<{ cpu: number; memoryBytes: number }> {
  return new Promise((resolve) => {
    const cmd = `powershell -NoProfile -Command "Get-Process -Id ${pid} -ErrorAction SilentlyContinue | Select-Object CPU,WorkingSet | ConvertTo-Json"`
    exec(cmd, { timeout: 3000 }, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve({ cpu: 0, memoryBytes: 0 })
        return
      }
      try {
        const data = JSON.parse(stdout.trim())
        // CPU is in seconds, convert to percentage using elapsed time
        resolve({
          cpu: data.CPU || 0,
          memoryBytes: data.WorkingSet || 0
        })
      } catch {
        resolve({ cpu: 0, memoryBytes: 0 })
      }
    })
  })
}

/**
 * 解析 Unix `ps` 输出
 */
function parseUnixPerf(pid: number): Promise<{ cpu: number; memoryBytes: number }> {
  return new Promise((resolve) => {
    exec(`ps -p ${pid} -o %cpu=,rss= 2>/dev/null`, { timeout: 3000 }, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve({ cpu: 0, memoryBytes: 0 })
        return
      }
      try {
        const parts = stdout.trim().split(/\s+/)
        const cpu = parseFloat(parts[0]) || 0
        const rssKB = parseFloat(parts[1]) || 0
        resolve({ cpu, memoryBytes: rssKB * 1024 })
      } catch {
        resolve({ cpu: 0, memoryBytes: 0 })
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

    return {
      pid,
      alive: true,
      cpu: Math.round(perf.cpu * 10) / 10,
      memoryMB: Math.round((perf.memoryBytes / (1024 * 1024)) * 10) / 10,
      uptimeMs: Date.now() - startTime,
      timestamp: Date.now()
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
