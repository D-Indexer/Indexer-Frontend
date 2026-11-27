import { describe, expect, it } from 'vitest'
import { useActivityStore } from './activityStore'

describe('useActivityStore', () => {
  it('records, updates and clears transactions per address', () => {
    const store = useActivityStore.getState()
    const address = 'GBJ7...ALICE'

    store.clearActivities(address)
    expect(store.getActivities(address)).toEqual([])

    const id = store.addActivity({
      address,
      method: 'claim_folder',
      status: 'pending',
      hash: null,
    })

    let activities = store.getActivities(address)
    expect(activities.length).toBe(1)
    expect(activities[0].status).toBe('pending')
    expect(activities[0].method).toBe('claim_folder')

    store.updateActivity(id, address, { status: 'success', hash: 'stellarhash123' })
    activities = store.getActivities(address)
    expect(activities[0].status).toBe('success')
    expect(activities[0].hash).toBe('stellarhash123')

    store.clearActivities(address)
    expect(store.getActivities(address)).toEqual([])
  })
})
