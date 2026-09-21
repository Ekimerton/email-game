import { extractEmailDomain, kvGet, kvPut } from '../core'
import type { SubscriberEntry } from '../core'

export async function getSubscribers(kv: KVNamespace | undefined): Promise<SubscriberEntry[]> {
  const data = await kvGet(kv, 'subscribers:list')
  return Array.isArray(data) ? data : []
}

export async function addSubscriber(kv: KVNamespace | undefined, email: string): Promise<SubscriberEntry[]> {
  const domain = extractEmailDomain(email)
  const subscribers = await getSubscribers(kv)
  const existingIdx = subscribers.findIndex(s => s.email === email)

  if (existingIdx >= 0) {
    subscribers[existingIdx].status = 'active'
  } else {
    subscribers.push({
      email,
      domain,
      subscribedAt: new Date().toISOString(),
      status: 'active'
    })
  }

  await kvPut(kv, 'subscribers:list', subscribers)
  return subscribers
}

export async function removeSubscriber(kv: KVNamespace | undefined, email: string): Promise<SubscriberEntry[]> {
  const subscribers = await getSubscribers(kv)
  const existingIdx = subscribers.findIndex(s => s.email === email)

  if (existingIdx >= 0) {
    subscribers[existingIdx].status = 'unsubscribed'
    await kvPut(kv, 'subscribers:list', subscribers)
  }
  return subscribers
}

export async function unsubscribeUser(
  kv: KVNamespace | undefined,
  email: string,
  purge = false
): Promise<{ success: boolean; email: string; status: string; totalSubscribers: number; activeCount: number }> {
  const cleanEmail = email.toLowerCase().trim()
  const subscribers = await getSubscribers(kv)
  const existingIdx = subscribers.findIndex(s => s.email === cleanEmail)

  let status = 'not_found'
  if (existingIdx >= 0) {
    if (purge) {
      subscribers.splice(existingIdx, 1)
      status = 'purged'
    } else {
      subscribers[existingIdx].status = 'unsubscribed'
      status = 'unsubscribed'
    }
    await kvPut(kv, 'subscribers:list', subscribers)
  }

  const activeCount = subscribers.filter(s => s.status === 'active').length
  return {
    success: true,
    email: cleanEmail,
    status,
    totalSubscribers: subscribers.length,
    activeCount
  }
}

// Auto-subscribe the user if they've opened the email game for the first time
export async function ensureSubscribedOnOpen(kv: KVNamespace | undefined, email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim()
  const subscribers = await getSubscribers(kv)
  const existing = subscribers.find(s => s.email === cleanEmail)

  if (!existing) {
    await addSubscriber(kv, cleanEmail)
  }
}
