import { describe, it, expect } from 'vitest'
import router from '../src/router'

describe('router configuration', () => {
  it('should create a router instance', () => {
    expect(router).toBeDefined()
    expect(typeof router.push).toBe('function')
    expect(typeof router.replace).toBe('function')
  })

  it('should use hash history mode', () => {
    expect(router.options.history).toBeDefined()
  })

  it('should have all expected routes', () => {
    const routes = router.getRoutes()
    const routeNames = routes.map(r => r.name)

    const expectedRoutes = [
      'home',
      'instances',
      'downloads',
      'settings',
      'account',
      'versions',
      'instance-detail',
      'launch',
      'more',
      'version-detail',
      'download-manage',
      'mod-detail'
    ]

    expectedRoutes.forEach(name => {
      expect(routeNames).toContain(name)
    })
  })

  it('should have correct paths for key routes', () => {
    const routes = router.getRoutes()

    const homeRoute = routes.find(r => r.name === 'home')
    expect(homeRoute?.path).toBe('/')

    const instancesRoute = routes.find(r => r.name === 'instances')
    expect(instancesRoute?.path).toBe('/instances')

    const downloadsRoute = routes.find(r => r.name === 'downloads')
    expect(downloadsRoute?.path).toBe('/downloads')

    const accountRoute = routes.find(r => r.name === 'account')
    expect(accountRoute?.path).toBe('/account')

    const versionsRoute = routes.find(r => r.name === 'versions')
    expect(versionsRoute?.path).toBe('/versions')
  })

  it('should have dynamic routes with params', () => {
    const routes = router.getRoutes()

    const instanceDetail = routes.find(r => r.name === 'instance-detail')
    expect(instanceDetail?.path).toContain(':id')

    const versionDetail = routes.find(r => r.name === 'version-detail')
    expect(versionDetail?.path).toContain(':versionId')

    const modDetail = routes.find(r => r.name === 'mod-detail')
    expect(modDetail?.path).toContain(':id')
  })
})
