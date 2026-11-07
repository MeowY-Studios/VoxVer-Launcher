/**
 * KorVersionCard 测试：版本信息渲染、commit 为空时不渲染 meta 行、
 * 更新状态文案、clickable 时点击发 update。
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import KorVersionCard from '../../src/components/kor/version/KorVersionCard.vue'

describe('KorVersionCard', () => {
  it('渲染 label / 名称 / 版本号', () => {
    const wrapper = mount(KorVersionCard, {
      props: { version: '0.7.6', name: 'VoxVer', subName: 'Launcher' }
    })
    expect(wrapper.find('.kor-version-card__label').text()).toBe('正式版')
    expect(wrapper.find('.kor-version-card__name').text()).toContain('VoxVer')
    expect(wrapper.find('.kor-version-card__name').text()).toContain('Launcher')
    expect(wrapper.find('.kor-version-card__version').text()).toBe('v0.7.6')
  })

  it('commit 为空时不渲染 meta 行', () => {
    const wrapper = mount(KorVersionCard, { props: { version: '0.7.6' } })
    expect(wrapper.find('.kor-version-card__meta').exists()).toBe(false)
  })

  it('commit 有值时按「commit hash · #id」拼接', () => {
    const wrapper = mount(KorVersionCard, {
      props: { commit: '1a34c16', buildId: '42' }
    })
    expect(wrapper.find('.kor-version-card__meta').text()).toBe('commit 1a34c16 · #42')
  })

  it('只有 buildId 时只渲染 #id', () => {
    const wrapper = mount(KorVersionCard, { props: { buildId: '42' } })
    expect(wrapper.find('.kor-version-card__meta').text()).toBe('#42')
  })

  it('updateState=hasUpdate 时显示「发现新版本」', () => {
    const wrapper = mount(KorVersionCard, { props: { updateState: 'hasUpdate' } })
    expect(wrapper.find('.kor-version-card__state').text()).toBe('发现新版本')
  })

  it('updateState=latest 时不渲染状态行', () => {
    const wrapper = mount(KorVersionCard, { props: { updateState: 'latest' } })
    expect(wrapper.find('.kor-version-card__state').exists()).toBe(false)
  })

  it('clickable 时点击发出 update 事件', async () => {
    const wrapper = mount(KorVersionCard, { props: { clickable: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update')).toHaveLength(1)
  })

  it('不可点击时不发事件，也不渲染查看更新入口', async () => {
    const wrapper = mount(KorVersionCard, { props: { clickable: false } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update')).toBeUndefined()
    expect(wrapper.find('.kor-version-card__link').exists()).toBe(false)
  })
})
