# VoxVer Launcher

<div align="center">

![VoxVer Launcher](https://img.shields.io/badge/VoxVer_Launcher-v0.7.5-14b8a6?style=flat-square&labelColor=1e1e2e)
![Electron](https://img.shields.io/badge/Electron-42-478cbf?style=flat-square&logo=electron&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3.5-4db08b?style=flat-square&logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?style=flat-square&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-a78bfa?style=flat-square)

**VoxVer Launcher — 现代化开源 Minecraft 启动器**

_基于 Electron + Vue 3 + TypeScript + 像素风 UI_

</div>

---

## 📋 目录

- [📥 下载](#-下载)
- [🆕 v0.7.5 最近更新](#-v075-最近更新)
- [✨ 功能概览](#-功能概览)
- [🖥️ 支持平台](#️-支持平台)
- [📦 相关文档](#-相关文档)
- [📢 项目更名公告](#-项目更名公告)
- [📄 协议](#-协议)

---

## 📥 下载

**[👉 前往 GitHub Releases 下载 v0.7.5](https://github.com/MeowY-Studios/VoxVer-Launcher/releases)**

---

## 🆕 v0.7.5 最近更新

### 🔌 服务联通性测试（新增）
- 设置 → 下载与网络 → 服务联通性测试，进入后先列出 **下载源 / 版本源 / Mod 平台 / 登录与更新** 共 10 项服务
- 点击右上角「开始检测」才发起探测，逐项展示在线状态与毫秒延迟，失败项给出原因

### 🌐 下载源选择策略（新增）
- 原「镜像测速」入口替换为下拉策略：**自动选择 / 官方源优先 / 镜像源优先**
- 策略写入下载服务并真实作用于下载链路，不再只是界面开关

### ⚙️ 下载与网络设置重构（优化）
- 按「服务 / 源 / 下载」分组卡片排版；同时下载数改为下拉框
- 最大下载线程、下载速度限制、最大重试次数改为开关：开启即自动，关闭后可手动调节

### ⌨️ 全局快捷键修复（修复）
- 快速启动游戏、打开主页、打开设置、显示/隐藏窗口四个动作全部可用，触发时自动唤起并聚焦窗口
- 注册失败时明确提示「可能已被其他程序占用」，不再静默提示成功

---

### v0.7.4 主要内容

<details>
<summary>展开查看</summary>

#### 👥 多在线账户卡堆管理（新增）
- 账户页重构为**卡堆式多账户管理**：多个微软正版账户并存、快速切换、皮肤 3D 预览
- 全新独立 `MicrosoftLoginModal` 登录弹窗

#### 🧩 四加载器适配器架构（新增）
- Forge / NeoForge / Fabric / Quilt 统一适配器层，modloader 服务模块化重构

#### 🌗 暗色主题存在感增强（优化）
- 阴影改为品牌蓝辉光，暗色下卡片与弹窗恢复深度层次
- 玻璃态提亮、悬停反馈增强，卡片高光与标题栏辉光亮暗双主题自适应

</details>

---

### v0.7.3 主要内容

<details>
<summary>展开查看</summary>

#### 🖥️ 独立版本更新页（新增）
- 设置页「检查更新」改为跳转**独立全屏更新页**（`/update`）：顶栏返回与窗口控制、横幅 Logo + 版本号、状态胶囊实时反馈（检查中 / 已是最新版本 / 有新版本可用）
- 页面内直接查看 GitHub 最新 Release 的**发布说明**（Markdown 渲染，内容白名单过滤）
- 底部操作栏：检查更新 / 下载更新 / 取消下载 / 安装更新，进度条 + 已传输/总量 + 实时速度（MB/s）
- 检测到更新后状态可恢复：退出重进更新页仍可继续下载或安装
- 提供直达 GitHub Releases 的外链

#### 🌊 水波纹横幅
- 更新页横幅采用零依赖 WebGL 丝绸水波纹动画（`SilkBackground` 组件），跟随主题色渲染

#### 🛠 修复
- 修复设置页「检查更新」按钮点击无反应的问题
- 修复已是最新版本时无任何提示的问题（状态胶囊明确展示）
- 修复下载过程无状态反馈的问题

#### ⚙️ 优化
- 检查更新双链路仲裁：GitHub API 版本对比结论优先，`latest.yml` 滞后时自动兜底
- 下载支持随时取消（CancellationToken），取消后状态即时复位
- `builder-util-runtime` 固定 9.5.1，与 electron-updater 内嵌副本对齐，修复跨副本取消令牌失效

</details>

---

**[📜 查看完整版本更新历史](https://voxver.meow-studio.tech/guide/changelog.html)**

---

## ✨ 功能概览

| 类别 | 功能 |
|------|------|
| **认证** | 微软 OAuth 设备码登录、Token 自动刷新、多账户切换、离线模式 |
| **游戏启动** | 完整 JVM 启动流程、文件完整性校验、多源下载（官方源 + BMCLAPI）、进度实时推送、自定义 .minecraft 路径 |
| **版本管理** | BMCLAPI 版本列表、正式版/快照/远古版、一键安装/删除 |
| **ModLoader** | Fabric / Forge / NeoForge / Quilt 一键安装 |
| **Mod 生态** | Modrinth 搜索/下载、本地管理、自动更新检测、依赖管理；CurseForge 源待推出（API Key 申请审核中） |
| **实例系统** | 独立管理每个版本的 Mod/配置/存档、导入/导出（.mcla 格式） |
| **主题系统** | 浅色/深色切换、背景自定义、主题色自定义、字号/动画/特效/音效设置 |
| **国际化** | 中文 / English 双语切换 |
| **P2P 分享** | 6 位分享码 + WebRTC 直连分享游戏实例 |
| **热更新** | GitHub Releases 自动检测、后台下载、一键更新 |
| **崩溃监控** | 游戏崩溃自动捕获、JVM 错误分析、报告生成 |
| **皮肤管理** | Minecraft 玩家皮肤下载与前端渲染 |
| **快捷键** | 全局快捷键启动游戏 |
| **数据备份** | 配置备份与迁移 |

---

## 🖥️ 支持平台

| 平台 | 状态 | 架构 |
|------|------|------|
| Windows 10+ | ✅ 已支持 | x64 |
| macOS | ⏳ 计划中 | x64 / arm64 |
| Linux | ⏳ 计划中 | x64 |

---

## 📦 相关文档

| 文档 | 说明 |
|------|------|
| [📘 用户手册](docs/USER_GUIDE.md) | 安装、登录、版本下载、Mod、实例、设置与故障排除 |
| [📄 开发指南](docs/dev/README.md) | 技术栈、项目结构、快速开始、数据库、认证流程、编码规范 |
| [📜 更新日志](CHANGELOG.md) | 各版本详细变更记录 |
| [🔖 版本说明](docs/releases) | 各版本发布说明与升级指南 |
| [📢 声明与致谢](NOTICE.md) | 第三方依赖、商标声明 |
| [⚖️ 协议](LICENSE) | MIT 开源协议全文 |
| [📝 文档网站](https://voxver.meow-studio.tech) | VoxVer 文档网站，包含安装指南、使用说明、故障排除等。 |

---

## 📢 项目更名公告

> 本项目已从 **MCLA (Minecraft Launcher Alpha)** 正式更名为 **VoxVer Launcher**。
>
> - 仓库地址：[MeowY-Studios/VoxVer-Launcher](https://github.com/MeowY-Studios/VoxVer-Launcher)
> - 新 App ID：`com.voxver.launcher`
> - 所有功能保持不变，仅品牌标识更新。
>
> 仓库已由 nnkmn 个人账号迁移至 **MeowY-Studios** 组织，旧地址会自动跳转。

---

## 📄 协议

本项目基于 [MIT 协议](LICENSE) 开源。

> Minecraft 是 Microsoft Corporation 的商标。本项目与 Mojang Studios 或 Microsoft 无任何关联。

---

<div align="center">

**MeowY-Studios (EccenTri)** — [GitHub](https://github.com/MeowY-Studios)

</div>
