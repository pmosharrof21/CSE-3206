import { describe, expect, it } from 'vitest'
import { validateHotelListingForm } from './hotelListing'

describe('validateHotelListingForm', () => {
  it('requires essential hotel and room details', () => {
    expect(validateHotelListingForm({
      name: '',
      city: '',
      description: '',
      roomType: '',
      rent: '',
      imageFile: null,
    })).toEqual([
      'Hotel name is required',
      'Location is required',
      'Description is required',
      'Room type is required',
      'Hotel image is required',
      'Rent must be a positive number',
    ])
  })

  it('accepts complete listing data', () => {
    expect(validateHotelListingForm({
      name: 'Ocean View Resort',
      city: 'Cox\'s Bazar',
      description: 'A peaceful beachfront stay.',
      roomType: 'Deluxe Suite',
      rent: '180',
      imageFile: { name: 'hotel.jpg' },
    })).toEqual([])
  })
})
