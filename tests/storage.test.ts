import { describe, it, expect, beforeEach, vi } from 'vitest'
import { kvGet, kvPut, kvDelete, dbGet, dbPut, dbDelete, MEMORY_STORE, withKeyLock, type StorageBackend } from '../src/core'

describe('Core Storage (D1 & KV & Memory Store)', () => {
  beforeEach(() => {
    MEMORY_STORE.clear()
  })

  describe('Memory Fallback (No bindings)', () => {
    it('stores and retrieves data via in-memory fallback', async () => {
      await kvPut(undefined, 'test:key', { score: 100, solved: true })
      const val = await kvGet(undefined, 'test:key')
      expect(val).toEqual({ score: 100, solved: true })

      await kvDelete(undefined, 'test:key')
      const deletedVal = await kvGet(undefined, 'test:key')
      expect(deletedVal).toBeNull()
    })

    it('returns null for non-existent keys', async () => {
      const val = await kvGet(undefined, 'non_existent')
      expect(val).toBeNull()
    })

    it('works with dbGet/dbPut aliases', async () => {
      await dbPut(undefined, 'alias:key', 'hello')
      expect(await dbGet(undefined, 'alias:key')).toBe('hello')
      await dbDelete(undefined, 'alias:key')
      expect(await dbGet(undefined, 'alias:key')).toBeNull()
    })
  })

  describe('D1 Database backend', () => {
    it('reads and writes to D1Database when provided', async () => {
      const d1Store = new Map<string, string>()

      const mockDb: any = {
        prepare: vi.fn((query: string) => {
          let boundKey = ''
          let boundValue = ''
          let boundTime = ''

          const stmt: any = {
            bind: vi.fn((...args: any[]) => {
              if (query.includes('SELECT')) {
                boundKey = args[0]
              } else if (query.includes('INSERT')) {
                boundKey = args[0]
                boundValue = args[1]
                boundTime = args[2]
              } else if (query.includes('DELETE')) {
                boundKey = args[0]
              }
              return stmt
            }),
            first: vi.fn(async () => {
              const val = d1Store.get(boundKey)
              return val !== undefined ? { value: val } : null
            }),
            run: vi.fn(async () => {
              if (query.includes('INSERT')) {
                d1Store.set(boundKey, boundValue)
              } else if (query.includes('DELETE')) {
                d1Store.delete(boundKey)
              }
              return { success: true }
            }),
          }
          return stmt
        }),
      }

      const storage: StorageBackend = { DB: mockDb }

      await kvPut(storage, 'user:123', { name: 'Alice', rank: 1 })
      expect(mockDb.prepare).toHaveBeenCalled()
      expect(d1Store.has('user:123')).toBe(true)

      const retrieved = await kvGet(storage, 'user:123')
      expect(retrieved).toEqual({ name: 'Alice', rank: 1 })

      await kvDelete(storage, 'user:123')
      expect(d1Store.has('user:123')).toBe(false)
      const afterDelete = await kvGet(storage, 'user:123')
      expect(afterDelete).toBeNull()
    })

    it('auto-heals from KV to D1 if key is missing in D1', async () => {
      const d1Store = new Map<string, string>()
      const kvStore = new Map<string, any>()
      kvStore.set('legacy:key', { version: 1, migrated: false })

      const mockDb: any = {
        prepare: vi.fn((query: string) => {
          let boundKey = ''
          let boundVal = ''
          const stmt: any = {
            bind: vi.fn((...args: any[]) => {
              boundKey = args[0]
              if (args.length > 1) boundVal = args[1]
              return stmt
            }),
            first: vi.fn(async () => {
              const val = d1Store.get(boundKey)
              return val ? { value: val } : null
            }),
            run: vi.fn(async () => {
              d1Store.set(boundKey, boundVal)
              return { success: true }
            }),
          }
          return stmt
        }),
      }

      const mockKv: any = {
        get: vi.fn(async (k: string) => kvStore.get(k) || null),
        put: vi.fn(async (k: string, v: string) => kvStore.set(k, JSON.parse(v))),
        delete: vi.fn(async (k: string) => kvStore.delete(k)),
      }

      const storage: StorageBackend = { DB: mockDb, GAME_STATE_KV: mockKv }

      // Read key that only exists in KV
      const result = await kvGet(storage, 'legacy:key')
      expect(result).toEqual({ version: 1, migrated: false })
      expect(mockKv.get).toHaveBeenCalledWith('legacy:key', { type: 'json' })
      expect(mockDb.prepare).toHaveBeenCalled()
    })
  })

  describe('withKeyLock concurrency', () => {
    it('serializes concurrent modifications to the same key', async () => {
      let counter = 0
      const increment = async () => {
        return withKeyLock('counter-lock', async () => {
          const current = counter
          await new Promise((r) => setTimeout(r, 10))
          counter = current + 1
          return counter
        })
      }

      await Promise.all([increment(), increment(), increment(), increment()])
      expect(counter).toBe(4)
    })
  })
})
