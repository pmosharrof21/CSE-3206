export const validateHotelListingForm = (form) => {
  const errors = []

  if (!form.name?.trim()) errors.push('Hotel name is required')
  if (!form.city?.trim()) errors.push('Location is required')
  if (!form.description?.trim()) errors.push('Description is required')
  if (!form.roomType?.trim()) errors.push('Room type is required')
  if (!form.imageFile) errors.push('Hotel image is required')

  const rent = Number(form.rent)
  if (!Number.isFinite(rent) || rent <= 0) errors.push('Rent must be a positive number')

  return errors
}
