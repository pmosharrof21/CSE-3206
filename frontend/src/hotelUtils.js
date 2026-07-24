export function filterHotels(hotels, search) {
  const query = (search || '').trim().toLowerCase()

  return (hotels || []).filter((hotel) => {
    const searchable = `${hotel.name || ''} ${hotel.city || ''}`.toLowerCase()
    return !query || searchable.includes(query)
  })
}

export function calculateStayNights(checkIn, checkOut, stayLength = 1) {
  if (!checkIn) return 1

  const from = new Date(checkIn)
  if (Number.isNaN(from.getTime())) return Math.max(stayLength, 1)

  if (checkOut) {
    const to = new Date(checkOut)
    if (!Number.isNaN(to.getTime())) {
      const diff = Math.ceil((to - from) / (1000 * 60 * 60 * 24))
      return diff > 0 ? diff : Math.max(stayLength, 1)
    }
  }

  return Math.max(stayLength, 1)
}

export function getCheckoutDate(checkIn, stayLength = 1) {
  if (!checkIn) return ''

  const from = new Date(checkIn)
  if (Number.isNaN(from.getTime())) return ''

  const to = new Date(from)
  to.setDate(from.getDate() + Math.max(stayLength, 1))
  return to.toISOString().split('T')[0]
}
