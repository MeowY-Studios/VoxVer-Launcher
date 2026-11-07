/**
 * 启动画面窗口（Splash Window）
 *
 * 在应用启动的最早期创建，先于主窗口显示，遮住渲染进程冷启动的那段空白；
 * 主窗口 `ready-to-show` 之后由 main.ts 调用 finishSplash() 播放退场动画并销毁。
 *
 * 设计约定：
 * - 无边框 + 透明 + 不可交互（不抢焦点），仅作视觉过渡；
 * - 不挂 preload、不开 node，纯静态 HTML（splash.html），避免拖慢启动；
 * - 最短展示时长由 SPLASH_MIN_VISIBLE_MS 控制，手感上不会“一闪而过”。
 */
import { BrowserWindow } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

/** 启动画面窗口标题：main.ts 用它跳过全局 F12 调试快捷键 */
export const SPLASH_TITLE = 'VoxVer Splash'

/**
 * 启动画面最短展示时长（毫秒）：主窗口就绪太快时也不至于一闪而过。
 * 可用 VOXVER_SPLASH_MIN_MS 环境变量覆盖，便于排查启动闪烁问题。
 */
export const SPLASH_MIN_VISIBLE_MS = ((): number => {
  const override = Number(process.env['VOXVER_SPLASH_MIN_MS'])
  return Number.isFinite(override) && override >= 0 ? override : 7000
})()

/** 退场动画时长（毫秒），需与 splash.html 里 __voxSplashExit 的动画时长一致 */
const EXIT_ANIMATION_MS = 260

/** 启动画面尺寸：与 splash.html 中 .splash 的 440×272 保持一致 */
const SPLASH_WIDTH = 440
const SPLASH_HEIGHT = 272

/**
 * 解析 splash.html 的加载目标（与主窗口的 dev/prod 路径约定保持一致）
 *
 * dev：electron-vite 的 dev server（ELECTRON_RENDERER_URL）或 out/renderer
 * prod：resources/renderer/splash.html（electron-builder 把 out/renderer 拷到 resources/renderer）
 */
function resolveSplashTarget(): { url?: string; file?: string } {
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (process.env.NODE_ENV === 'development' && devUrl) {
    return { url: `${devUrl}/splash.html` }
  }

  const resPath =
    process.env.NODE_ENV === 'development'
      ? join(__dirname, '..', 'renderer')
      : process.resourcesPath
  const filePath =
    process.env.NODE_ENV === 'development'
      ? join(resPath, 'splash.html')
      : join(resPath, 'renderer', 'splash.html')

  if (!existsSync(filePath)) return {}
  return { file: filePath }
}

/**
 * 创建启动画面窗口；创建失败（或被禁用）时返回 null，调用方需按“没有启动画面”继续启动。
 */
export function createSplashWindow(version: string): BrowserWindow | null {
  const target = resolveSplashTarget()
  if (!target.url && !target.file) return null

  try {
    const splash = new BrowserWindow({
      width: SPLASH_WIDTH,
      height: SPLASH_HEIGHT,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      // 不抢焦点：启动画面只是过场，用户此时可能正在输入框里敲别的
      focusable: false,
      show: false,
      hasShadow: false,
      backgroundColor: '#00000000',
      title: SPLASH_TITLE,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        // 窗口不可聚焦时 Chromium 会降频，这里关掉以保证动画流畅
        backgroundThrottling: false
      }
    })

    splash.setMenuBarVisibility(false)
    if (process.platform === 'win32') splash.setSkipTaskbar(true)

    splash.once('ready-to-show', () => {
      if (!splash.isDestroyed()) {
        splash.showInactive()
        splash.moveTop()
      }
    })

    // 兜底：某些环境 ready-to-show 可能不触发，150ms 后直接显示，宁可早点出现
    setTimeout(() => {
      if (!splash.isDestroyed() && !splash.isVisible()) splash.showInactive()
    }, 150)

    splash.on('closed', () => {
      // 窗口已销毁，无需额外处理；保留监听便于未来做资源回收
    })

    if (target.url) {
      void splash.loadURL(`${target.url}?v=${encodeURIComponent(version)}`)
    } else if (target.file) {
      void splash.loadFile(target.file, { query: { v: version } })
    }

    return splash
  } catch {
    return null
  }
}

/**
 * 播放退场动画并销毁启动画面。
 *
 * 顺序很关键：主窗口先 show()，再销毁启动画面——两个窗口之间不会出现
 * “零窗口”的空档，避免触发 window-all-closed 的退出逻辑。
 */
export function finishSplash(splash: BrowserWindow | null): void {
  if (!splash || splash.isDestroyed()) return

  let destroyed = false
  const destroy = (): void => {
    if (destroyed) return
    destroyed = true
    if (!splash.isDestroyed()) splash.destroy()
  }

  // 页面内播放 240ms 的缩放淡出；即使脚本执行失败也要按时销毁
  try {
    void splash.webContents
      .executeJavaScript('window.__voxSplashExit && window.__voxSplashExit()', true)
      .catch(() => undefined)
  } catch {
    // 窗口可能在执行前就被销毁，忽略
  }

  setTimeout(destroy, EXIT_ANIMATION_MS)
}
