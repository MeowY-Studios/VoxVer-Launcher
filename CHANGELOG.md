# 更新日志

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
