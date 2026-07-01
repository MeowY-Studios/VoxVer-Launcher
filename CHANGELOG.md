# 更新日志

## v0.6.1 — 2026-07-02

### 游戏启动修复
- **JVM 参数去重修复**：移除 `buildJvmArguments` 中的 `Set` 去重，避免 `--add-opens` 参数丢失导致 `ClassNotFoundException`
- **版本解析修复**：`extractBaseVersion` 正则锚定开头，避免从整合包名（如"你好，新蒸程！V1.4.2"）中错误提取版本号
- **类路径去重**：`buildClasspath` 添加 `[...new Set(cp)]` 去重，修复版本 JSON 中重复库声明导致的 `Duplicate key` 错误
- **GC 参数兼容性**：移除 CMS GC（Java 14+ 已删除），统一使用 G1GC，修复 `Unrecognized VM option 'UseConcMarkSweepGC'`
- **缺失文件状态处理**：前端正确处理 `needsFileDownload` 状态，弹出确认对话框后调用 `confirmDownloadAndLaunch`
- **启动状态切换修复**：`spawnProcess` 不再阻塞等待进程退出，进程启动 1.5 秒检测通过后立即切换到"运行中"状态，修复启动器一直显示"启动中"的问题
- **游戏进程独立运行**：`spawn` 选项改为 `detached: true`，游戏在独立进程组运行，关闭启动器后游戏不会被连带终止

### 文件完整性校验
- **库文件大小校验**：`checkMissingFiles`、`downloadMissingFiles` 添加文件大小校验，检测 0 字节空文件和大小不匹配文件
- **资源文件大小校验**：`downloadAssets`、`checkMissingFiles` 资源检查添加文件大小校验
- **下载前清理损坏文件**：重新下载前删除 0 字节或大小不匹配的文件

### 下载系统修复
- **BMCLAPI 重定向支持**：`downloadFile` 添加 HTTP 301/302/303/307/308 重定向跟随（最多 5 次），修复 BMCLAPI 镜像跳转导致 0 字节文件
- **下载后文件验证**：下载完成后校验文件大小不为 0，空文件视为下载失败
- **0 字节文件跳过修复**：`downloadFile` 不再跳过已存在的 0 字节文件
- **资源文件下载源优化**：资源文件主源改为官方 Minecraft 资源服务器（`resources.download.minecraft.net`，无速率限制），BMCLAPI 作为备用源，修复 3300+ 资源文件因 BMCLAPI 速率限制（60秒10次）全部返回 403 的问题
- **并行下载备用源支持**：`parallelDownload` 添加 `fallbackUrl` 支持，主源失败时自动尝试备用源

### UI/UX 优化
- **自定义下载确认弹窗**：用 `PxModal` 组件替代原生 `confirm()`，包含警告图标、消息文本、取消/下载并启动按钮
- **弹窗国际化**：新增 `launch.missingFilesTitle`、`launch.missingFilesMessage`、`launch.missingFilesHint` 等 i18n 条目

### Java 管理
- **默认 Java 版本推荐**：无法解析版本号时默认推荐 Java 21（适配现代 Forge/NeoForge 整合包）

---

## v0.6.0 — 2026-06-28

### UI 重构
- **设置页分类拆分**：设置页面按功能分类拆分为多个子页面
- **控件统一**：全局 UI 控件使用 `.vox-*` 类前缀（`.vox-btn`、`.vox-input`、`.vox-card` 等）
- **主题系统重构**：浅色/深色主题完整切换 + 背景自定义 + 主题色自定义

---

## v0.5.5 — 2026-06-25

### 主题系统
- **浅色/深色主题切换**：亮色/暗色主题完整切换 + 14+ 组件浅色覆盖样式
- **背景自定义**：图片选择 + 模糊(0-20px)·暗化(0-100%)·叠加色取色器
- **主题色自定义**：色盘选择 + 13 色阶变量全量生成 + localStorage 持久化
- **外观设置增强**：字号(12-20px)·动画开关·特效开关·音效开关
- **CSS 变量统一**：所有 `--mcla-` → `--voxver-`（46 文件·~1400 处）
- **localStorage 迁移**：所有 `mcla_` key → `voxver_`（8 处）

### 国际化
- **i18n 界面接入**：翻译资源接入所有页面组件（410 处 `$t()` 调用，覆盖 10 个页面）
- **错误信息国际化**：所有用户可见错误消息使用 i18n key
- **设置页面语言切换生效**

### Mod 生态
- **Mod 依赖管理**：Modrinth API 依赖检测 + 自动安装
- **Forge/NeoForge/Quilt 安装完善**：修复 ModLoader IPC handler loaderVersion 参数传递

### 性能与测试
- **虚拟滚动**：VirtualScroll 组件 + 版本列表/Mod 列表应用
- **单元测试**：9 个文件·130 用例全部通过（format.ts 98.85% 覆盖率）

### 其他
- **Share API 完善**：preload 接入 share IPC + 事件监听
- **UI/UX 优化**：74 处 title 属性硬编码文本修复
- **项目更名**：MCLA → VoxVer Launcher（品牌资源/代码/配置全量迁移）

---

## v0.5.4 — 2026-06-20

### 架构优化
- **Squirrel 安装器支持**：`electron-squirrel-startup` 事件处理
- **启动器统一**：删除 `starlight.launcher.ts`，统一使用 `game.launcher.service.ts`
- **watcher.service.ts 完善**：实现 `findCrashReport` 方法
- **P2P 自定义信令服务器配置**
- **IPC 通道文档化**：创建 IPC_DOCUMENTATION.md（138 条通道）

### 性能优化
- **并行下载**：5 并发下载
- **JVM GC 优化**：动态参数调整
- **缺失文件检测与提示**

### 开发工具
- **Vitest 测试框架**：`vitest.config.ts` + `tests/` 目录
- **GitHub Actions CI/CD**：`.github/workflows/ci.yml` + `MCLA.yml`
- **.env 环境变量管理**：`.env` + `.env.example`

### Bug 修复
- archiver ESM 兼容性修复
- i18n 导入方式修复
- CSP 策略修复（Splash Screen 卡住）
- 移除 CurseForge API Key 用户配置项
- 图标统一检查与修复

---

## v0.5.3 — 2026-06-18

### Bug 修复
- 进度条数字裁切修复（高度 3px → 6px）
- MCBBS 下载源移除
- 命名规范修复（`notification.ts` → `notification.service.ts`）

### 性能优化
- 启动速度优化（窗口提前创建 + 服务并行初始化 + Splash Screen）

### 国际化
- i18n 国际化接入（vue-i18n@9 + zh-CN/en-US 翻译资源骨架）

---

## v0.5.2 — 2026-06-09

### P2 体验完善
- **整合包创建工具**：打包 Mod + 资源包（mrpack 格式）
- **快捷键系统**：全局快捷键启动游戏
- **背景自定义**：上传自定义背景图
- **主题自定义**：用户自定义主题颜色
- **数据备份/迁移**：导出/导入配置和实例

### 技术债务清理
- TypeScript 类型完善
- 版本列表加载优化（Pinia Store 双层缓存 + 骨架屏 + 搜索过滤 + 分页）
- 通知系统完善

---

## v0.5.0-alpha — 2026-06-07

### P1 核心功能
- **启动器热更新**：GitHub Releases 自动检测、后台下载、一键更新
- **下载源优化**：多线程加速、断点续传、BMCLAPI 镜像切换
- **P2P 实例分享**：6 位分享码 + WebRTC 直连 + 自定义协议

### 技术债务
- 统一使用 PxNotification（替换 55 处原生 `alert()`）
- 死代码清理
- TypeScript 类型完善

---

## v0.4.2 — 2026-06-02

- 日志级别修正
- API Key 安全配置（环境变量管理）
- ESLint + Prettier 集成
- Sass legacy JS API 警告修复
- 字体文件路径修复
- 项目清理（冗余文件归档）

---

## v0.4.0 — 2026-05-14

- 修复 `isVersionInstalled()` 对 ModLoader 版本误判
- `modloader.ipc.ts` 重写，接入真实 ModLoaderService
- 皮肤系统完整接入前端渲染
- 动态版本号（`app:get-version` IPC）

---

## v0.3.0 — 2026-04-28

### 功能完善
- 版本设置：名称/描述/收藏夹/快捷方式/导出启动脚本
- 补全文件：自动检测并从 BMCLAPI 下载缺失 library/client jar
- 自定义输入弹窗（替代 Electron 不兼容的 prompt()）
- 完整游戏启动流程（IPC 连接真实服务）
- Mod 管理增强：批量安装、全选、一键打开文件夹

### 基础设施
- 分级日志系统
- 安全存储（electron safeStorage）
- SHA1/MD5 文件校验
- 跨平台 Java 探测

---

## v0.2.0 — 2026-04-26

### 微软 OAuth 认证
- Device Code Flow 实现
- Token 自动刷新
- 登录进度实时推送
- 离线模式

### Mod 下载
- CurseForge + Modrinth 双源集成
- 下载队列管理

### 其他
- 崩溃日志自动捕获与分析
- 皮肤下载与缓存

---

## v0.1.0 — 2026-04-24

- Electron + Vue 3 + TypeScript 项目搭建
- 像素风 CSS 设计系统
- 基础页面（首页/侧边栏/路由）
- 游戏启动服务骨架
- BMCLAPI 版本列表集成
- Fabric/Forge/NeoForge/Quilt 安装框架
- 微软 OAuth 设备码登录框架
- 实例系统基础（CRUD）
- NSIS 安装包配置
