# VoxVer Launcher

<div align="center">

![VoxVer Launcher](https://img.shields.io/badge/VoxVer_Launcher-v0.6.2-14b8a6?style=flat-square&labelColor=1e1e2e)
![Electron](https://img.shields.io/badge/Electron-33-478cbf?style=flat-square&logo=electron&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3.5-4db08b?style=flat-square&logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?style=flat-square&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-a78bfa?style=flat-square)

**VoxVer Launcher — 现代化开源 Minecraft 启动器**

_基于 Electron + Vue 3 + TypeScript + 像素风 UI_

</div>

---

## 📋 目录

- [📥 下载](#-下载)
- [🆕 v0.6.2 最近更新](#-v062-最近更新)
- [✨ 功能概览](#-功能概览)
- [🖥️ 支持平台](#️-支持平台)
- [📦 相关文档](#-相关文档)
- [📢 项目更名公告](#-项目更名公告)
- [📄 协议](#-协议)

---

## 📥 下载

**[👉 前往 GitHub Releases 下载 v0.6.2](https://github.com/nnkmn/VoxVer-Launcher/releases)**

---

## 🆕 v0.6.2 最近更新

### 设计系统重构
- **Design Token 体系**：OLED 暗色底座（四层黑色阶梯）+ Neubrutalism 工具类 + Bento Grid 布局
- **磨砂玻璃效果**：侧边栏/主内容区/关于页面统一磨砂质感，`backdrop-filter` 移至 `::before` 修复文字模糊

### 启动画面优化
- 版本号从 `package.json` 动态加载，4 秒进度条匀速走完后 0.8s 缓慢淡出，不再闪屏
- Logo 替换为 Alogo.png

### UI 细节
- 设置页面/侧边栏滚动条隐藏；移除 Hero 蓝色渐变；颜色选择器磨砂层点击修复

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
| macOS | ⏳ 计划中 | x64 / arm64 |
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
| [📝 文档网站](https://voxver.linpork.top) | voxver 文档网站，包含安装指南、使用说明、故障排除等。 |

---

## 📢 项目更名公告

> 本项目已从 **MCLA (Minecraft Launcher Alpha)** 正式更名为 **VoxVer Launcher**。
>
> - 新仓库地址：[nnkmn/VoxVer-Launcher](https://github.com/nnkmn/VoxVer-Launcher)
> - 新 App ID：`com.voxver.launcher`
> - 所有功能保持不变，仅品牌标识更新。

---

## 📄 协议

本项目基于 [MIT 协议](LICENSE) 开源。

> Minecraft 是 Microsoft Corporation 的商标。本项目与 Mojang Studios 或 Microsoft 无任何关联。

---

<div align="center">

**nnkmn (EccenTri)** — [GitHub](https://github.com/nnkmn)

</div>
