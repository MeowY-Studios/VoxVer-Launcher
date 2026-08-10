/**
 * HomePage 页面测试
 * 覆盖：渲染、快捷操作按钮、接收分享弹窗
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
        img: { template: '<div class="hero-logo-img" />', props: ['src', 'alt'] },
        ReceiveModal: { template: '<div />' }
      }
    }
  })
}

describe('HomePage - 渲染', () => {
  it('应渲染欢迎卡片', () => {
    const wrapper = mountHome()
    expect(wrapper.find('.hero-title').exists()).toBe(true)
    // home.welcomeTip 文本
    expect(wrapper.text()).toContain('在左侧选择版本')
  })

  it('应渲染 Bento Grid 布局', () => {
    const wrapper = mountHome()
    expect(wrapper.find('.bento-grid').exists()).toBe(true)
  })

  it('应包含 VoxVer logo', () => {
    const wrapper = mountHome()
    expect(wrapper.find('.hero-logo-img').exists()).toBe(true)
  })
})

describe('HomePage - 快捷操作', () => {
  it('应渲染 4 个快捷操作按钮', () => {
    const wrapper = mountHome()
    const btns = wrapper.findAll('.bento-card--actions .action-btn')
    expect(btns).toHaveLength(4)
  })

  it('应有下载按钮', () => {
    const wrapper = mountHome()
    expect(wrapper.text()).toContain('下载')
  })

  it('应有设置按钮', () => {
    const wrapper = mountHome()
    expect(wrapper.text()).toContain('设置')
  })

  it('应有账户按钮', () => {
    const wrapper = mountHome()
    expect(wrapper.text()).toContain('账户')
  })

  it('应有接收分享按钮', () => {
    const wrapper = mountHome()
    expect(wrapper.text()).toContain('接收分享')
  })
})

describe('HomePage - 接收分享弹窗', () => {
  it('点击接收分享按钮不报错', async () => {
    const wrapper = mountHome()
    const btn = wrapper.findAll('.bento-card--actions .action-btn')[3]
    expect(btn.text()).toContain('接收分享')
    // 点击不应抛出异常
    await expect(btn.trigger('click')).resolves.toBeUndefined()
  })
})
