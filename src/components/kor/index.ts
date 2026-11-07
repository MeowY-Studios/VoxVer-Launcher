/**
 * Kor 组件层统一出口。
 *
 * 组件来源：Koring Launcher（MIT）的 React 组件，逐个移植为 Vue 3 SFC。
 * 与 src/components/settings/ 的区别：settings/* 是两套皮肤共用的小原语，
 * kor/* 是「Koring 排版」的完整组件体系（外壳 + 设置 + UI + 品牌件）。
 */

// ui
export { default as KorButton } from './ui/KorButton.vue'
export { default as KorSurface } from './ui/KorSurface.vue'
export { default as KorBadge } from './ui/KorBadge.vue'
export { default as KorSeparator } from './ui/KorSeparator.vue'
export { default as KorSwitch } from './ui/KorSwitch.vue'
export { default as KorSlider } from './ui/KorSlider.vue'
export { default as KorSelect } from './ui/KorSelect.vue'
export { default as KorInput } from './ui/KorInput.vue'
export { default as KorSkeleton } from './ui/KorSkeleton.vue'
export { default as KorProgress } from './ui/KorProgress.vue'
export { default as KorEmpty } from './ui/KorEmpty.vue'
export { default as KorFadeText } from './ui/KorFadeText.vue'

// setting
export { default as KorPageHeader } from './setting/KorPageHeader.vue'
export { default as KorSectionTitle } from './setting/KorSectionTitle.vue'
export { default as KorSettingCard } from './setting/KorSettingCard.vue'
export { default as KorSettingRow } from './setting/KorSettingRow.vue'
export { default as KorSettingBadge } from './setting/KorSettingBadge.vue'
export { default as KorSettingListItem } from './setting/KorSettingListItem.vue'

// 设置页常用控件的别名（Koring 里都叫 SettingXxx，这里保持同名以便对照原版源码）
export { default as KorSettingSwitch } from './ui/KorSwitch.vue'
export { default as KorSettingSlider } from './ui/KorSlider.vue'
export { default as KorSettingSelect } from './ui/KorSelect.vue'
export { default as KorSettingInput } from './ui/KorInput.vue'

// shell
export { default as KorPageShell } from './shell/KorPageShell.vue'

// silk / version
export { default as KorSilk } from './silk/KorSilk.vue'
export { default as KorVersionCard } from './version/KorVersionCard.vue'
