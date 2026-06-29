# HomePage UI 重构 + 全局控件样式统一

## Context

v0.6.0 启动器 UI 重构中，设置页已完成重构（主题与背景、语言区块、开发者选项、半透明毛玻璃改造）。但设置页的统一样式（sec-title、card、toggle、radio、btn、input）都是 `<style scoped>`，其他页面无法复用，导致全应用样式不一致：

* HomePage 的 `.sec-title`（无下边框、margin 8px）vs 设置页 `.sec-title`（有下边框、margin 14px、flex 布局）

* 卡片背景两套配方混用：`color-mix(var(--voxver-text) 4%)` vs `color-mix(var(--voxver-bg-elevated) 72%)`

* border-radius 不统一：7px / 6px / 10px 混用，未映射到 `--voxver-radius-*` 变量

本次目标：抽离全局控件样式，重构 HomePage 作为首个应用案例，为后续页面迁移建立基准。

## 方案

新建 `src/styles/vox-controls.scss` 沉淀全局控件样式，使用 `.vox-` 前缀（区别于 `.mcla-*` 组件库别名与 `.px-btn` 弹窗按钮）。HomePage 改用全局类；**SettingsPage 本阶段不动 scoped 样式**，零风险，后续渐进迁移。

## 实施步骤

### 步骤 1：新建全局控件样式文件

**文件**：`src/styles/vox-controls.scss`（新建）

定义以下全局类（以设置页 SettingsPage.vue scoped 样式为基准，修复不一致）：

**Section 标题**

* `.vox-sec-title`：`margin:0 0 14px; font-size:14px; font-weight:700; display:flex; align-items:center; gap:8px; padding-bottom:10px; border-bottom:1.5px solid var(--voxver-border-color-light)`；`svg{color:var(--voxver-primary)}`

* `.vox-sec-desc`：`font-size:12px; color:var(--voxver-text-muted); margin:0 0 12px; line-height:1.6`

**卡片容器**（两套语义化，不强行合并）

* `.vox-card`（提升卡）：`background:color-mix(in oklab,var(--voxver-bg-elevated) 72%,transparent); border:1px solid var(--voxver-border-color); border-radius:var(--voxver-radius-lg)`（对齐 dev-dir-card/lang-card/welcome-card）

* `.vox-card--subtle`（内嵌浅卡）：`background:color-mix(in oklab,var(--voxver-text) 4%,transparent); border-radius:var(--voxver-radius-md)`（对齐 memory-alloc/env-info/faq）

* `.vox-card-hover`（hover 增强）：hover 时 `border-color:var(--voxver-primary-400); transform:translateY(-1px); transition:all .2s`

**按钮**

* `.vox-btn`：`padding:8px 16px; border:1.5px solid var(--voxver-border-color); border-radius:var(--voxver-radius-md); background:color-mix(in oklab,var(--voxver-bg-elevated) 72%,transparent); font-size:13px; color:var(--voxver-text-secondary); cursor:pointer`；hover：`border-color:var(--voxver-primary-400); color:var(--voxver-primary-600)`

* `.vox-btn--primary`：`background:var(--voxver-gradient-primary); border-color:transparent; color:#fff`；hover：`filter:brightness(1.06)`

* `.vox-btn--destructive`：`background:color-mix(#ef4444 15%,transparent); color:#ef4444; border:1px solid color-mix(#ef4444 30%,transparent)`；hover：背景 25%

**Toggle 开关**

* `.vox-toggle`：`position:relative; display:inline-block; width:40px; height:22px; flex-shrink:0; cursor:pointer`

* `.vox-toggle input`：`opacity:0; width:0; height:0`

* `.vox-toggle-slider`：`position:absolute; inset:0; background:var(--voxver-border-color); border-radius:11px; transition:background .25s`

* `.vox-toggle-slider::before`：`content:''; position:absolute; width:18px; height:18px; left:2px; bottom:2px; background:#fff; border-radius:50%; transition:transform .25s cubic-bezier(.34,1.56,.64,1)`

* `input:checked + .vox-toggle-slider`：`background:var(--voxver-primary)`；`::before{transform:translateX(18px)}`

**Radio 选择项**

* `.vox-radio-item`：`display:inline-flex; align-items:center; gap:8px; padding:7px 20px; font-size:13px; color:var(--voxver-text-secondary); cursor:pointer`

* `.vox-radio-item.active`：`color:var(--voxver-text-primary); font-weight:500`

* `.vox-radio-dot`：`width:14px; height:14px; border:1.5px solid var(--voxver-border-color); border-radius:50%; position:relative`

* `.vox-radio-dot.checked`：`border-color:var(--voxver-primary)`；`::after{content:''; position:absolute; inset:3px; background:var(--voxver-primary); border-radius:50%}`

**网格布局**

* `.vox-card-grid`：`display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px`

**列表卡**（用于最近实例等行项）

* `.vox-list-card`：`display:flex; align-items:center; gap:10px; padding:10px 14px; background:color-mix(in oklab,var(--voxver-bg-elevated) 72%,transparent); border-radius:var(--voxver-radius-md); border:1px solid transparent; cursor:pointer; transition:all .15s`；hover：`border-color:var(--voxver-border-color); box-shadow:var(--voxver-shadow-sm)`

### 步骤 2：在 main.ts 引入

**文件**：`src/main.ts`（L9 后追加）

```ts
import './styles/global.scss'
import './styles/vox-controls.scss'   // 新增：全局控件样式
import './styles/animations.scss'
```

位置在 `global.scss` 之后、`themes/` 之前，确保主题色变量能正确覆盖。

### 步骤 3：重构 HomePage.vue

**文件**：`src/pages/HomePage.vue`

**模板结构调整**：

```
.home-page
  .welcome-area
    section.vox-card（欢迎卡：保留 hero 图标/标题/描述/4 按钮）
      .wc-actions 内按钮改 class="vox-btn" / "vox-btn vox-btn--primary"
    section.recent-section（最近实例）
      h3.vox-sec-title（新增 svg 图标，与设置页一致）
      p.vox-sec-desc（新增副标题，增强层次）
      .vox-card-grid
        .vox-list-card * n（图标+名称+meta+时间）
```

**样式调整**：

* 删除 scoped 中与全局类重复的定义：`.welcome-card` 背景/圆角/边框（改用 `.vox-card`）、`.wc-btn`（改用 `.vox-btn`）、`.recent-item`（改用 `.vox-list-card`）、`.sec-title`（改用 `.vox-sec-title`）

* 保留 scoped 中布局性样式：`.home-page` padding、`.welcome-area` flex、`.wc-icon` 图标尺寸、`.ri-icon` 渐变背景、`.ri-info` 文字溢出

* 新增 `.wc-actions` 内按钮间距保留

### 步骤 4：验证

1. `npm run dev` 启动应用
2. 首页 vs 设置页对比：`.sec-title` 下边框、卡片圆角、按钮样式视觉一致
3. DevTools 检查 `.vox-sec-title` 计算值：margin 14px、border-bottom 1.5px、font-weight 700
4. 切换暗/亮主题，确认卡片背景与主色变量跟随
5. 回归设置页各 section 无样式漂移（scoped 样式未改）

## 涉及文件

| 文件                             | 操作      | 说明                   |
| ------------------------------ | ------- | -------------------- |
| `src/styles/vox-controls.scss` | 新建      | 全局控件样式（.vox-\* 前缀）   |
| `src/main.ts`                  | 修改 L9 后 | 引入 vox-controls.scss |
| `src/pages/HomePage.vue`       | 重构模板+样式 | 应用全局类，删除重复 scoped 样式 |

## 不在本次范围

* SettingsPage.vue 的 scoped 样式迁移（后续渐进迁移）

* 其他页面（AccountPage/DownloadsPage/InstancesPage 等）的重构（后续按本次基准逐步推进）

* 全局变量（pixel-ui.css）的调整

