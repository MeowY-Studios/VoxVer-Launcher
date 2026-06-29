# SettingsPage.vue UI 重构方案

## Context

SettingsPage.vue（5574 行）是 v0.6.0 UI 重构的最后一个页面。其他 10 个页面已全部完成 vox-* 全局控件样式迁移。本次重构目标：将 SettingsPage 的 scoped 样式统一到 `vox-controls.scss` 全局类，消除重复定义和硬编码值。

上次执行中因 2 个 toggle 元素漏加 `.vox-toggle` 类导致开关显示异常，本次需特别注意。文件已恢复到原始状态（保留 quick-grid 按钮跳转修复）。

## 关键文件

- `src/pages/SettingsPage.vue` — 待重构（模板 1-2226，脚本 2228-3464，样式 3466-5574）
- `src/styles/vox-controls.scss` — 全局控件样式基准（已完成，不修改）

## 执行步骤

### 第 1 步：模板加 vox-* 类

用 PowerShell 批量替换（可靠处理 CRLF + 大量替换）：

| 原始类 | 添加类 | 约处 | 替换模式 |
|--------|--------|------|----------|
| `sec-title` | `vox-sec-title` | ~44 | `class="sec-title">` → `class="sec-title vox-sec-title">` |
| `inp` | `vox-input` | ~15 | `="inp" v-model` / `<div class="inp">` |
| `toggle-switch` | `vox-toggle` | ~10 | `class="toggle-switch">` |
| `toggle-slider` | `vox-toggle-slider` | ~12 | `class="toggle-slider">` |
| `skin-radio-item` | `vox-radio-item` | ~25 | `="skin-radio-item" ` |
| `skin-radio-dot` | `vox-radio-dot` | ~25 | `="skin-radio-dot" ` |
| `action-btn` | `vox-btn` | ~22 | `class="action-btn"` |
| `btn-sm` | `vox-btn` | ~10 | `class="btn-sm"` |
| `btn-outline` | `vox-btn` | ~6 | `class="btn-outline"` |
| `btn-destructive` | `vox-btn--destructive` | ~1 | 逐个处理 |
| 卡片容器 | `vox-card`/`--subtle`/`vox-list-card` | ~55 | 逐类映射 |

**特别注意**：第 1991、2053 行 `class="toggle"` → `class="toggle vox-toggle"`（上次遗漏的 bug）

### 第 2 步：删除/简化 scoped 样式块

**整块删除**（替换为注释，由全局类提供）：
- `.toggle-switch` + `.toggle-slider`
- `.btn-destructive` + `:hover`
- `.btn-outline` + `:hover`
- `.skin-radio-dot` + `&.checked`

**简化**（删除基础属性，保留布局/特殊修饰）：
- `.sec-title` — 仅保留 `.sec-arrow`
- `.inp` — 仅保留 `&.short`
- `.btn-sm` — 仅保留尺寸修饰
- `.action-btn` — 仅保留 svg + `&.outline:hover`
- `.skin-radio-item` — 仅保留 `&:hover:not(.active)`
- 15 个卡片容器（about-card、copyright-card、license-card 等）— 删除 bg/border/border-radius

### 第 3 步：硬编码清理

- `--voxver-accent` → `--voxver-primary`（~16 处，原变量未在主主题定义）
- `--voxver-blue` → `--voxver-primary`（~3 处，硬编码 #6366f1）
- `--voxver-green` → `--voxver-success`（~1 处）
- `rgba()` 硬编码 → `color-mix` + 主题变量（~15 处）
- 移除 CSS 变量 fallback `var(--voxver-x, #xxx)`（~31 处）
- `border-radius: 4/6/8/16px` → `--voxver-radius-xs/sm/md/xl`（~28 处）

### 第 4 步：验证

```
npx tsc --noEmit
npm run build
```

## 风险点

1. **`class="toggle"` 遗漏**（第 1991、2053 行）— 必须在 toggle-switch 批量替换前单独处理
2. **Edit 工具 replace_all 子串 bug** — 当 old_string 是 new_string 的子串时替换无效，用 PowerShell `[System.IO.File]::ReadAllText` + `.Replace()` 替代
3. **action-btn 多变体** — primary/danger/outline 三种变体需分别加 `vox-btn--primary`/`vox-btn--destructive`/`vox-btn`
