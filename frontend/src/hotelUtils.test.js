import { describe, expect, it } from 'vitest'
import { calculateStayNights, filterHotels, getCheckoutDate } from './hotelUtils'

describe('filterHotels', () => {
  it('filters hotels by the search term', () => {
    const hotels = [
      { id: 1, name: 'The Grand Dhaka', city: 'Dhaka' },
      { id: 2, name: 'Seaside Resort', city: 'Cox\'s Bazar' },
    ]

    expect(filterHotels(hotels, 'dhaka', '2 guests')).toHaveLength(1)
    expect(filterHotels(hotels, 'resort', '2 guests')[0].name).toBe('Seaside Resort')
  })

  it('ignores guest count when filtering hotels', () => {
    const hotels = [
      { id: 1, name: 'The Grand Dhaka', city: 'Dhaka' },
    ]

    expect(filterHotels(hotels, 'dhaka', '8 guests')).toHaveLength(1)
  })

  it('calculates stay length from check-in and nights when checkout is missing', () => {
    expect(calculateStayNights('2026-07-21', '', 3)).toBe(3)
  })

  it('returns the expected checkout date for a selected stay length', () => {
    expect(getCheckoutDate('2026-07-21', 3)).toBe('2026-07-24')
  })
})
