import { useEffect, useState } from 'react'
import api from './api'
import { calculateStayNights, filterHotels, getCheckoutDate } from './hotelUtils'
import {
  formatCurrency,
  isSignInFormValid,
  persistAuthState,
  persistUserCredential,
  readUserCredential,
  resetUserPassword,
  checkUserUniqueness,
  addStoredUser,
  findStoredUserByLogin,
  findStoredUserByIdentifier,
  clearStoredUsers,
  removeLegacyUserCredentials,
  updateStoredUser,
} from './formatting'
import { jsPDF } from 'jspdf'
import { validateHotelListingForm } from './hotelListing'

const sampleHotels = [
  { id: 1, name: 'The Grand Dhaka', city: 'Dhaka', rating: 4.8, description: 'A refined retreat in the heart of the capital.', image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80', amenities: ['Pool', 'Spa', 'Breakfast'] },
  { id: 2, name: 'Bayview Beach Resort', city: "Cox's Bazar", rating: 4.7, description: 'Oceanfront rooms with serene views of the longest beach in the world.', image_url: 'https://images.unsplash.com/photo-1501117716987-c8e26f1cf7a1?auto=format&fit=crop&w=900&q=80', amenities: ['Beach access', 'Seafood dining', 'Free Wi-Fi'] },
  { id: 3, name: 'Tea Garden Lodge', city: 'Sylhet', rating: 4.7, description: 'Quiet comfort surrounded by lush green tea gardens.', image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80', amenities: ['Garden', 'Airport shuttle', 'Breakfast'] },
]

const createEmptyListingForm = () => ({
  name: '',
  city: '',
  description: '',
  roomType: '',
  rent: '',
  imageFile: null,
  imagePreview: '',
})

export default function App() {
  const [hotels, setHotels] = useState(sampleHotels)
  const [search, setSearch] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [stayLength, setStayLength] = useState(2)
  const [message, setMessage] = useState('Select a stay and explore the available rooms.')
  const [authMessage, setAuthMessage] = useState('')
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [roomSelections, setRoomSelections] = useState({})
  const [showListHotel, setShowListHotel] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [accountEmail, setAccountEmail] = useState('')
  const [accountUsername, setAccountUsername] = useState('')
  const [accountPhone, setAccountPhone] = useState('')
  const [accountFullName, setAccountFullName] = useState('')
  const [accountAddress, setAccountAddress] = useState('')
  const [accountIdentifier, setAccountIdentifier] = useState('')
  const [page, setPage] = useState('home')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ email: '', password: '', username: '', phone: '' })
  const [bookedReservation, setBookedReservation] = useState(null)
  const [pendingHotel, setPendingHotel] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [listingForm, setListingForm] = useState(createEmptyListingForm)
  const [listingError, setListingError] = useState([])
  const [listingSubmitting, setListingSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (!window.localStorage.getItem('accountsClearedOnce')) {
        removeLegacyUserCredentials()
        clearStoredUsers()
        window.localStorage.setItem('accountsClearedOnce', 'true')
        persistAuthState('', false)
      }
    }

    api.get('hotels/')
      .then((response) => setHotels(response.data.results || response.data))
      .catch(() => setMessage('The API is unavailable right now, so the sample listings are being shown.'))
  }, [])

  useEffect(() => {
    if (!checkIn) {
      setCheckOut('')
      return
    }

    setCheckOut(getCheckoutDate(checkIn, stayLength))
  }, [checkIn, stayLength])

  // Keep selectedHotel cleared when navigating away from home
  useEffect(() => {
    if (page !== 'rooms' && selectedHotel) setSelectedHotel(null)
  }, [page])

  const visible = filterHotels(hotels, search)

  const handleSearch = () => {
    if (visible.length) {
      setMessage(`Showing ${visible.length} stay${visible.length > 1 ? 's' : ''} matching your search.`)
    } else {
      setMessage('No hotels matched that search yet. Try another city or hotel name.')
    }
  }

  const updateRoomSelection = (roomId, field, value) => {
    setRoomSelections((previous) => ({
      ...previous,
      [roomId]: { ...previous[roomId], [field]: value },
    }))
  }

  const updateListingForm = (field, value) => {
    setListingForm((previous) => ({ ...previous, [field]: value }))
  }

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const getRoomSelection = (room) => {
    const selection = roomSelections[room.id] || {}
    return {
      quantity: selection.quantity || 1,
    }
  }

  const getEffectiveStayNights = () => calculateStayNights(checkIn, checkOut, stayLength)

  const handleViewRooms = (hotel, forceView = false) => {
    if (!signedIn && !forceView) {
      setPendingHotel(hotel)
      setAuthMode('login')
      setAuthMessage('')
      setMessage('Please log in to continue.')
      setShowSignIn(true)
      return
    }

    setPendingHotel(null)
    setSelectedHotel(hotel)
    setRoomSelections({})
    setPage('rooms')
    setLoadingRooms(true)
    setMessage(`Loading rooms for ${hotel.name}...`)

    api.get('rooms/')
      .then((response) => {
        const roomData = response.data.results || response.data
        const hotelRooms = roomData.filter((room) => room.hotel === hotel.id || room.hotel?.id === hotel.id)
        if (hotelRooms.length) {
          setRooms(hotelRooms)
          setMessage(`Showing ${hotelRooms.length} room${hotelRooms.length > 1 ? 's' : ''} for ${hotel.name}.`)
        } else {
          setRooms([
            { id: `${hotel.id}-deluxe`, name: 'Deluxe Suite', room_type: 'Suite', price_per_night: 180, capacity: 2, amenities: ['Ocean view', 'Free breakfast'] },
            { id: `${hotel.id}-family`, name: 'Family Room', room_type: 'Family', price_per_night: 140, capacity: 4, amenities: ['Balcony', 'Airport shuttle'] },
          ])
          setMessage(`No API rooms were returned, so demo rooms are shown for ${hotel.name}.`)
        }
      })
      .catch(() => {
        setRooms([
          { id: `${hotel.id}-deluxe`, name: 'Deluxe Suite', room_type: 'Suite', price_per_night: 180, capacity: 2, amenities: ['Ocean view', 'Free breakfast'] },
          { id: `${hotel.id}-family`, name: 'Family Room', room_type: 'Family', price_per_night: 140, capacity: 4, amenities: ['Balcony', 'Airport shuttle'] },
        ])
        setMessage(`Showing demo rooms for ${hotel.name}.`)
      })
      .finally(() => setLoadingRooms(false))
  }

  const handleReserve = (room) => {
    if (!selectedHotel) {
      setMessage('Select a hotel before reserving a room.')
      return
    }

    const selection = getRoomSelection(room)
    const nights = getEffectiveStayNights()
    const totalAmount = room.price_per_night * selection.quantity * nights
    const reservation = {
      hotel: selectedHotel.name,
      room: room.name,
      room_type: room.room_type,
      quantity: selection.quantity,
      amount: totalAmount,
      checkIn: checkIn || 'Flexible',
      checkOut: checkOut || 'Flexible',
      nights,
    }

    setBookedReservation(reservation)
    setMessage(`Reservation completed for ${selection.quantity} ${room.name}${selection.quantity > 1 ? 's' : ''} at ${selectedHotel.name}. Total: ৳ ${totalAmount}.`)
    generateBookingPDF(reservation)
  }

  const generateBookingPDF = (reservation) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const startX = 40
      const labelColor = '#333333'
      const accentColor = '#4a76d1'
      const lineHeight = 18
      const sectionGap = 26
      const titleY = 60

      doc.setFillColor('#f7f9ff')
      doc.rect(0, 0, pageWidth, 120, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(26)
      doc.setTextColor(accentColor)
      doc.text('Booking Confirmation', startX, titleY)

      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text('Your reservation has been confirmed and your details are recorded below.', startX, titleY + 18)

      doc.setDrawColor(accentColor)
      doc.setLineWidth(1.5)
      doc.line(startX, titleY + 26, pageWidth - startX, titleY + 26)

      const detailsStartY = titleY + 52
      let currentY = detailsStartY

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.setTextColor(labelColor)
      doc.text('Guest details', startX, currentY)
      doc.setDrawColor('#dfe3ee')
      doc.setLineWidth(0.8)
      doc.line(startX, currentY + 4, pageWidth - startX, currentY + 4)
      currentY += 20
      doc.setFontSize(11)
      doc.text(`Name: ${accountUsername || accountEmail || 'N/A'}`, startX, currentY)
      doc.text(`Email: ${accountEmail || 'N/A'}`, startX + 280, currentY)
      currentY += lineHeight
      doc.text(`Phone: ${accountPhone || 'N/A'}`, startX, currentY)
      currentY += sectionGap

      doc.setFontSize(12)
      doc.text('Reservation details', startX, currentY)
      doc.line(startX, currentY + 4, pageWidth - startX, currentY + 4)
      currentY += 20
      doc.setFontSize(11)
      doc.text(`Hotel: ${reservation.hotel}`, startX, currentY)
      doc.text(`Room: ${reservation.quantity}`, startX + 280, currentY)
      currentY += lineHeight
      doc.text(`Room name: ${reservation.room}`, startX, currentY)
      doc.text(`Room type: ${reservation.room_type}`, startX + 280, currentY)
      currentY += lineHeight
      doc.text(`Check in: ${reservation.checkIn}`, startX, currentY)
      doc.text(`Check out: ${reservation.checkOut}`, startX + 280, currentY)
      currentY += lineHeight
      doc.text(`Nights: ${reservation.nights}`, startX, currentY)
      currentY += sectionGap

      doc.setFontSize(12)
      doc.text('Billing information', startX, currentY)
      doc.line(startX, currentY + 4, pageWidth - startX, currentY + 4)
      currentY += 20
      doc.setFontSize(14)
      doc.setTextColor('#222222')
      doc.text(`Bill amount: BDT ${reservation.amount}`, startX, currentY)
      currentY += lineHeight
      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text(`Billing date: ${new Date().toLocaleDateString()}`, startX, currentY)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, startX + 280, currentY)

      const sealX = pageWidth - startX - 120
      const sealY = currentY + 60
      doc.setDrawColor(accentColor)
      doc.setFillColor('#e8efff')
      doc.setLineWidth(2)
      doc.circle(sealX, sealY, 50, 'FD')
      doc.setFontSize(10)
      doc.setTextColor(accentColor)
      doc.setFont('helvetica', 'bold')
      doc.text('Booking', sealX, sealY - 6, { align: 'center' })
      doc.text('Confirmed', sealX, sealY + 9, { align: 'center' })

      doc.save('booking-confirmation.pdf')
    } catch (e) {
      console.error('Failed to generate PDF', e)
    }
  }


  const handleLogout = () => {
    setSignedIn(false)
    setAccountEmail('')
    setAccountUsername('')
    setAccountPhone('')
    setAccountFullName('')
    setAccountAddress('')
    setAccountIdentifier('')
    setPage('home')
    persistAuthState('', false, '')
    setMessage('You have been logged out.')
  }

  const openListHotelModal = () => {
    if (!signedIn) {
      setPendingAction('listHotel')
      setAuthMode('login')
      setAuthMessage('Please log in first to list your hotel.')
      setMessage('Please log in first to list your hotel.')
      setShowSignIn(true)
      setShowListHotel(false)
      return
    }

    setListingError([])
    setListingForm(createEmptyListingForm())
    setShowListHotel(true)
  }

  const closeListHotelModal = () => {
    setShowListHotel(false)
    setListingError([])
    setListingForm(createEmptyListingForm())
  }

  const handleDownloadPaycheck = () => {
    if (!bookedReservation) {
      setMessage('No reservation found to generate a paycheck.')
      return
    }

    const paycheckContent = `PAYCHECK\n\nUsername: ${accountUsername}\nEmail: ${accountEmail}\nPhone: ${accountPhone}\nHotel: ${bookedReservation.hotel}\nRoom: ${bookedReservation.room}\nRoom type: ${bookedReservation.room_type || 'N/A'}\nQuantity: ${bookedReservation.quantity || 1}\nCheck in: ${bookedReservation.checkIn || 'Flexible'}\nCheck out: ${bookedReservation.checkOut || 'Flexible'}\nNights: ${bookedReservation.nights || 1}\nAmount: ৳ ${bookedReservation.amount}\n\nThank you for booking with us.`
    const blob = new Blob([paycheckContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'paycheck.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const closeAuthModal = () => {
    setShowSignIn(false)
    setAuthForm({ email: '', password: '', username: '', phone: '' })
    setAuthMessage('')
  }

  const openAuthModal = (mode) => {
    setAuthMode(mode)

    if (mode === 'signup') {
      setAuthForm({ email: '', password: '', username: '', phone: '' })
    } else if (mode === 'update') {
      setAuthForm({
        email: accountEmail,
        password: '',
        username: accountUsername,
        phone: accountPhone,
      })
    } else {
      setAuthForm({ email: '', password: '', username: '', phone: '' })
    }

    setAuthMessage('')
    setShowSignIn(true)
  }

  const saveProfileDetails = () => {
    const identifier = accountIdentifier || accountEmail || accountUsername || accountPhone
    if (!identifier) {
      setMessage('Unable to save profile details. Please log in again.')
      return
    }

    updateStoredUser(identifier, {
      email: accountEmail,
      username: accountUsername,
      phone: accountPhone,
      fullName: accountFullName,
      address: accountAddress,
    })

    if (identifier !== accountEmail) {
      setAccountIdentifier(accountEmail)
    }

    persistAuthState(accountEmail, true, accountEmail)
    setMessage('Profile details updated successfully.')
  }

  const handleAuthSubmit = (event) => {
    event.preventDefault()
    const email = authForm.email?.trim() || ''
    const password = authForm.password?.trim() || ''
    const username = authForm.username?.trim() || ''
    const phone = authForm.phone?.trim() || ''

    if (authMode === 'signup' && (!email || !password || !username || !phone)) {
      setAuthMessage('Please enter your username, phone, email, and password to create an account.')
      return
    }

    if (authMode === 'signup') {
      const uniqueness = checkUserUniqueness({ email, username, phone })
      if (!uniqueness.success) {
        setAuthMessage(uniqueness.message)
        return
      }
    }

    if (authMode === 'login' && !isSignInFormValid(email, password)) {
      setAuthMessage('Please enter both your email and password to continue.')
      return
    }

    if (authMode === 'forgot' && (!email || !password)) {
      setAuthMessage('Please enter your email or username and a new password to continue.')
      return
    }

    if (authMode === 'update' && (!email || !username || !phone)) {
      setAuthMessage('Please enter your username, phone, and email to update your profile.')
      return
    }

    let welcomeName = email

    if (authMode === 'signup') {
      addStoredUser({ email, password, username, phone })
      setAccountUsername(username)
      setAccountPhone(phone)
      setMessage('Account created. Please log in with your email, username, or phone.')
      setShowSignIn(false)
      setPage('home')
      setAuthMode('login')
    } else if (authMode === 'login') {
      const storedUser = findStoredUserByLogin(email, password)
      if (!storedUser) {
        setAuthMessage('No account found. Please sign up first or check your credentials.')
        return
      }
      setAccountUsername(storedUser.username)
      setAccountPhone(storedUser.phone)
      setAccountFullName(storedUser.fullName || '')
      setAccountAddress(storedUser.address || '')
      const identifier = email
      setAccountIdentifier(identifier)
      welcomeName = storedUser.username || email
      setAccountEmail(storedUser.email)
      setSignedIn(true)
      setShowSignIn(false)
      persistAuthState(storedUser.email, true, identifier)
      setMessage(`Welcome back, ${welcomeName}!`)
      if (pendingAction === 'listHotel') {
        setPendingAction(null)
        setShowSignIn(false)
        setListingError([])
        setListingForm(createEmptyListingForm())
        setShowListHotel(true)
      } else if (pendingHotel) {
        const hotel = pendingHotel
        setPendingHotel(null)
        handleViewRooms(hotel, true)
      } else {
        setPage('home')
      }
    } else if (authMode === 'forgot') {
      const resetResult = resetUserPassword(email, password)
      if (!resetResult.success) {
        setAuthMessage(resetResult.message || 'Unable to reset your password.')
        return
      }
      setAuthMessage('Your password has been updated. You can sign in with your new password now.')
      setAuthMode('login')
      setAuthForm({ email: '', password: '', username: '', phone: '' })
      return
    } else if (authMode === 'update') {
      const currentUser = findStoredUserByIdentifier(accountIdentifier || accountEmail || accountUsername || accountPhone)
      const savedPassword = password || currentUser?.password || ''
      persistUserCredential(email, savedPassword, username, phone, accountFullName, accountAddress)
      setAccountEmail(email)
      setAccountUsername(username)
      setAccountPhone(phone)
      setSignedIn(true)
      setShowSignIn(false)
      setPage('booking')
      persistAuthState(email, true, accountIdentifier || email)
      setMessage('Your profile has been updated.')
    }

    setAuthForm({ email: '', password: '', username: '', phone: '' })
  }

  const handlePartnerSubmit = async (event) => {
    event.preventDefault()

    const errors = validateHotelListingForm(listingForm)
    if (errors.length) {
      setListingError(errors)
      return
    }

    setListingError([])
    setListingSubmitting(true)

    try {
      const hotelPayload = {
        name: listingForm.name.trim(),
        city: listingForm.city.trim(),
        description: listingForm.description.trim(),
        image_url: listingForm.imagePreview || '',
        rating: 4.5,
        amenities: [listingForm.roomType.trim()].filter(Boolean),
      }

      const hotelResponse = await api.post('hotels/', hotelPayload)
      const createdHotel = hotelResponse.data
      const hotelId = createdHotel?.id ?? createdHotel?.pk

      if (!hotelId) {
        throw new Error('Hotel could not be created.')
      }

      await api.post('rooms/', {
        hotel: hotelId,
        name: listingForm.roomType.trim(),
        room_type: listingForm.roomType.trim(),
        price_per_night: Number(listingForm.rent),
        available: true,
        image_url: listingForm.imagePreview || '',
        amenities: [listingForm.roomType.trim()].filter(Boolean),
      })

      setHotels((previous) => [
        {
          ...createdHotel,
          image_url: listingForm.imagePreview || createdHotel.image_url,
          room_type: listingForm.roomType.trim(),
          price_per_night: Number(listingForm.rent),
          amenities: [listingForm.roomType.trim()].filter(Boolean),
        },
        ...previous,
      ])

      setShowListHotel(false)
      setListingForm(createEmptyListingForm())
      setMessage(`Your hotel listing has been added and is now visible.`)
    } catch (error) {
      console.error('Failed to submit hotel listing', error)
      setListingError(['We could not save the listing right now. Please try again.'])
    } finally {
      setListingSubmitting(false)
    }
  }

  const bookingHeadline = signedIn ? `Welcome, ${accountUsername || accountEmail}` : 'Welcome to StayFinder'
  const bookingSubtitle = signedIn ? 'Book your hotel stay and manage your reservation from the dashboard.' : 'Explore stays and reserve a room from our curated hotels.'

  const renderPageSection = () => {
    if (page === 'about') {
      return (
        <section className="section about-page">
          <div className="about-hero">
            <div className="about-copy">
              <p className="eyebrow">ABOUT STAYFINDER</p>
              <h2>Discover stays across Bangladesh</h2>
              <p className="lead">We make finding and booking hotels simple — curated listings, clear pricing, and local support so you can travel with confidence.</p>
              <div className="hero-actions">
                <button onClick={() => setPage('home')}>Back to home</button>
              </div>
            </div>
          </div>
        </section>
      )
    }

    if (page === 'rooms') {
      return (
        <section className="section">
          <div className="section-top">
            <div>
              <p className="eyebrow">ROOMS AVAILABLE</p>
              <h2>{selectedHotel?.name}</h2>
              <p>{selectedHotel?.city}</p>
            </div>
            <div className="section-actions">
              <button className="ghost" onClick={() => setPage('home')}>Back to homepage</button>
            </div>
          </div>

          <div className="stay-picker">
            <label>
              Check in
              <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
            </label>
            <label>
              Check out
              <input type="date" value={checkOut || getCheckoutDate(checkIn, stayLength)} onChange={(event) => setCheckOut(event.target.value)} />
            </label>
            <label>
              Nights
              <select value={stayLength} onChange={(event) => setStayLength(Number(event.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7].map((count) => (
                  <option key={count} value={count}>{count} {count === 1 ? 'night' : 'nights'}</option>
                ))}
              </select>
            </label>
            <p className="stay-picker-hint">{checkIn ? `Stay length: ${getEffectiveStayNights()} night${getEffectiveStayNights() > 1 ? 's' : ''}` : 'Choose your dates to plan the stay.'}</p>
          </div>

          {loadingRooms ? (
            <p className="notice">Loading rooms...</p>
          ) : (
            <div className="room-list">
              {rooms.map((room) => {
                const selection = getRoomSelection(room)
                const stayNights = getEffectiveStayNights()
                const roomTotal = room.price_per_night * selection.quantity * stayNights

                return (
                  <article className="room-card" key={room.id}>
                    <div className="room-card-main">
                      <div className="room-card-header">
                        <div>
                          <h3>{room.name}</h3>
                          <p>{room.room_type}</p>
                        </div>
                        <span className="room-pill">{room.amenities?.[0] || 'Comfort'}</span>
                      </div>
                      <p>{formatCurrency(room.price_per_night)} per night</p>
                      <p>Ideal for {room.capacity || 2} guests</p>
                      <div className="amenities">
                        {(room.amenities || []).slice(0, 3).map((item) => (
                          <small key={item}>{item}</small>
                        ))}
                      </div>
                    </div>

                    <div className="room-card-actions">
                      <label>
                        Rooms
                        <select value={selection.quantity} onChange={(event) => updateRoomSelection(room.id, 'quantity', Number(event.target.value))}>
                          {[1, 2, 3, 4, 5].map((count) => (
                            <option key={count} value={count}>{count}</option>
                          ))}
                        </select>
                      </label>

                      <p>
                        Total for selection: {formatCurrency(roomTotal)}
                        {stayNights > 1 ? ` (${stayNights} nights)` : ''}
                      </p>

                      <button onClick={() => handleReserve(room)}>Reserve</button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )
    }

    if (page === 'home' && signedIn) {
      return (
        <section className="section dashboard-page">
          <div className="section-top">
            <div>
              <p className="eyebrow">DASHBOARD</p>
              <h2>Welcome back, {accountUsername || accountEmail}</h2>
              <p>Review your profile information, update contact details, and manage your reservation.</p>
            </div>
            <div className="section-actions">
              <button className="ghost" onClick={() => setPage('booking')}>Search stays</button>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="profile-card">
              <h3>Basic account info</h3>
              <label className="field">
                Username
                <input value={accountUsername} onChange={(event) => setAccountUsername(event.target.value)} />
              </label>
              <label className="field">
                Email
                <input value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} />
              </label>
              <label className="field">
                Phone
                <input value={accountPhone} onChange={(event) => setAccountPhone(event.target.value)} />
              </label>
              <label className="field">
                Full name
                <input value={accountFullName} onChange={(event) => setAccountFullName(event.target.value)} />
              </label>
              <label className="field">
                Address
                <textarea rows="3" value={accountAddress} onChange={(event) => setAccountAddress(event.target.value)} />
              </label>
              <button onClick={saveProfileDetails}>Save profile</button>
            </div>

            <div className="booking-card">
              <h3>Reservation status</h3>
              {bookedReservation ? (
                <>
                  <p><strong>Hotel:</strong> {bookedReservation.hotel}</p>
                  <p><strong>Room name:</strong> {bookedReservation.room}</p>
                  <p><strong>Room type:</strong> {bookedReservation.room_type}</p>
                  <p><strong>Rooms:</strong> {bookedReservation.quantity}</p>
                  <p><strong>Check in:</strong> {bookedReservation.checkIn}</p>
                  <p><strong>Check out:</strong> {bookedReservation.checkOut}</p>
                  <p><strong>Total:</strong> BDT {bookedReservation.amount}</p>
                  <button onClick={() => generateBookingPDF(bookedReservation)}>Download confirmation PDF</button>
                </>
              ) : (
                <>
                  <p>You have not reserved a room yet.</p>
                  <button onClick={() => setPage('booking')}>Book a stay</button>
                </>
              )}
            </div>
          </div>
        </section>
      )
    }

    if (page === 'home' && !signedIn) {
      return (
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">DISCOVER BANGLADESH</p>
            <h1>Find your next<br /><em>perfect stay.</em></h1>
            <p className="subcopy">Beautiful places, memorable moments, and stays made simple.</p>
          </div>
        </section>
      )
    }

    return (
      <section className="section booking-hero">
        <div className="section-top">
          <div>
            <p className="eyebrow">BOOKING</p>
            <h2>{bookingHeadline}</h2>
            <p>{bookingSubtitle}</p>
          </div>
        </div>

        <div className="search">
          <label>
            Where
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="City or hotel" />
          </label>
          <label>
            Check in
            <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
          </label>
          <label>
            Check out
            <input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} />
          </label>
          <label>
            Nights
            <select value={stayLength} onChange={(event) => setStayLength(Number(event.target.value))}>
              {[1, 2, 3, 4, 5, 6, 7].map((count) => (
                <option key={count} value={count}>{count} {count === 1 ? 'night' : 'nights'}</option>
              ))}
            </select>
          </label>
          <button className="search-btn" onClick={handleSearch}>Search stays →</button>
        </div>

        <div className="cards">
          {visible.map((hotel) => (
            <article className="card" key={hotel.id}>
              <img src={hotel.image_url || sampleHotels[0].image_url} alt={hotel.name} />
              <div className="card-copy">
                <p className="eyebrow">{hotel.city}</p>
                <h3>{hotel.name}</h3>
                <p>{hotel.description}</p>
                <button onClick={() => handleViewRooms(hotel)}>View rooms</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className={page === 'about' ? 'page-about' : 'page-app'}>
      <header>
        <div className="nav">
          <a className="logo" href="#top">stay<span>finder</span></a>
          <nav>
            <button className="ghost" onClick={() => setPage('about')}>About</button>
            {signedIn ? (
              <>
                <button className="ghost" onClick={() => setPage('home')}>Dashboard</button>
                <button className="ghost" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <button className="ghost" onClick={() => openAuthModal('login')}>Login</button>
                <button onClick={() => openAuthModal('signup')}>Sign up</button>
              </>
            )}
            <button onClick={openListHotelModal}>List your hotel</button>
          </nav>
        </div>
      </header>

      <main id="top">
        {renderPageSection()}

        {showSignIn && (
          <div className="modal-backdrop" onClick={closeAuthModal}>
            <div className="panel" onClick={(event) => event.stopPropagation()}>
              <h2>{authMode === 'signup' ? 'Sign up' : authMode === 'update' ? 'Update profile' : authMode === 'forgot' ? 'Forgot password' : 'Login'}</h2>
              <p>{authMode === 'signup' ? 'Create your account to continue booking.' : authMode === 'update' ? 'Update your profile information.' : authMode === 'forgot' ? 'Enter your registered email or username and choose a new password.' : 'Use your email or username to sign in.'}</p>
              {authMessage && <p className="modal-error">{authMessage}</p>}
              <form onSubmit={handleAuthSubmit} autoComplete="off">
                <label className="field">
                  {authMode === 'login' ? 'Email or Username' : authMode === 'forgot' ? 'Email or Username' : 'Email'}
                  <input name="auth-email" autoComplete="off" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} />
                </label>
                {(authMode === 'signup' || authMode === 'update') && (
                  <label className="field">
                    Username
                    <input name="auth-username" autoComplete="off" value={authForm.username} onChange={(event) => setAuthForm({ ...authForm, username: event.target.value })} />
                  </label>
                )}
                {(authMode === 'signup' || authMode === 'update') && (
                  <label className="field">
                    Phone
                    <input name="auth-phone" autoComplete="off" value={authForm.phone} onChange={(event) => setAuthForm({ ...authForm, phone: event.target.value })} />
                  </label>
                )}
                <label className="field">
                  {authMode === 'forgot' ? 'New password' : 'Password'}
                  <input
                    name="auth-password"
                    autoComplete={authMode === 'forgot' || authMode === 'signup' ? 'new-password' : 'current-password'}
                    type="password"
                    value={authForm.password}
                    onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                  />
                </label>
                <div className="panel-actions">
                  <button type="button" className="ghost" onClick={closeAuthModal}>Cancel</button>
                  <button type="submit">{authMode === 'signup' ? 'Create account' : authMode === 'update' ? 'Update profile' : authMode === 'forgot' ? 'Reset password' : 'Continue'}</button>
                </div>
                {authMode === 'login' && (
                  <div className="panel-actions" style={{ justifyContent: 'flex-start', marginTop: '0.75rem' }}>
                    <button type="button" className="ghost" onClick={() => setAuthMode('forgot')}>Forgot password?</button>
                  </div>
                )}
                {authMode === 'forgot' && (
                  <div className="panel-actions" style={{ justifyContent: 'flex-start', marginTop: '0.75rem' }}>
                    <button type="button" className="ghost" onClick={() => setAuthMode('login')}>Back to login</button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {showListHotel && (
          <div className="modal-backdrop" onClick={closeListHotelModal}>
            <div className="panel" onClick={(event) => event.stopPropagation()}>
              <h2>List your hotel</h2>
              <p>Share the essentials so your property can be reviewed and published.</p>
              {listingError.length > 0 && (
                <div className="modal-error">
                  <ul>{listingError.map((error) => <li key={error}>{error}</li>)}</ul>
                </div>
              )}
              <form onSubmit={handlePartnerSubmit}>
                <label className="field">
                  Hotel name
                  <input value={listingForm.name} onChange={(event) => updateListingForm('name', event.target.value)} />
                </label>
                <label className="field">
                  Location
                  <input value={listingForm.city} onChange={(event) => updateListingForm('city', event.target.value)} />
                </label>
                <label className="field">
                  Description
                  <textarea rows="3" value={listingForm.description} onChange={(event) => updateListingForm('description', event.target.value)} />
                </label>
                <label className="field">
                  Room type
                  <input value={listingForm.roomType} onChange={(event) => updateListingForm('roomType', event.target.value)} />
                </label>
                <label className="field">
                  Rent per night
                  <input type="number" min="1" value={listingForm.rent} onChange={(event) => updateListingForm('rent', event.target.value)} />
                </label>
                <label className="field">
                  Upload hotel image
                  <input type="file" accept="image/*" onChange={async (event) => {
                    const file = event.target.files?.[0] || null
                    if (!file) {
                      updateListingForm('imageFile', null)
                      updateListingForm('imagePreview', '')
                      return
                    }
                    const preview = await readFileAsDataUrl(file)
                    updateListingForm('imageFile', file)
                    updateListingForm('imagePreview', preview)
                  }} />
                </label>
                {listingForm.imagePreview && (
                  <img className="listing-preview" src={listingForm.imagePreview} alt="Hotel preview" />
                )}
                <div className="panel-actions">
                  <button type="button" className="ghost" onClick={closeListHotelModal}>Cancel</button>
                  <button type="submit" disabled={listingSubmitting}>{listingSubmitting ? 'Saving...' : 'Submit listing'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer>© 2026 StayFinder · Made for memorable journeys</footer>
    </div>
  )
}


