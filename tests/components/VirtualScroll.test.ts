/**
 * VirtualScroll 组件测试
 * 覆盖：渲染、props、slots、空列表、暴露方法
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VirtualScroll from '../../src/components/common/VirtualScroll.vue'

function createItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`
  }))
}

describe('VirtualScroll - 渲染', () => {
  it('应有数据时渲染容器', () => {
    const wrapper = mount(VirtualScroll, {
      props: {
        items: createItems(100),
        itemHeight: 50,
        getItemKey: (item: any) => item.id
      }
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.virtual-scroll-container').exists()).toBe(true)
  })

  it('空数组时应正常渲染', () => {
    const wrapper = mount(VirtualScroll, {
      props: {
        items: [],
        itemHeight: 50,
        getItemKey: (item: any) => item.id
      }
    })
    expect(wrapper.exists()).toBe(true)
  })
})

describe('VirtualScroll - props', () => {
  it('应接受 itemHeight', () => {
    const wrapper = mount(VirtualScroll, {
      props: {
        items: createItems(10),
        itemHeight: 60,
        getItemKey: (item: any) => item.id
      }
    })
    expect(wrapper.props('itemHeight')).toBe(60)
  })

  it('应接受 overscan', () => {
    const wrapper = mount(VirtualScroll, {
      props: {
        items: createItems(10),
        itemHeight: 50,
        overscan: 10,
        getItemKey: (item: any) => item.id
      }
    })
    expect(wrapper.props('overscan')).toBe(10)
  })

  it('默认 overscan 应为 5', () => {
    const wrapper = mount(VirtualScroll, {
      props: {
        items: createItems(10),
        itemHeight: 50,
        getItemKey: (item: any) => item.id
      }
    })
    expect(wrapper.props('overscan')).toBe(5)
  })
})

describe('VirtualScroll - slots', () => {
  it('应渲染 item 插槽内容', () => {
    const wrapper = mount(VirtualScroll, {
      props: {
        items: createItems(10),
        itemHeight: 50,
        getItemKey: (item: any) => item.id
      },
      slots: {
        item: `<template #item="{ item }"><div class="test-item">{{ item.name }}</div></template>`
      }
    })
    expect(wrapper.find('.virtual-scroll-items').exists()).toBe(true)
  })
})

describe('VirtualScroll - 暴露方法', () => {
  it('应暴露 scrollToIndex', () => {
    const wrapper = mount(VirtualScroll, {
      props: {
        items: createItems(100),
        itemHeight: 50,
        getItemKey: (item: any) => item.id
      }
    })
    expect(typeof (wrapper.vm as any).scrollToIndex).toBe('function')
  })

  it('应暴露 scrollToTop', () => {
    const wrapper = mount(VirtualScroll, {
      props: {
        items: createItems(100),
        itemHeight: 50,
        getItemKey: (item: any) => item.id
      }
    })
    expect(typeof (wrapper.vm as any).scrollToTop).toBe('function')
  })
})
