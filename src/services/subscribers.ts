import { extractEmailDomain, kvGet, kvPut, withKeyLock, type StorageBackend, type EmailFrequency } from '../core'
import type { SubscriberEntry } from '../core'
import { getSubscriberInactivityStatus, INACTIVITY_WARNING_DAYS, INACTIVITY_UNSUBSCRIBE_DAYS } from './userService'
import { sendInactivityUnsubscribeEmail, sendInactivityWarningEmail } from '../email/emailService'

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
      if (subscribers[existingIdx].status !== 'active' || !subscribers[existingIdx].subscribedAt) {
        subscribers[existingIdx].subscribedAt = new Date().toISOString()
      }
      subscribers[existingIdx].status = 'active'
      subscribers[existingIdx].pausedUntil = null
      subscribers[existingIdx].inactivityWarningSentForPuzzle = null
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

export async function updateSubscriberDeliveryPreferences(
  kv: StorageBackend,
  email: string,
  updates: {
    emailFrequency?: EmailFrequency
    pausedUntil?: string | null
    confirmActive?: boolean
    reactivate?: boolean
  }
): Promise<SubscriberEntry> {
  const cleanEmail = email.toLowerCase().trim()
  const domain = extractEmailDomain(cleanEmail)
  const nowIso = new Date().toISOString()

  return withKeyLock(SUBSCRIBERS_KEY, async () => {
    const subscribers = await getSubscribers(kv)
    let existingIdx = subscribers.findIndex(s => s.email.toLowerCase().trim() === cleanEmail)

    if (existingIdx < 0) {
      subscribers.push({
        email: cleanEmail,
        domain,
        subscribedAt: nowIso,
        status: updates.reactivate ? 'active' : 'unsubscribed',
      })
      existingIdx = subscribers.length - 1
    }

    const entry = subscribers[existingIdx]
    if (updates.reactivate) {
      if (entry.status !== 'active' || !entry.subscribedAt) {
        entry.subscribedAt = nowIso
      }
      entry.status = 'active'
    }
    if (updates.emailFrequency !== undefined) {
      entry.emailFrequency = updates.emailFrequency
    }
    if (updates.pausedUntil !== undefined) {
      entry.pausedUntil = updates.pausedUntil
    }
    if (updates.confirmActive) {
      entry.inactivityConfirmedAt = nowIso
      entry.inactivityWarningSentForPuzzle = null
    }

    await kvPut(kv, SUBSCRIBERS_KEY, subscribers)
    return entry
  })
}

export async function markInactivityWarningSent(
  kv: StorageBackend,
  email: string,
  puzzleId: string | number
): Promise<void> {
  const cleanEmail = email.toLowerCase().trim()
  const cleanPuzzleId = String(puzzleId).replace('#', '').trim()
  await withKeyLock(SUBSCRIBERS_KEY, async () => {
    const subscribers = await getSubscribers(kv)
    const entry = subscribers.find(s => s.email.toLowerCase().trim() === cleanEmail)
    if (entry) {
      entry.inactivityWarningSentForPuzzle = cleanPuzzleId
      await kvPut(kv, SUBSCRIBERS_KEY, subscribers)
    }
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

export async function processInactiveSubscribers(
  kv: StorageBackend,
  currentPuzzleId: string | number,
  options?: {
    isDryRun?: boolean
    origin?: string
    authSecret?: string
    mailgunApiKey?: string
    mailgunDomain?: string
    senderEmail?: string
    targetDate?: string
  }
): Promise<{
  unsubscribedCount: number
  unsubscribedEmails: string[]
  warnedCount: number
  warnedEmails: string[]
}> {
  const subscribers = await getSubscribers(kv)
  const activeSubscribers = subscribers.filter(s => s.status === 'active')
  const unsubscribedEmails: string[] = []
  const warnedEmails: string[] = []

  for (const subscriber of activeSubscribers) {
    const status = await getSubscriberInactivityStatus(
      kv,
      subscriber.email,
      currentPuzzleId,
      subscriber,
      { targetDate: options?.targetDate }
    )

    if (status === 'warn') {
      warnedEmails.push(subscriber.email)
      if (options?.isDryRun) {
        console.log(`[Inactive Check] [DRY RUN] Would send check-in email to ${subscriber.email} due to ${INACTIVITY_WARNING_DAYS} consecutive games without submission`)
      } else {
        await markInactivityWarningSent(kv, subscriber.email, currentPuzzleId)
        await sendInactivityWarningEmail({
          apiKey: options?.mailgunApiKey,
          domain: options?.mailgunDomain,
          from: options?.senderEmail,
          to: subscriber.email,
          origin: options?.origin,
          authSecret: options?.authSecret,
          inactiveDays: INACTIVITY_WARNING_DAYS,
        })
      }
    } else if (status === 'unsubscribe') {
      unsubscribedEmails.push(subscriber.email)
      if (options?.isDryRun) {
        console.log(`[Inactive Check] [DRY RUN] Would unsubscribe ${subscriber.email} due to ${INACTIVITY_UNSUBSCRIBE_DAYS} consecutive games without submission`)
      } else {
        await unsubscribeUser(kv, subscriber.email)
        await sendInactivityUnsubscribeEmail({
          apiKey: options?.mailgunApiKey,
          domain: options?.mailgunDomain,
          from: options?.senderEmail,
          to: subscriber.email,
          origin: options?.origin,
          authSecret: options?.authSecret,
          inactiveDays: INACTIVITY_UNSUBSCRIBE_DAYS,
        })
      }
    }
  }

  return {
    unsubscribedCount: unsubscribedEmails.length,
    unsubscribedEmails,
    warnedCount: warnedEmails.length,
    warnedEmails,
  }
}

