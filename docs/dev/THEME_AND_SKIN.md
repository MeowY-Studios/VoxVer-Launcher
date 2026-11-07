# 主题与皮肤系统（Theme & Skin）

> 更新：2026-11-08 · 对应 HEAD `80a7e2a` · 相关代码 `src/stores/app.store.ts`、`src/styles/skin-koring.scss`、`src/components/kor/`

VoxVer 的个性化由**两条互相独立的轴**组成：

| 轴 | 状态字段 | 取值 | 影响 |
|---|---|---|---|
| 显示模式 ThemeMode | `voxver_theme` | `dark` / `light` / `auto` | 只切明暗（`data-theme`） |
| 排版皮肤 ThemeSkin | `voxver_skin` | `voxver` / `koring` | 只切界面与排版（`data-skin`） |

两轴自由组合：`koring + light`（Koring 排版 + 浅色）、`koring + dark`、`voxver + auto` 都成立。切换皮肤**不改变**当前明暗模式。

## 一、数据结构与切换流程

`src/stores/app.store.ts`：

```ts
export type ThemeMode = 'dark' | 'light' | 'auto'
export type ThemeSkin = 'voxver' | 'koring'

const theme = ref<ThemeMode>('dark')
const skin = ref<ThemeSkin>('voxver')
const isKoring = computed(() => skin.value === 'koring')

function applyTheme() {
  document.documentElement.setAttribute('data-theme', resolvedTheme.value)
  if (skin.value === 'koring') document.documentElement.setAttribute('data-skin', 'koring')
  else document.documentElement.removeAttribute('data-skin')
}
```

- 选择「主题预设」卡（设置 → 主题与背景）时：弹确认 → `setSkin()` 写 `localStorage.voxver_skin` → 调 `window.electronAPI.app.relaunch()`（主进程 `app:relaunch` → `app.relaunch(); app.exit(0)`）重启。
- **切换皮肤必须重启**：组件树与样式作用域在启动时装配，热切换会出现半套排版。
- 旧数据兼容：`voxver_theme === 'koring'`（早期把皮肤塞进 theme 的历史值）在 `init()` 里迁移为 `theme='dark'` + `skin='koring'`。

## 二、三种实现手段（按优先级）

1. **Kor 组件层**（首选）：`src/components/kor/` 下的 Vue 组件，只在 Koring 皮肤下渲染。
2. **模板分支**：`v-if="appStore.skin === 'koring'"` 渲染 Koring 结构，`v-else` 保留原版结构（两套并存，互不影响）。
3. **样式覆盖**（过渡手段）：`src/styles/skin-koring.scss` 里 `[data-skin='koring']` 作用域覆盖 classic 类名。属于技术债，迁移完成后应删除对应段落。

## 三、Kor 组件层

```
src/components/kor/
├── index.ts                 统一出口（含 KorSettingSwitch 等别名）
├── ui/                      KorButton KorSurface KorBadge KorSeparator KorSwitch
│                            KorSlider KorSelect KorInput KorSkeleton KorProgress
│                            KorEmpty KorFadeText
├── setting/                 KorPageHeader KorSectionTitle KorSettingCard
│                            KorSettingRow KorSettingBadge KorSettingListItem
│                            KorSettingNumberField KorSettingRadioGroup KorAccountCard
├── shell/                   KorPageShell.vue + types.ts + useKorPageShellNav.ts
│                            （分组侧栏、滑动指示条、方向翻页、keep-alive、sidebar-only）
├── silk/KorSilk.vue         CSS 近似丝绸/水波层（不引 three.js）
└── version/KorVersionCard.vue  版本横幅（渐变 + 丝绸 + 名称 + commit）
```

样式在 `src/styles/kor-components.scss`（基础件复用 `src/styles/settings-surface.scss` 的 `.kor-card/.kor-row/.kor-switch/...`）。

`KorPageShell` 用法：

```vue
<KorPageShell v-model="activeCategory" sidebar-only :groups="korGroups" nav-label="设置导航">
  <template #sidebar-header><KorAccountCard name="账户" desc="…" /></template>
  <template #page-account>…页面内容…</template>
</KorPageShell>
```

- `sidebar-only`：只出侧栏，内容仍由页面自己渲染（用于「导航在页面内、内容在右侧」的设置页/下载页）。
- 不加 `sidebar-only` 时，`page-<key>` 插槽承载整页内容并由 shell 负责翻页动画与 keep-alive。

## 四、两套皮肤的结构差异

| 区域 | VoxVer 皮肤 | Koring 皮肤 |
|---|---|---|
| 主导航 | 标题栏居中上导航（两套共用） | 同左 |
| 设置页 | `App.vue` 全局侧栏 + classic 模板 | 页面内 `KorPageShell` 侧栏（账户卡 + 分组）+ Kor 组件正文 |
| 下载页 | 全局侧栏 + classic 列表 | 页面内分类导航 + 版本手风琴 |
| 首页 | 原版首页 | 左下大标题 + 启动/下载胶囊 |
| 卡片 | `.sec` / `.memory-alloc-card` | `.kor-surface`（14px 圆角 + 毛玻璃 + hairline） |

Koring 下 `/settings`、`/downloads` 会隐藏全局侧栏（`App.vue` 的 `isKorOwnNav`），因为这两页自带导航；其余路由保留全局侧栏，避免实例/账户列表丢失。

## 五、迁移状态（2026-11-08）

- 已完成：外壳（设置页/下载页导航由 `KorPageShell` 出）、设置页 9 个分类正文（主页、主题与背景、主界面、语言、辅助功能、账户、关于、版权、启动器）、首页、下载页、实例页、更新页。
- 进行中：设置页其余分类（游戏账户与档案、Java 虚拟机与内存、游戏目录、高级设置、下载与网络、数据迁移、截图、联机、P2P、安全识别、其他、服务与反馈、赞助、开发者）、版本页/版本详情页/账户页/启动页/下载管理页/崩溃分析页正文、`ModDetailModal`、下载页内容区（版本手风琴 / Mod 列表）。
- 待清账：`skin-koring.scss` 仍有约 810 行 `[data-skin='koring']` 覆盖，随正文迁移逐步删除。
- 计划与进度见仓库外层的 `KORING-SKIN-PLAN.md`。

## 六、新增页面时的约定

1. 优先用 Kor 组件写 Koring 分支，不要新增 `[data-skin='koring']` 的类名覆盖。
2. 两套结构并存时，原版分支包在 `v-if="appStore.skin !== 'koring'"` 里，保证 VoxVer 皮肤像素级不变。
3. 文案一律走 i18n（`settings.*` / `home.*`），Koring 专属文案也放同一命名空间。
4. 不引入新的运行时依赖（不引 three.js / Tailwind / Radix），丝绸层用 CSS，组件用自建原语。
5. `SettingsPage.vue`（约 9000 行）只允许用 read/edit 工具精确修改；禁止用 PowerShell 拼字符串写 Vue 模板（会被反引号/引号解析毁掉文件）。
6. 提交前跑：`npm run typecheck` → `npx vitest run` → `npm run build` → `npx eslint . --quiet`。
