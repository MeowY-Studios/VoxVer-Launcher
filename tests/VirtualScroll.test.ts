import { describe, it, expect, mount } from 'vitest'
import { mount as vueMount } from '@vue/test-utils'
import VirtualScroll from '../src/components/common/VirtualScroll.vue'

const mount = vueMount

function createItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`
  }))
}

describe('VirtualScroll', () => {
  it('should render correctly with items', () => {
    const items = createItems(100)
    const wrapper = mount(VirtualScroll, {
      props: {
        items,
        itemHeight: 50,
        getItemKey: (item: any) => item.id
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.virtual-scroll-container').exists()).toBe(true)
  })

  it('should accept itemHeight prop', () => {
    const items = createItems(100)
    const wrapper = mount(VirtualScroll, {
      props: {
        items,
        itemHeight: 60,
        getItemKey: (item: any) => item.id
      }
    })

    expect(wrapper.props('itemHeight')).toBe(60)
  })

  it('should accept overscan prop', () => {
    const items = createItems(100)
    const wrapper = mount(VirtualScroll, {
      props: {
        items,
        itemHeight: 50,
        overscan: 10,
        getItemKey: (item: any) => item.id
      }
    })

    expect(wrapper.props('overscan')).toBe(10)
  })

  it('should render slot content', () => {
    const items = createItems(10)
    const wrapper = mount(VirtualScroll, {
      props: {
        items,
        itemHeight: 50,
        getItemKey: (item: any) => item.id
      },
      slots: {
        item: `<template #item="{ item }"><div class="test-item">{{ item.name }}</div></template>`
      }
    })

    expect(wrapper.find('.virtual-scroll-items').exists()).toBe(true)
  })

  it('should handle empty items array', () => {
    const wrapper = mount(VirtualScroll, {
      props: {
        items: [],
        itemHeight: 50,
        getItemKey: (item: any) => item.id
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should expose scrollToIndex method', () => {
    const items = createItems(100)
    const wrapper = mount(VirtualScroll, {
      props: {
        items,
        itemHeight: 50,
        getItemKey: (item: any) => item.id
      }
    })

    const vm = wrapper.vm as any
    expect(typeof vm.scrollToIndex).toBe('function')
  })

  it('should expose scrollToTop method', () => {
    const items = createItems(100)
    const wrapper = mount(VirtualScroll, {
      props: {
        items,
        itemHeight: 50,
        getItemKey: (item: any) => item.id
      }
    })

    const vm = wrapper.vm as any
    expect(typeof vm.scrollToTop).toBe('function')
  })
})
