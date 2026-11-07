<script setup lang="ts">
/**
 * Kor 页面外壳（移植自 Koring Launcher `page-shell/PageShell.tsx`）。
 *
 * 结构与行为对齐原版：
 * - 左侧分组导航（分组之间自动画分隔线），选中项由一条指示条按真实 DOM 位置滑动标记；
 * - 子页切换方向由条目在侧栏里的上下顺序决定：去更靠下的条目，新页从下方进入；
 * - 已访问的子页保活（keep-alive），切换时不卸载，滚动位置与表单状态得以保留；
 * - 带 onSelect 的条目是动作项（例如「开发者选项」跳转其它页面），不参与选中与翻页。
 *
 * Vue 化差异：原版用 item.content 传入子页节点，这里改用同名具名插槽
 * `page-<key>`，以便在模板里直接写子页内容。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'

import type { KorShellGroup, KorShellItem, KorShellNav } from './types'

const props = withDefaults(
  defineProps<{
    groups: KorShellGroup[]
    sidebarWidth?: number
    pageClassName?: string
    navLabel?: string
    keepAlive?: boolean
  }>(),
  { sidebarWidth: 220, pageClassName: 'kor-shell__page', navLabel: '页面导航', keepAlive: true }
)

const activeKey = defineModel<string>({ default: '' })

const sidebarGroups = computed(() =>
  props.groups
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.hidden) }))
    .filter((group) => group.items.length > 0)
)

const allItems = computed(() => props.groups.flatMap((group) => group.items))
const switchable = computed(() => allItems.value.filter((item) => !item.onSelect))
const order = computed(() => switchable.value.map((item) => item.key))

const firstKey = computed(() => {
  const visible = switchable.value.find((item) => !item.hidden)
  return (visible ?? switchable.value[0])?.key ?? ''
})

const current = computed({
  get: () => activeKey.value || firstKey.value,
  set: (next: string) => {
    activeKey.value = next
  }
})

const hasActive = computed(() => switchable.value.some((item) => item.key === current.value))

/** 已访问过的子页（keep-alive 白名单） */
const visited = ref<Record<string, boolean>>({})
/** 翻页过渡状态：from = 正在退出的页，dir = 新页进入方向 */
const transition = ref<{ from: string; dir: 'up' | 'down' } | null>(null)

let transitionTimer: ReturnType<typeof setTimeout> | undefined

function markVisited(key: string) {
  if (!key || visited.value[key]) return
  visited.value = { ...visited.value, [key]: true }
}

markVisited(current.value)

watch(current, (next, prev) => {
  if (!next || next === prev) return
  const fromIndex = order.value.indexOf(prev)
  const toIndex = order.value.indexOf(next)
  // 侧栏是纵向列表：去更靠下的条目，新页从下方进入、旧页向上退出；反之镜像。
  const dir: 'up' | 'down' = toIndex >= fromIndex ? 'down' : 'up'
  markVisited(next)
  transition.value = { from: prev, dir }
  if (transitionTimer) clearTimeout(transitionTimer)
  transitionTimer = setTimeout(() => {
    transition.value = null
  }, 460)
})

/* ---------------- 选中指示条：按实际 DOM 位置测量 ---------------- */
const navRef = ref<HTMLElement | null>(null)
const itemRefs = ref<Record<string, HTMLButtonElement | null>>({})
const indicatorTop = ref(0)

function setItemRef(key: string, el: unknown) {
  itemRefs.value[key] = (el as HTMLButtonElement | null) ?? null
}

function updateIndicator() {
  const nav = navRef.value
  const button = itemRefs.value[current.value]
  if (!nav || !button) return
  const navRect = nav.getBoundingClientRect()
  const rect = button.getBoundingClientRect()
  const next = rect.top - navRect.top + rect.height / 2 - 8
  if (Math.abs(next - indicatorTop.value) > 0.5) indicatorTop.value = next
}

let resizeObserver: ResizeObserver | null = null

function scheduleMeasure() {
  void nextTick(updateIndicator)
}

onMounted(() => {
  scheduleMeasure()
  window.addEventListener('resize', scheduleMeasure)
  if (typeof ResizeObserver !== 'undefined' && navRef.value) {
    resizeObserver = new ResizeObserver(scheduleMeasure)
    resizeObserver.observe(navRef.value)
  }
  document.fonts?.ready?.then(scheduleMeasure).catch(() => {})
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleMeasure)
  resizeObserver?.disconnect()
  if (transitionTimer) clearTimeout(transitionTimer)
})

watch([current, () => sidebarGroups.value.length], scheduleMeasure, { flush: 'post' })

/* ---------------- 对外导航 ---------------- */
function navigate(key: string) {
  if (key === current.value) return
  current.value = key
}

provide<KorShellNav>('kor-shell-nav', {
  get activeKey() {
    return current.value
  },
  navigate
})

function onItemClick(item: KorShellItem) {
  if (item.onSelect) {
    item.onSelect()
    return
  }
  navigate(item.key)
}

/* ---------------- 子页渲染（keep-alive） ---------------- */
const renderedPages = computed(() =>
  switchable.value.filter((item) =>
    props.keepAlive ? visited.value[item.key] : item.key === current.value
  )
)

function pageClass(key: string) {
  const active = key === current.value
  const leaving = transition.value?.from === key
  const dir = transition.value?.dir ?? 'down'
  return [
    props.pageClassName,
    { 'is-hidden': !active && !leaving },
    active && transition.value ? `is-entering-${dir}` : '',
    leaving ? `is-leaving-${dir}` : ''
  ]
}
</script>

<template>
  <div class="kor-shell">
    <aside v-if="sidebarGroups.length > 0" class="kor-shell__aside" :style="{ width: `${sidebarWidth}px` }">
      <slot name="sidebar-header" />
      <nav ref="navRef" class="kor-shell__nav" :aria-label="navLabel">
        <span
          v-if="hasActive"
          class="kor-shell__indicator"
          aria-hidden="true"
          :style="{ transform: `translateY(${indicatorTop}px)` }"
        />
        <div v-for="(group, groupIndex) in sidebarGroups" :key="group.title ?? groupIndex" class="kor-shell__group">
          <h4 v-if="group.title" class="kor-shell__group-title">{{ group.title }}</h4>
          <div class="kor-shell__list">
            <button
              v-for="item in group.items"
              :key="item.key"
              :ref="(el) => setItemRef(item.key, el)"
              type="button"
              class="kor-shell__item"
              :class="{
                'is-active': current === item.key && !item.onSelect,
                'is-action': Boolean(item.onSelect)
              }"
              :aria-current="current === item.key && !item.onSelect ? 'page' : undefined"
              :title="item.description ?? item.label"
              @click="onItemClick(item)"
            >
              <span v-if="$slots[`icon-${item.key}`]" class="kor-shell__icon">
                <slot :name="`icon-${item.key}`" />
              </span>
              <span class="kor-shell__text">
                <span class="kor-shell__label">{{ item.label }}</span>
                <span v-if="item.description" class="kor-shell__desc">{{ item.description }}</span>
              </span>
            </button>
          </div>
        </div>
      </nav>
      <slot name="sidebar-footer" />
    </aside>

    <main class="kor-shell__main">
      <div v-for="item in renderedPages" :key="item.key" :class="pageClass(item.key)">
        <slot :name="`page-${item.key}`" />
      </div>
    </main>
  </div>
</template>
