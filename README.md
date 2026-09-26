# VoxVer Launcher

<div align="center">

![VoxVer Launcher](https://img.shields.io/badge/VoxVer_Launcher-v0.7.2-14b8a6?style=flat-square&labelColor=1e1e2e)
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
- [🆕 v0.7.2 最近更新](#-v072-最近更新)
- [✨ 功能概览](#-功能概览)
- [🖥️ 支持平台](#️-支持平台)
- [📦 相关文档](#-相关文档)
- [📢 项目更名公告](#-项目更名公告)
- [📄 协议](#-协议)

---

## 📥 下载

**[👉 前往 GitHub Releases 下载 v0.7.2](https://github.com/MeowY-Studios/VoxVer-Launcher/releases)**

---

## 🆕 v0.7.2 最近更新

### 🔄 更新检查双链路（新增）
- 检查更新改为 **GitHub API 版本对比链路**：直接比对本地版本与 GitHub 最新 Release，不再依赖 `latest.yml`
- 点击按钮后的所有结果均有可见反馈：发现新版本弹「新版本可用」弹窗（可下载安装）、版本一致弹「已是最新版本」弹窗、检查失败弹错误详情
- 按钮增加「检查中」禁用态与 12 秒超时自动恢复
- 启动时自动检查同样走版本对比链路，检测结果在设置页可恢复展示
- 下载/安装仍由 electron-updater 执行：元数据未就绪时自动补检后再下载；`latest.yml` 滞后时以 API 对比结论为准
- 开发模式下版本检测同样可用

---

### v0.7.1 主要内容

<details>
<summary>展开查看</summary>

#### 🩺 崩溃分析系统
- 游戏异常退出后自动捕获并解析崩溃报告（10 类崩溃特征识别）
- 新增独立「崩溃分析」页面；启动页崩溃面板展示异常详情

### 🎨 Lumin UI/UX 设计系统
- 合并 [Lumin UI/UX](https://github.com/MeowY-Studios/Lumin-UI-UX)：Modal 弹窗（4 档尺寸 + 响应式）、Toast 通知、Badge 渐变变体与完整动画体系
- 新增 PxSelect 组件统一替换原生下拉框
- 全局颜色 Token 化（`--voxver-*` CSS 变量），修复大量深色/浅色主题下的硬编码颜色
- 页面切换统一 250ms 淡入淡出动画

### 🚀 启动核心与 Mod 生态
- 集成 XMCL 启动核心，修复 1.16 崩溃与 1.20.1 Forge 自包含版本启动问题
- Java 版本按 MC 版本自动选择（8 / 11 / 17 / 21 / 25），LWJGL 2/3 自动区分 `java.exe` / `javaw.exe`
- Forge / NeoForge / Fabric / Quilt 一键安装，支持 OptiFine 与 Fabric API 自动匹配
- Mod 管理：CurseForge + Modrinth 双源搜索、批量操作、兼容性检查、图标缓存、导出 zip
- 下载多源切换与超时控制，新增全局下载进度面板

### 🧩 实例与联机
- 自动导入当前游戏目录中检测到的本地版本
- P2P 实例分享（WebRTC + 6 位分享码）设置分区独立，新增联机分区

### 🌍 其他
- **修复关于页在打包版本中空白的问题**（i18n 词条中 `@` 字符触发 `Invalid linked format`）
- i18n 补全：修复 560+ 处硬编码文本，新增约 300 个词条
- 仓库迁移至 MeowY-Studios 组织，文档站迁移至 voxver.meow-studio.tech
- Electron 升级至 42，better-sqlite3 升级至 12，GitHub Actions 运行时升级 Node 24
- 集成 Codex Security 提交前安全扫描

</details>

---

## ✨ 功能概览

| 类别 | 功能 |
|------|------|
| **认证** | 微软 OAuth 设备码登录、Token 自动刷新、多账户切换、离线模式 |
| **游戏启动** | 完整 JVM 启动流程、文件完整性校验、多源下载（官方源 + BMCLAPI）、进度实时推送、自定义 .minecraft 路径 |
| **版本管理** | BMCLAPI 版本列表、正式版/快照/远古版、一键安装/删除 |
| **ModLoader** | Fabric / Forge / NeoForge / Quilt 一键安装 |
| **Mod 生态** | CurseForge + Modrinth 双源搜索/下载、本地管理、自动更新检测、依赖管理 |
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
| macOS | ✅ 已支持 (CI) | x64 / arm64 |
| Linux | ⏳ 计划中 | x64 |

---

## 📦 相关文档

| 文档 | 说明 |
|------|------|
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
