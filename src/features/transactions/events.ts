import { useEffect, useRef } from 'react'

/** Domain events emitted after a Folder contract write is confirmed on-chain. */
export interface DomainEventMap {
  'folder.claimed': { hash: string; ledger: number; owner: string; folderName: string }
  'portfolio.minted': { hash: string; ledger: number; owner: string; templateId: number; ipfsCid: string }
  'portfolio.updated': { hash: string; ledger: number; owner: string; ipfsCid: string }
}

export type DomainEventName = keyof DomainEventMap

export type DomainEventListener<K extends DomainEventName> = (payload: DomainEventMap[K]) => void

type AnyListener = (payload: never) => void

const listeners = new Map<DomainEventName, Set<AnyListener>>()

/** Subscribes to `event`; returns an unsubscribe function. */
export const on = <K extends DomainEventName>(event: K, listener: DomainEventListener<K>): (() => void) => {
  let set = listeners.get(event)
  if (!set) {
    set = new Set()
    listeners.set(event, set)
  }
  set.add(listener as AnyListener)
  return () => off(event, listener)
}

/** Removes a listener previously added with `on`. */
export const off = <K extends DomainEventName>(event: K, listener: DomainEventListener<K>): void => {
  const set = listeners.get(event)
  if (!set) return
  set.delete(listener as AnyListener)
  if (set.size === 0) listeners.delete(event)
}

/** Emits `event` to every current subscriber. A throwing listener never breaks the others. */
export const emit = <K extends DomainEventName>(event: K, payload: DomainEventMap[K]): void => {
  const set = listeners.get(event)
  if (!set) return
  for (const listener of [...set]) {
    try {
      ;(listener as DomainEventListener<K>)(payload)
    } catch {
      // A subscriber must not break the emitter or other subscribers.
    }
  }
}

/** Number of live listeners for `event` (or all events); used to assert cleanup in tests. */
export const listenerCount = (event?: DomainEventName): number => {
  if (event) return listeners.get(event)?.size ?? 0
  let total = 0
  for (const set of listeners.values()) total += set.size
  return total
}

/** Removes every listener; intended for tests and teardown. */
export const clearDomainEvents = (): void => {
  listeners.clear()
}

/**
 * Subscribes to a domain event for the lifetime of the component. The latest `handler` is always
 * used, so callers do not need to memoise it; the subscription is removed on unmount.
 */
export const useDomainEvent = <K extends DomainEventName>(event: K, handler: DomainEventListener<K>): void => {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const listener: DomainEventListener<K> = (payload) => handlerRef.current(payload)
    return on(event, listener)
  }, [event])
}
