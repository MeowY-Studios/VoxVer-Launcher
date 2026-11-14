/**
 * HomePage 页面测试
 * 覆盖：原版首页留空、Koring 首页标题、logo 已移除
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'
import HomePage from '../../src/pages/HomePage.vue'
import zhCN from '../../src/locale/zh-CN'

const router = createRouter({ history: createWebHashHistory(), routes: [] })

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN }
})

function mountHome() {
  setActivePinia(createPinia())
  return mount(HomePage, {
    global: {
      plugins: [router, i18n],
      stubs: {
        ReceiveModal: { template: '<div />' }
      }
    }
  })
}

describe('HomePage - 原版首页', () => {
  it('应渲染内容区容器', () => {
    const wrapper = mountHome()
    expect(wrapper.find('.c-page').exists()).toBe(true)
  })

  it('内容区留空：不再有启动面板与常用入口', () => {
    const wrapper = mountHome()
    expect(wrapper.find('.home-launch').exists()).toBe(false)
    expect(wrapper.findAll('.home-quick')).toHaveLength(0)
    expect(wrapper.findAll('.c-card')).toHaveLength(0)
  })

  it('未选版本时内容区仍为空容器（不主动提示）', () => {
    const wrapper = mountHome()
    expect(wrapper.find('.home-blank').exists()).toBe(true)
  })

  it('不应再渲染 VoxVer logo', () => {
    const wrapper = mountHome()
    expect(wrapper.html()).not.toContain('Alogo')
  })
})
