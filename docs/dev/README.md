# 开发指南

> 面向开发者，涵盖技术栈、项目结构、快速启动、数据库选型、认证流程等。

---

## 快速开始

### 前置要求

- Node.js 20+
- npm 10+
- Windows 10+（当前仅支持 Windows）

### 克隆与安装

```bash
git clone https://github.com/nnkmn/VoxVer-Launcher.git
cd VoxVer-Launcher
npm install
```

### 环境配置

如需使用 CurseForge API，请在项目根目录创建 `.env` 文件：

```env
CURSEFORGE_API_KEY=your_api_key_here
```

申请地址：https://console.curseforge.com/#/api-keys

### 开发模式

```bash
npm run dev
```

### 构建安装包

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

> 安装包输出在 `build/` 目录。Windows 产物为 NSIS 安装程序（`VoxVer Launcher Setup x.x.x.exe`）。

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | 33.4.11 |
| 前端框架 | Vue 3 + Composition API | 3.5.0 |
| 构建工具 | Vite + electron-vite | 5.4.21 / 2.3.0 |
| 语言 | TypeScript | 5.5.0 |
| UI 样式 | SCSS + CSS Variables | 像素风设计系统 |
| 状态管理 | Pinia | 2.2.0 |
| 路由 | Vue Router | 4.4.0 |
| 数据库 | better-sqlite3 | 11.0.0 |
| 日志 | electron-log | 5.0.0 |
| 图标 | Iconify Vue + unplugin-icons | 5.0.0 / 23.0.1 |

---

## 项目结构

```
VoxVer-Launcher/
├── electron/                      # Electron 主进程
│   ├── main.ts                    # 主进程入口
│   ├── preload.ts                 # 预加载脚本（IPC 桥接，30+ 通道）
│   ├── adapters/                  # 平台适配器（接口 + Minecraft 实现 + 注册中心）
│   ├── ipc/                      # IPC 处理器（20+ 个模块）
│   │   ├── account.ipc.ts        # 账户认证
│   │   ├── config.ipc.ts         # 配置读写
│   │   ├── content.ipc.ts        # 内容服务（皮肤等）
│   │   ├── crash.ipc.ts          # 崩溃监控
│   │   ├── dialog.ipc.ts         # 系统对话框
│   │   ├── download.ipc.ts       # 下载管理
│   │   ├── game.ipc.ts           # 游戏启动
│   │   ├── instance.ipc.ts      # 实例管理
│   │   ├── java.ipc.ts           # Java 管理
│   │   ├── mod.ipc.ts            # Mod 管理 + 更新检测
│   │   ├── modloader.ipc.ts     # ModLoader 安装
│   │   ├── share.ipc.ts          # P2P 实例分享
│   │   ├── modpack.ipc.ts        # 整合包管理
│   │   ├── hotkey.ipc.ts         # 全局快捷键
│   │   ├── theme.ipc.ts          # 主题管理
│   │   ├── backup.ipc.ts         # 备份与迁移
│   │   ├── updater.ipc.ts        # 自动更新
│   │   ├── notification.ipc.ts   # 通知系统
│   │   └── window.ipc.ts         # 窗口控制
│   ├── services/                 # 业务服务层（15+ 模块）
│   │   ├── microsoft.auth.ts     # 微软 OAuth Device Code Flow
│   │   ├── accounts.ts           # 账户存储与切换
│   │   ├── versions.ts           # BMCLAPI 版本列表
│   │   ├── modloader.service.ts  # ModLoader 安装（Fabric/Forge/NeoForge/Quilt）
│   │   ├── curseforge.service.ts # CurseForge API
│   │   ├── modrinth.service.ts   # Modrinth API
│   │   ├── mod.service.ts        # Mod 管理 + 自动更新
│   │   ├── skin.service.ts       # 皮肤缓存
│   │   ├── crash.service.ts      # 崩溃捕获与分析
│   │   ├── game.launcher.service.ts # 游戏启动核心（JVM 参数、类路径、natives、文件校验、多源下载）
│   │   ├── java.management.service.ts # Java 探测与版本推荐
│   │   ├── launch.config.service.ts  # 启动配置管理
│   │   ├── instances.ts          # 实例 CRUD
│   │   ├── instance.export.ts    # 实例导出（.mcla 格式）
│   │   ├── database.ts           # SQLite 数据库
│   │   ├── download.service.ts   # 下载队列
│   │   ├── content.service.ts    # 内容聚合服务（Mod/整合包/资源包）
│   │   ├── backup.service.ts     # 配置备份与迁移
│   │   ├── hotkey.service.ts     # 全局快捷键
│   │   ├── theme.service.ts      # 主题管理
│   │   └── watcher.service.ts    # 进程监控
│   ├── types/                    # TypeScript 类型定义
│   │   ├── ipc.types.ts         # 30+ IPC 通道类型映射
│   │   ├── database.types.ts    # 6 张表 Row 类型 + DDL
│   │   └── modloader.types.ts   # ModLoader 类型
│   └── utils/                   # 工具函数
│       ├── logger.ts            # 分级日志
│       ├── crypto.ts            # safeStorage 加解密
│       ├── hash.ts              # SHA1/MD5 文件哈希
│       └── platform.ts          # 跨平台 Java 探测
├── src/                          # 渲染进程（Vue）
│   ├── main.ts                  # Vue 入口
│   ├── App.vue                  # 根组件（侧边栏 + 内容区 + 全局组件）
│   ├── router/                  # 路由配置
│   ├── stores/                  # Pinia 状态管理
│   ├── pages/                   # 页面（10+ 个）
│   │   ├── HomePage.vue         # 首页
│   │   ├── AccountPage.vue      # 账户登录与管理
│   │   ├── LaunchPage.vue       # 游戏启动（版本选择 + 启动按钮）
│   │   ├── InstancesPage.vue     # 实例列表
│   │   ├── InstanceDetail.vue   # 实例详情（Mod 管理 + 配置）
│   │   ├── VersionDetail.vue    # 版本详情（Mod 管理 + 导出 + 启动设置）
│   │   ├── VersionsPage.vue     # 版本浏览与安装
│   │   ├── DownloadsPage.vue     # Mod/整合包/资源包/光影下载
│   │   ├── ModDetailPage.vue    # Mod 详情页
│   │   ├── SettingsPage.vue     # 全局设置（分类子页面）
│   │   └── MorePage.vue         # 关于 / 鸣谢 / FAQ
│   ├── components/              # 组件
│   │   ├── common/             # Px UI 组件库（Modal/Progress/Badge/Notification）
│   │   ├── download/           # 下载浮动组件
│   │   ├── instance/            # 实例相关组件
│   │   ├── launch/             # 启动相关组件
│   │   └── ModManager.vue      # Mod 管理核心组件
│   ├── styles/                 # 全局样式
│   │   ├── pixel-ui.css        # 像素风 CSS 设计系统
│   │   ├── vox-controls.scss   # 全局 UI 控件（.vox-* 类前缀）
│   │   ├── themes/             # 主题样式（light/dark）
│   │   └── global.scss         # 全局样式
│   └── types/                  # 渲染进程类型
├── resources/                   # 应用资源
│   └── icons/                  # 多尺寸图标（ICO/ICNS/PNG）
├── public/                      # 公共资源（字体、图片）
├── scripts/                     # 构建辅助脚本
├── tests/                       # 单元测试（Vitest）
├── docs/                        # 文档
│   ├── dev/                    # 开发文档（本文件）
│   └── releases/               # 版本发布说明（v0.6.0.md, v0.6.1.md）
├── electron-builder.yml         # 打包配置
├── electron.vite.config.ts      # electron-vite 配置
└── package.json
```

---

## 数据库

VoxVer Launcher 使用 SQLite（better-sqlite3）持久化数据，6 张表：

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `accounts` | 账户信息 | access_token（加密）、refresh_token、profile、type |
| `instances` | 游戏实例 | version、loader、game_dir、launch_args |
| `downloads` | 下载任务 | url、progress、status、file_path |
| `versions` | 版本缓存 | id、type、metadata、local_path |
| `configs` | 全局配置 | key-value 结构（Java 路径、自定义 .minecraft 路径等） |
| `crashes` | 崩溃记录 | timestamp、log_path、analysis |

---

## 认证流程

使用微软官方 Device Code Flow，无需在启动器内输入密码：

```
用户点击「微软登录」
  → 请求设备码（POST /oauth20_token.srf）
  → 弹窗显示设备码 + microsoft.com/devicelogin 链接
  → 用户浏览器打开链接并输入设备码
  → 轮询 token（每 5 秒）
  → 获取 Access Token
  → Xbox Live 认证 → XSTS Token
  → XSTS Token → Minecraft Bearer Token
  → Minecraft Profile（用户名、UUID、皮肤 URL）
  → 保存到数据库（token 使用 safeStorage 加密）
  → 后续自动刷新，无需重复登录
```

---

## 编码规范

### 命名约定

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件/目录 | kebab-case | `game.launcher.service.ts` |
| 类/接口/类型 | PascalCase | `GameLauncherService` |
| 函数/变量 | camelCase | `startGame()` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

### 代码检查

```bash
# ESLint 检查
npm run lint

# Prettier 格式化
npm run format

# TypeScript 类型检查
npm run typecheck
```

### 测试

```bash
# 运行所有测试
npm test

# 运行测试 + 覆盖率
npx vitest --coverage
```

---

## 架构设计原则

1. **务实优先** — 能用再说，不追求完美架构，先跑通再优化
2. **类型安全** — TypeScript 严格模式，IPC 通道完整类型映射
3. **模块化** — 服务层/IPC 层/前端层分离，适配器模式支持多游戏
4. **用户体验** — 每个操作都有实时反馈（进度条、状态提示、通知）
5. **安全** — token 加密存储、不存储密码、API Key 环境变量管理
6. **像素美学** — Press Start 2P 字体 + 暗色调 + 霓虹发光
7. **国际化** — UI 文本通过 `$t()` / `tm()` 接入 i18n，翻译资源存放于 `src/locale/`
8. **控件统一** — 全局 UI 控件使用 `.vox-*` 类前缀，设计令牌使用 CSS 变量（`--voxver-*`）
