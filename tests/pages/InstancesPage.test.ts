/**
 * InstancesPage 页面测试
 * 实例管理模块当前处于「暂未开放」占位状态，仅覆盖占位页渲染
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'
import InstancesPage from '../../src/pages/InstancesPage.vue'
import zhCN from '../../src/locale/zh-CN'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/instances', component: { template: '<div />' } }
  ]
})

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN }
})

function mountInstances() {
  setActivePinia(createPinia())
  return mount(InstancesPage, {
    global: { plugins: [router, i18n] }
  })
}

describe('InstancesPage - 占位页', () => {
  it('应渲染页面容器', () => {
    const wrapper = mountInstances()
    expect(wrapper.find('.instances-page').exists()).toBe(true)
  })

  it('应显示占位图标', () => {
    const wrapper = mountInstances()
    expect(wrapper.find('.coming-soon-icon svg').exists()).toBe(true)
  })

  it('应显示模块标题', () => {
    const wrapper = mountInstances()
    expect(wrapper.find('.coming-soon-title').text()).toBe('实例管理')
  })

  it('应显示暂未开放提示', () => {
    const wrapper = mountInstances()
    expect(wrapper.find('.coming-soon-desc').text()).toBe('该区域功能暂未开放，敬请期待')
  })
})
