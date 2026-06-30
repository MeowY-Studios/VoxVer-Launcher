# Apple 设计规范系统性重构计划

> 唯一设计规范源：`e:\Creation\Project\TEST\mcl\LNTP\awesome-design-md-main\awesome-design-md-main\design-md\apple\DESIGN.md`
>
> 本计划"完全重新开始实施"——基于 Apple DESIGN.md 从头规划完整组件库与样式系统。已存在的 Apple 合规 `:root` 令牌块经核验与 DESIGN.md 完全一致，作为基础保留；其余所有遗留样式（teal 主色、渐变、发光阴影、koring 主题、.mcla-* 覆盖）全部重写。

---

## 一、当前状态分析（Phase 1 探索结果）

### 已合规（保留）✅
| 文件 | 范围 | 状态 |
|---|---|---|
| `src/styles/pixel-ui.css` | `:root` 块（第 36-276 行） | Apple 原始 token + VoxVer 兼容别名两层结构，与 DESIGN.md 令牌一一对应 |

### 遗留待重写 ❌
| 文件 | 行数 | 遗留问题 |
|---|---|---|
| `src/styles/pixel-ui.css` | body + `.mcla-*` | `line-height:1.6`（应 1.47）；`.mcla-*` 仍为旧实现 |
| `src/styles/vox-controls.scss` | 245 行 | 按钮 `font-weight:500`（Apple 禁用 500）、`radius-sm`（应 pill）、缺 Apple 按钮变体 |
| `src/styles/themes/light.scss` | 326 行 | teal `#0d9488`、渐变、发光阴影、大量 `.mcla-*` 覆盖 |
| `src/styles/themes/dark.scss` | 134 行 | teal `#14b8a6`、渐变、发光阴影 |
| `src/styles/themes/koring.scss` | 260 行 | 整个 koring 主题（决策：废弃为 dark 别名） |
| `src/styles/global.scss` | 223 行 | `.px-btn` 用渐变+发光阴影；`.mcla-card:hover` 用 `translateY+shadow-lg`（Apple 禁止卡片阴影） |
| `src/App.vue` | 样式段 | titlebar 用 `gradient-primary`+`::after` 微光；brand `font-weight:800`；tab-pill `radius-md`+border+blur+active 白底 |
| `src/stores/app.store.ts` | 全文 | `ThemeMode` 含 `'koring'`；`isDark`/`resolveTheme` 引用 koring |
| `src/pages/SettingsPage.vue` | 4 处 | koring 主题预览选项（第 966/2394/5246-5249 行） |
| `src/main.ts` | 第 15 行 | `import './styles/themes/koring.scss'` |

### 自动兼容（无需改动）🟢
- 全代码库 130 处 `gradient-primary|shadow-glow|shadow-sm/md/lg/xl` 引用（28 个文件，含 Vue scoped 样式）——别名层已将渐变映射为纯色、阴影映射为 `none`，自动失效，第一阶段不动。
- 2496 处 `var(--voxver-*)` 引用——别名层保留旧名，零改动。

---

## 二、设计决策（锁定）

1. **单一强调色**：`#0066cc` Action Blue，所有交互元素唯一颜色。功能色（success/warning/error）仅用于状态 badge/日志，不用于按钮。
2. **字体栈**：`-apple-system, BlinkMacSystemFont, system-ui, 'Inter', sans-serif`（不引入 SF Pro，规避许可证）。
3. **字重阶梯**：300 / 400 / 600 / 700（500 刻意缺失，`--voxver-font-medium` 映射为 400）。
4. **圆角阶梯**：5/8/11/18/9999px（无 16px xl）。
5. **唯一阴影**：`rgba(0,0,0,0.22) 3px 5px 30px 0`，仅用于产品图；卡片/按钮/文字零阴影。
6. **按钮唯一 active 微交互**：`transform: scale(0.95)`。
7. **主题策略**：合并为 Apple 浅色 + 暗色双主题；koring 废弃为 dark 别名（向后兼容 localStorage 已存值）。
8. **别名层策略**：保留 `--voxver-*` 变量名（2496 处引用零改动），值指向 Apple token；渐变→纯色、阴影→`none`、色阶→单一色。
9. **双前缀并存**：`.vox-*`（新，vox-controls.scss）为主；`.mcla-*`（旧）保留为兼容层，第一阶段不删除，但其主题覆盖块删除。
10. **节奏**：分阶段——核心系统先行（本计划），页面/组件迁移后续。

---

## 三、Phase 1 实施变更（核心系统）

### 3.1 `src/styles/pixel-ui.css` — body 全局样式
**What**：第 296-302 行 body 块，`line-height: 1.6` → `1.47`；新增 `letter-spacing: -0.374px`；`-webkit-font-smoothing` 保持。
**Why**：DESIGN.md `typography.body` = 17px/400/1.47/-0.374px。
**How**：单行 Edit。`font-size` 已通过 `var(--voxver-text-base)`（17px）生效，无需改。

### 3.2 `src/styles/vox-controls.scss` — 组件库全面重写
**What**：整文件重写为 Apple 组件规范。保留类名（`.vox-*`），重写实现 + 新增变体。
**Why**：当前 `.vox-btn` 用 `font-weight:500`（Apple 禁用）、`radius-sm`（按钮应 pill）；缺 Apple 的 secondary-pill / dark-utility / pearl-capsule / icon-circular 变体。

**How**：按 DESIGN.md `components:` YAML 逐项实现：

| 类名 | Apple 规范 |
|---|---|
| `.vox-btn--primary` | bg `--apple-primary`，color `#fff`，radius `pill`，padding `11px 22px`，font 17px/400，active `scale(0.95)`，focus `2px solid --apple-primary-focus` |
| `.vox-btn--secondary-pill`（新） | bg 透明，color `--apple-primary`，1px solid `--apple-primary`，radius pill，padding `11px 22px` |
| `.vox-btn--dark-utility`（新） | bg `--apple-ink`，color `#fff`，font 14px/400/-0.224px，radius `sm`(8px)，padding `8px 15px` |
| `.vox-btn--pearl-capsule`（新） | bg `--apple-surface-pearl`，color `--apple-ink-muted-80`，font 14px，radius `md`(11px)，padding `8px 14px` |
| `.vox-btn--icon-circular`（新） | 44×44，bg `--apple-surface-chip-translucent` @64% alpha，color `--apple-ink`，radius full |
| `.vox-btn`（默认/ghost） | 透明，color `--voxver-text-secondary`，hover bg `color-mix(in oklab, var(--voxver-text) 4%, transparent)`，radius sm |
| `.vox-btn--destructive` | 透明，color `--voxver-error`，1px solid `color-mix(error 25%,transparent)`，radius pill |
| `.vox-card` | bg `color-mix(text 2.5%, transparent)`，radius `lg`(18px)，**无 border 无 shadow** |
| `.vox-card--subtle` | bg `color-mix(text 1.5%, transparent)`，radius `md`(11px) |
| `.vox-card-hover` | hover bg `color-mix(primary 6%, transparent)`（保留，无 transform） |
| `.vox-input` | radius `pill`，padding `12px 20px`，height 44px，font 17px，1px solid `rgba(0,0,0,0.08)`，focus border `--apple-primary` + `0 0 0 3px rgba(0,102,204,0.25)` |
| `.vox-toggle` | 保留开关结构，开启色 `--apple-primary` |
| `.vox-radio-item` / `.vox-radio-dot` | 保留，选中色 `--apple-primary` |
| `.vox-list-card` | radius `md`(11px)，hover bg tint（无 transform） |
| `.vox-sec-title` | font 12px/600，uppercase，letter-spacing 0.05em（caption-strong 风格） |
| `.vox-sec-desc` | font 12px/400，color muted |
| `.vox-card-grid` | gap `24px`（spacing.lg） |

### 3.3 `src/styles/themes/light.scss` — 重写为 Apple 浅色
**What**：精简至 ~60 行，仅 `[data-theme='light']` 覆盖语义变量。
**Why**：当前 326 行含 teal 主色、渐变、发光阴影、22 个 `.mcla-*` 覆盖块——全部违反 Apple 规范。

**How**：`[data-theme='light']` 块仅覆盖：
```
--voxver-bg-primary: var(--apple-canvas);          /* #ffffff */
--voxver-bg-secondary: var(--apple-canvas-parchment); /* #f5f5f7 */
--voxver-bg-tertiary: var(--apple-surface-pearl);  /* #fafafc */
--voxver-bg-elevated: var(--apple-canvas);
--voxver-bg-hover: var(--apple-divider-soft);
--voxver-bg-active: var(--apple-hairline);
--voxver-bg-input: var(--apple-canvas);
--voxver-text-primary: var(--apple-ink);           /* #1d1d1f */
--voxver-text-secondary: var(--apple-ink-muted-80);/* #333333 */
--voxver-text-tertiary: var(--apple-ink-muted-48); /* #7a7a7a */
--voxver-text-muted: var(--apple-ink-muted-48);
--voxver-text-inverse: var(--apple-body-on-dark);
--voxver-border-color: var(--apple-hairline);      /* #e0e0e0 */
--voxver-border-color-light: var(--apple-divider-soft);
--voxver-border-strong: var(--apple-hairline);
--voxver-primary: var(--apple-primary);            /* #0066cc 浅色面用 Action Blue */
--voxver-primary-hover: var(--apple-primary-focus);
--voxver-titlebar-bg: var(--apple-surface-black);  /* 全局导航纯黑 */
--voxver-scrollbar-thumb: rgba(0,0,0,0.14);
--voxver-scrollbar-thumb-hover: rgba(0,0,0,0.25);
```
删除全部 `.mcla-*` 覆盖块（card/input/btn/badge/alert/modal/tab/dropdown/menu/skeleton/page/avatar/divider/progress/tooltip）。

### 3.4 `src/styles/themes/dark.scss` — 精简
**What**：精简至 ~30 行，仅 `[data-theme='dark']` 覆盖。
**Why**：当前 134 行含 teal 主色、渐变、发光阴影。

**How**：`:root` 已默认暗色（Apple tile 阶梯），`[data-theme='dark']` 仅需覆盖少量（多数已与 :root 一致）。删除全部 `.mcla-*` 覆盖块。保留：
```
--voxver-primary: var(--apple-primary-on-dark);  /* #2997ff 暗色面链接亮蓝（可选：保持 #0066cc 也可）*/
```
> 决策：暗色面按钮/链接用 `--apple-primary-on-dark` (#2997ff) 更易读；按钮主色保持 `--apple-primary` (#0066cc) 因 Apple 在暗色 tile 上仍用 Action Blue。最终：`--voxver-primary` 保持 `#0066cc`，新增 `--voxver-link-on-dark` 别名供文字链接用。

### 3.5 `src/styles/themes/koring.scss` — 清空为 dark 别名
**What**：清空全部 260 行内容，仅留：
```scss
/* Koring 主题已废弃，向后兼容映射为 dark */
[data-theme='koring'] {
  /* 无覆盖，继承 :root 暗色默认 */
}
```
**Why**：用户决策取消 koring 主题；保留空选择器避免 localStorage 已存 `koring` 值导致样式丢失（init() 会迁移，但双保险）。

### 3.6 `src/stores/app.store.ts` — 移除 koring 类型
**What**：
- 第 8 行：`export type ThemeMode = 'dark' | 'light' | 'auto'`（移除 `'koring'`）
- 第 29-32 行 `isDark`：`return t === 'dark'`（移除 `|| t === 'koring'`）
- 第 37 行 `resolveTheme()`：返回类型 `'dark' | 'light'`（移除 `| 'koring'`）
- 第 119-126 行 `init()`：新增迁移——`if (saved === 'koring') { theme.value = 'dark'; localStorage.setItem('voxver_theme','dark') }`

**Why**：类型上彻底移除 koring；运行时迁移已存值避免用户主题回退。
**How**：4 处 Edit。

### 3.7 `src/pages/SettingsPage.vue` — 移除 koring 主题选项
**What**（4 处）：
- 第 2394 行：删除 `{ value: 'koring' as const, label: t('settings.themeKoring') }`
- 第 966 行：`(opt.value === 'dark' || opt.value === 'koring')` → `opt.value === 'dark'`
- 第 5246-5249 行：删除 `.tpw-dark[data-theme='koring']` 4 条 CSS
- 可选：删除 locale key `settings.themeKoring`（zh-CN.ts / en-US.ts）——若其他处无引用则删，否则保留为无害死键。

**Why**：UI 不再暴露 koring 选项。
**How**：4 处 Edit。

### 3.8 `src/App.vue` — 主框架样式重写
**What**（样式段，第 1162-1349 行附近）：
- `.titlebar`（1163）：`background: var(--voxver-gradient-primary)` → `var(--voxver-titlebar-bg)`（=纯黑）；删除 `::after` 微光渐变块（1175-1185）；`height: 44px` 已对（Apple global-nav 44px）保留。
- `.brand`（1193）：`font-size:15px`→`12px`；`font-weight:800`→`600`；`letter-spacing:1.5px`→`-0.12px`；删除 `text-shadow`。
- `.tab-pill`（1223）：`border-radius: var(--voxver-radius-md)`→`var(--voxver-radius-pill)`；删除 `border`；`background: rgba(255,255,255,0.06)`→`transparent`；`font-weight:500`→`400`；删除 `backdrop-filter: blur(4px)`；`.active` 由"白底蓝字"改为"透明底 + color: var(--apple-primary)"（或保留白底，二选一——决策：暗色 titlebar 上 active 用 `rgba(255,255,255,0.12)` 微 tint + 白字，非 active 白字半透明，符合 Apple global-nav 链接风格）；`:hover` 用 `rgba(255,255,255,0.08)` tint。
- `.sidebar`（1332）：删除 `radial-gradient` + `linear-gradient` 背景；改为 `background: var(--voxver-bg-primary)`（暗色 = tile-1）；保留 `backdrop-filter: blur` 可选（Apple sub-nav 有 frosted，但 sidebar 非 sticky，决策：移除 blur，纯色）；删除 `::before` 装饰。
- `.nav-item.active`：`background: var(--apple-primary)` + color `#fff` + `border-radius: var(--apple-radius-sm)`(8px)；或 Apple 风格用 `color: var(--apple-primary)` + 无 bg——决策：用 Action Blue 文字色 + 无背景 + 左侧 2px 蓝条指示器（Apple global-nav 风格）。

**Why**：titlebar 不应渐变（Apple 全局导航纯黑）；brand 字号/字重过大；tab-pill 应为透明链接而非带边框毛玻璃胶囊；sidebar 不应渐变发光。

### 3.9 `src/styles/global.scss` — 兼容别名清理
**What**：
- 第 44-47 行 `::selection`：`background: var(--voxver-primary-200)`→`rgba(0,102,204,0.2)`；`color: var(--voxver-primary-900)`→`var(--apple-ink)`。
- 第 50-53 行 `:focus-visible`：`outline: 2px solid var(--voxver-primary-500)`→`var(--apple-primary-focus)`。
- 第 114-120 行 `.mcla-card:hover`：删除 `transform: translateY(-2px)` + `box-shadow: var(--voxver-shadow-lg)`（Apple 禁止卡片阴影）。
- 第 122-134 行 `.mcla-list-item:hover`：删除 `transform: translateX(4px)`（Apple 无此交互）。
- 第 177-223 行 `.px-btn` 全块重写为 Apple `button-primary`：radius pill，bg `--apple-primary`，color `#fff`，padding `11px 22px`，font 17px/400，active `scale(0.95)`，focus `2px solid --apple-primary-focus`；`.px-btn--secondary` 改为 `button-secondary-pill`（透明 + 蓝边）；删除渐变与发光阴影。

**Why**：卡片 hover 上浮+阴影、列表项水平位移、按钮渐变+发光均违反 Apple 规范。

### 3.10 `src/main.ts` — 保留 koring.scss 导入
**What**：第 15 行 `import './styles/themes/koring.scss'` 保留（文件已清空为空选择器，导入无害）。
**Why**：避免删除导入引发未知依赖；空文件零开销。

---

## 四、重构前后对比

| 维度 | 重构前（遗留） | 重构后（Apple） |
|---|---|---|
| 主色 | teal `#14b8a6`/`#0d9488` + koring 蓝 `#2563eb` | 单一 Action Blue `#0066cc` |
| 渐变 | 7 种 `linear-gradient(135deg,...)` | 无（纯色） |
| 发光阴影 | 6 种 `shadow-glow-*` | 无 |
| 卡片/按钮阴影 | `shadow-sm/md/lg/xl` | 无（仅产品图 `rgba(0,0,0,0.22) 3px 5px 30px`） |
| 字重 | 300/400/500/600/700/800 | 300/400/600/700（500/800 禁用） |
| 正文字号 | 14px | 17px |
| 正文行高 | 1.6 | 1.47 |
| 按钮圆角 | `radius-sm`(8px) | pill (9999px) |
| 卡片圆角 | `radius-md` | `radius-lg`(18px) |
| titlebar | teal 渐变 + 微光 | 纯黑 44px |
| tab-pill | 边框 + 毛玻璃 + 白底 active | 透明链接 + tint hover |
| sidebar | radial+linear 渐变 + blur | 纯色 tile |
| 主题数 | dark/light/auto/koring | dark/light/auto（koring 别名） |
| `.mcla-*` 覆盖块 | light.scss 22 块 + dark 4 块 + koring 全文 | 0（别名层接管） |

---

## 五、假设与决策

1. **保留已合规的 `:root`**：经核验与 DESIGN.md 令牌一致，不重写以避免无效劳动。若用户要求从头重写 `:root`，可追加。
2. **不动 Vue scoped 样式中的 130 处 gradient/shadow 引用**：别名层已使其失效（渐变→纯色、阴影→none），第一阶段不碰，避免范围爆炸。第三阶段再清理。
3. **`.mcla-*` 类名第一阶段不删除**：仅删除主题文件中的 `.mcla-*` 覆盖块（因其改写 token 已失效）；`.mcla-*` 基础类保留为兼容层。
4. **koring 不立即从 localStorage 清除**：app.store.ts init() 迁移已存 `koring`→`dark`；koring.scss 留空选择器作双保险。
5. **不引入 SF Pro 字体文件**：用系统栈 + Inter 替代，规避许可证。
6. **不实现"对比效果展示"可视化页面**：以本计划第四章对比表 + 验证阶段 dev 启动后人工截图对比呈现。
7. **暗色面文字链接色**：新增 `--voxver-link-on-dark` 别名 = `--apple-primary-on-dark` (#2997ff)，供暗色面 inline 链接用；按钮主色保持 #0066cc。

---

## 六、验证步骤

1. **类型检查**：`npm run type-check`（或 `npx tsc --noEmit`）——确认 app.store.ts ThemeMode 改动不破坏类型。
2. **构建**：`npm run build`——确认 SCSS 编译无误。
3. **dev 启动**：`npm run dev`——人工核验：
   - titlebar 纯黑 44px，无渐变/微光
   - tab-pill 透明链接风格，hover 有 tint
   - sidebar 纯色，无渐变
   - 主按钮为蓝色药丸
   - 卡片无阴影、18px 圆角
   - 切换 light/dark 主题，koring 选项已消失，已存 koring 用户自动迁移为 dark
   - 字体清晰，正文 17px
4. **回归**：随机点击主要页面（Home/Downloads/Settings/Instances），确认无样式塌陷。

---

## 七、Phase 1 任务清单（实施顺序）

1. pixel-ui.css body 行高
2. vox-controls.scss 组件库重写
3. light.scss 重写
4. dark.scss 精简
5. koring.scss 清空
6. app.store.ts 移除 koring 类型 + 迁移
7. SettingsPage.vue 移除 koring 选项
8. App.vue 主框架样式
9. global.scss 兼容清理 + .px-btn 重写
10. 验证（type-check + build + dev）

> Phase 2（页面迁移：LaunchPage/SettingsPage/DownloadsPage/InstanceDetail）与 Phase 3（组件迁移：AccountCard/InstanceCard 状态色、.mcla-* 移除）本计划不展开，待 Phase 1 验证通过后另行规划。
