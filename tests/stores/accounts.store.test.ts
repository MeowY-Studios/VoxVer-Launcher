/**
 * Accounts Store 测试 - 账户管理
 * 覆盖：默认值、计算属性、登录、登出、删除、账户切换
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAccountsStore } from '../../src/stores/accounts.store'
import type { Account } from '../../src/types/account'

function freshStore() {
  setActivePinia(createPinia())
  return useAccountsStore()
}

function mockAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: '1',
    type: 'microsoft',
    name: 'TestUser',
    uuid: 'uuid-123',
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    isActive: 1,
    skin_url: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    xuid: null,
    ...overrides
  }
}

describe('accounts store - 默认值', () => {
  it('应初始化为空账户列表', () => {
    const store = freshStore()
    expect(store.accounts).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('初始无活跃账户', () => {
    const store = freshStore()
    expect(store.activeAccount).toBeNull()
    expect(store.isLoggedIn).toBe(false)
    expect(store.displayName).toBe('')
  })
})

describe('accounts store - 计算属性', () => {
  it('activeAccount 应返回 isActive=1 的账户', () => {
    const store = freshStore()
    store.accounts = [
      mockAccount({ id: '1', name: 'Inactive', isActive: 0 }),
      mockAccount({ id: '2', name: 'Active', isActive: 1 })
    ]
    expect(store.activeAccount?.id).toBe('2')
    expect(store.activeAccount?.name).toBe('Active')
  })

  it('isLoggedIn 应在有活跃账户时为 true', () => {
    const store = freshStore()
    store.accounts = [mockAccount()]
    expect(store.isLoggedIn).toBe(true)
  })

  it('isLoggedIn 在空列表时为 false', () => {
    const store = freshStore()
    expect(store.isLoggedIn).toBe(false)
  })

  it('displayName 应返回活跃账户名称', () => {
    const store = freshStore()
    store.accounts = [mockAccount({ name: 'MyPlayer' })]
    expect(store.displayName).toBe('MyPlayer')
  })

  it('displayName 在名称为空时应返回"未知用户"', () => {
    const store = freshStore()
    store.accounts = [mockAccount({ name: '' })]
    expect(store.displayName).toBe('未知用户')
  })
})

describe('accounts store - fetchAccounts', () => {
  it('应成功获取并映射账户列表', async () => {
    const rawList = [
      {
        id: '1',
        type: 'microsoft',
        name: 'Player1',
        uuid: 'uuid-1',
        access_token: 'at-1',
        refresh_token: null,
        expires_at: null,
        is_active: 1,
        skin_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        xuid: null
      }
    ]
    vi.mocked(window.electronAPI.account.list).mockResolvedValueOnce(rawList)

    const store = freshStore()
    await store.fetchAccounts()

    expect(store.accounts).toHaveLength(1)
    expect(store.accounts[0].id).toBe('1')
    expect(store.accounts[0].name).toBe('Player1')
    expect(store.accounts[0].type).toBe('microsoft')
    expect(store.accounts[0].accessToken).toBe('at-1')
    expect(store.loading).toBe(false)
  })

  it('应处理空列表', async () => {
    vi.mocked(window.electronAPI.account.list).mockResolvedValueOnce([])
    const store = freshStore()
    await store.fetchAccounts()
    expect(store.accounts).toEqual([])
  })

  it('应在失败时设置 error', async () => {
    vi.mocked(window.electronAPI.account.list).mockRejectedValueOnce(new Error('Network error'))
    const store = freshStore()
    await store.fetchAccounts()
    expect(store.error).toBe('Network error')
    expect(store.loading).toBe(false)
  })
})

describe('accounts store - loginMicrosoft', () => {
  it('成功登录后应刷新账户列表', async () => {
    vi.mocked(window.electronAPI.account.loginMicrosoft).mockResolvedValueOnce({ ok: true } as any)
    vi.mocked(window.electronAPI.account.list).mockResolvedValueOnce([
      mockAccount({ name: 'LoggedIn' })
    ])

    const store = freshStore()
    const result = await store.loginMicrosoft()

    expect(result).toBe(true)
    expect(store.accounts).toHaveLength(1)
    expect(store.accounts[0].name).toBe('LoggedIn')
  })

  it('用户取消登录应返回 false', async () => {
    vi.mocked(window.electronAPI.account.loginMicrosoft).mockResolvedValueOnce({
      error: 'LOGIN_CANCELLED'
    } as any)

    const store = freshStore()
    const result = await store.loginMicrosoft()

    expect(result).toBe(false)
  })

  it('登录异常应设置错误并返回 false', async () => {
    vi.mocked(window.electronAPI.account.loginMicrosoft).mockRejectedValueOnce(new Error('Timeout'))
    const store = freshStore()
    const result = await store.loginMicrosoft()
    expect(result).toBe(false)
    expect(store.error).toBe('Timeout')
  })
})

describe('accounts store - loginOffline', () => {
  it('离线登录应刷新账户列表', async () => {
    vi.mocked(window.electronAPI.account.loginOffline).mockResolvedValueOnce({ ok: false } as any)
    vi.mocked(window.electronAPI.account.list).mockResolvedValueOnce([
      { id: '1', type: 'offline', name: 'OfflinePlayer', uuid: 'uuid-1', access_token: null, refresh_token: null, expires_at: null, is_active: 1, skin_url: null, created_at: '', updated_at: '', xuid: null }
    ])

    const store = freshStore()
    const result = await store.loginOffline('TestPlayer')

    expect(result).toBe(true)
  })
})

describe('accounts store - setActive', () => {
  it('应调用主进程切换活跃账户并刷新', async () => {
    vi.mocked(window.electronAPI.account.setActive).mockResolvedValueOnce(true)
    vi.mocked(window.electronAPI.account.list).mockResolvedValueOnce([
      { id: '2', type: 'microsoft', name: 'ActiveOne', uuid: 'u2', access_token: null, refresh_token: null, expires_at: null, is_active: 1, skin_url: null, created_at: '', updated_at: '', xuid: null },
      { id: '1', type: 'microsoft', name: 'Old', uuid: 'u1', access_token: null, refresh_token: null, expires_at: null, is_active: 0, skin_url: null, created_at: '', updated_at: '', xuid: null }
    ])

    const store = freshStore()
    await store.setActive('2')

    expect(window.electronAPI.account.setActive).toHaveBeenCalledWith('2')
    expect(store.accounts[0].id).toBe('2')
  })
})

describe('accounts store - deleteAccount', () => {
  it('应删除账户并从列表中移除', async () => {
    vi.mocked(window.electronAPI.account.delete).mockResolvedValueOnce(true)
    const store = freshStore()
    store.accounts = [mockAccount({ id: '1' }), mockAccount({ id: '2' })]

    await store.deleteAccount('1')

    expect(window.electronAPI.account.delete).toHaveBeenCalledWith('1')
    expect(store.accounts).toHaveLength(1)
    expect(store.accounts[0].id).toBe('2')
  })
})
