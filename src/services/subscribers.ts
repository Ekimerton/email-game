import { extractEmailDomain, kvGet, kvPut, withKeyLock, type StorageBackend } from '../core'
import type { SubscriberEntry } from '../core'

const SUBSCRIBERS_KEY = 'subscribers:list'

export async function getSubscribers(kv: StorageBackend): Promise<SubscriberEntry[]> {
  const data = await kvGet(kv, SUBSCRIBERS_KEY)
  return Array.isArray(data) ? data : []
}

export async function addSubscriber(kv: StorageBackend, email: string): Promise<SubscriberEntry[]> {
  const cleanEmail = email.toLowerCase().trim()
  const domain = extractEmailDomain(cleanEmail)
  return withKeyLock(SUBSCRIBERS_KEY, async () => {
    const subscribers = await getSubscribers(kv)
    const existingIdx = subscribers.findIndex(s => s.email.toLowerCase().trim() === cleanEmail)

    if (existingIdx >= 0) {
      subscribers[existingIdx].status = 'active'
    } else {
      subscribers.push({
        email: cleanEmail,
        domain,
        subscribedAt: new Date().toISOString(),
        status: 'active'
      })
    }

    await kvPut(kv, SUBSCRIBERS_KEY, subscribers)
    return subscribers
  })
}

export async function removeSubscriber(kv: StorageBackend, email: string): Promise<SubscriberEntry[]> {
  const cleanEmail = email.toLowerCase().trim()
  return withKeyLock(SUBSCRIBERS_KEY, async () => {
    const subscribers = await getSubscribers(kv)
    const existingIdx = subscribers.findIndex(s => s.email.toLowerCase().trim() === cleanEmail)

    if (existingIdx >= 0) {
      subscribers[existingIdx].status = 'unsubscribed'
      await kvPut(kv, SUBSCRIBERS_KEY, subscribers)
    }
    return subscribers
  })
}

export async function unsubscribeUser(
  kv: StorageBackend,
  email: string,
  purge = false
): Promise<{ success: boolean; email: string; status: string; totalSubscribers: number; activeCount: number }> {
  const cleanEmail = email.toLowerCase().trim()
  return withKeyLock(SUBSCRIBERS_KEY, async () => {
    const subscribers = await getSubscribers(kv)
    const existingIdx = subscribers.findIndex(s => s.email.toLowerCase().trim() === cleanEmail)

    let status = 'not_found'
    if (existingIdx >= 0) {
      if (purge) {
        subscribers.splice(existingIdx, 1)
        status = 'purged'
      } else {
        subscribers[existingIdx].status = 'unsubscribed'
        status = 'unsubscribed'
      }
      await kvPut(kv, SUBSCRIBERS_KEY, subscribers)
    }

    const activeCount = subscribers.filter(s => s.status === 'active').length
    return {
      success: true,
      email: cleanEmail,
      status,
      totalSubscribers: subscribers.length,
      activeCount
    }
  })
}

// Auto-subscribe the user if they've opened the email game for the first time
export async function ensureSubscribedOnOpen(kv: StorageBackend, email: string): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim()
  return withKeyLock(SUBSCRIBERS_KEY, async () => {
    const subscribers = await getSubscribers(kv)
    const existing = subscribers.find(s => s.email.toLowerCase().trim() === cleanEmail)

    if (!existing) {
      const domain = extractEmailDomain(cleanEmail)
      subscribers.push({
        email: cleanEmail,
        domain,
        subscribedAt: new Date().toISOString(),
        status: 'active'
      })
      await kvPut(kv, SUBSCRIBERS_KEY, subscribers)
      return true
    }
    return existing.status === 'active'
  })
}

