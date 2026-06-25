import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAccountsStore } from '../src/stores/accounts.store'
import type { Account } from '../src/types/account'

describe('accounts store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const store = useAccountsStore()

    expect(store.accounts).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('should have activeAccount computed property', () => {
    const store = useAccountsStore()
    expect(store.activeAccount).toBeNull()
  })

  it('should have isLoggedIn computed property', () => {
    const store = useAccountsStore()
    expect(store.isLoggedIn).toBe(false)
  })

  it('should have displayName computed property', () => {
    const store = useAccountsStore()
    expect(store.displayName).toBe('')
  })

  it('should find active account', () => {
    const store = useAccountsStore()
    const mockAccounts: Account[] = [
      { id: '1', name: 'User1', type: 'microsoft', isActive: 0 },
      { id: '2', name: 'User2', type: 'microsoft', isActive: 1 }
    ]

    store.accounts = mockAccounts
    expect(store.activeAccount?.id).toBe('2')
    expect(store.activeAccount?.name).toBe('User2')
  })

  it('should return correct isLoggedIn status', () => {
    const store = useAccountsStore()

    store.accounts = [{ id: '1', name: 'User1', type: 'microsoft', isActive: 1 }]
    expect(store.isLoggedIn).toBe(true)

    store.accounts = []
    expect(store.isLoggedIn).toBe(false)
  })

  it('should return correct displayName', () => {
    const store = useAccountsStore()

    store.accounts = [{ id: '1', name: 'TestUser', type: 'microsoft', isActive: 1 }]
    expect(store.displayName).toBe('TestUser')

    store.accounts = [{ id: '1', name: '', type: 'microsoft', isActive: 1 }]
    expect(store.displayName).toBe('未知用户')
  })

  it('should fetch accounts from electron API', async () => {
    const mockAccounts = [
      { id: '1', name: 'User1', type: 'microsoft', isActive: 1 }
    ]

    vi.mocked(window.electronAPI.account.list).mockResolvedValueOnce(mockAccounts as any)

    const store = useAccountsStore()
    await store.fetchAccounts()

    expect(store.accounts.length).toBe(1)
    expect(store.accounts[0].id).toBe('1')
    expect(store.accounts[0].name).toBe('User1')
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('should handle fetch error', async () => {
    vi.mocked(window.electronAPI.account.list).mockRejectedValueOnce(new Error('Network error'))

    const store = useAccountsStore()
    await store.fetchAccounts()

    expect(store.error).toBe('Network error')
    expect(store.loading).toBe(false)
  })
})
