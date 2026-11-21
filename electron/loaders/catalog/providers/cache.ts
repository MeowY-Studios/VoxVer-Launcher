/**
 * 目录层的元数据缓存
 * 加载器元数据在短时间内不会变化，缓存可以减少 UI 支持性查询和安装前的重复请求。
 */
const DEFAULT_TTL = 10 * 60 * 1000

interface CacheEntry {
  at: number
  value: unknown
}

const store = new Map<string, CacheEntry>()
const pending = new Map<string, Promise<unknown>>()

/**
 * 读取带 TTL 的缓存；同一个 key 的并发请求会复用同一个 Promise
 */
export function cached<T>(key: string, loader: () => Promise<T>, ttl = DEFAULT_TTL): Promise<T> {
  const hit = store.get(key)
  if (hit && Date.now() - hit.at < ttl) {
    return Promise.resolve(hit.value as T)
  }

  const inflight = pending.get(key)
  if (inflight) {
    return inflight as Promise<T>
  }

  const task = loader().then(
    (value) => {
      store.set(key, { at: Date.now(), value })
      pending.delete(key)
      return value
    },
    (error: unknown) => {
      pending.delete(key)
      throw error
    }
  )
  pending.set(key, task)
  return task
}

/** 清空缓存（测试或手动刷新时使用） */
export function clearCatalogCache(): void {
  store.clear()
  pending.clear()
}
