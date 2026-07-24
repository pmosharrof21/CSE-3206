const USER_LIST_KEY = 'storedUsers'
const LEGACY_KEYS = ['storedAccountEmail', 'storedAccountPassword', 'storedAccountUsername', 'storedAccountPhone']

export function formatCurrency(amount) {
  return `৳ ${Number(amount).toLocaleString('en-BD')}`
}

export function isSignInFormValid(email, password) {
  return Boolean(email?.trim() && password?.trim())
}

const isBrowserStorageAvailable = () => typeof globalThis !== 'undefined' && globalThis.localStorage

export function persistAuthState(email, signedIn, identifier = '') {
  if (!isBrowserStorageAvailable()) {
    return
  }

  globalThis.localStorage.setItem('accountEmail', email || '')
  globalThis.localStorage.setItem('accountIdentifier', identifier || '')
  globalThis.localStorage.setItem('signedIn', signedIn ? 'true' : 'false')
}

export function readAuthState() {
  if (!isBrowserStorageAvailable()) {
    return { accountEmail: '', accountIdentifier: '', signedIn: false }
  }

  return {
    accountEmail: globalThis.localStorage.getItem('accountEmail') || '',
    accountIdentifier: globalThis.localStorage.getItem('accountIdentifier') || '',
    signedIn: globalThis.localStorage.getItem('signedIn') === 'true',
  }
}

export function getStoredUsers() {
  if (!isBrowserStorageAvailable()) {
    return []
  }

  const stored = globalThis.localStorage.getItem(USER_LIST_KEY)
  if (!stored) {
    return []
  }

  try {
    const users = JSON.parse(stored)
    return Array.isArray(users) ? users : []
  } catch {
    return []
  }
}

export function saveStoredUsers(users) {
  if (!isBrowserStorageAvailable()) {
    return
  }

  globalThis.localStorage.setItem(USER_LIST_KEY, JSON.stringify(users))
}

export function clearStoredUsers() {
  if (!isBrowserStorageAvailable()) {
    return
  }

  globalThis.localStorage.removeItem(USER_LIST_KEY)
}

export function hasLegacyUserCredential() {
  if (!isBrowserStorageAvailable()) {
    return false
  }

  return LEGACY_KEYS.some((key) => Boolean(globalThis.localStorage.getItem(key)))
}

export function removeLegacyUserCredentials() {
  if (!isBrowserStorageAvailable()) {
    return
  }

  LEGACY_KEYS.forEach((key) => globalThis.localStorage.removeItem(key))
}

export function findStoredUserByIdentifier(identifier) {
  const normalized = (identifier || '').trim().toLowerCase()
  if (!normalized) {
    return null
  }

  return getStoredUsers().find((user) => {
    return (
      (user.email || '').trim().toLowerCase() === normalized ||
      (user.username || '').trim().toLowerCase() === normalized ||
      (user.phone || '').trim().toLowerCase() === normalized
    )
  }) || null
}

export function findStoredUserByLogin(identifier, password) {
  const normalized = (identifier || '').trim().toLowerCase()
  const trimmedPassword = (password || '').trim()
  if (!normalized || !trimmedPassword) {
    return null
  }

  return getStoredUsers().find((user) => {
    const matchesIdentifier =
      (user.email || '').trim().toLowerCase() === normalized ||
      (user.username || '').trim().toLowerCase() === normalized ||
      (user.phone || '').trim().toLowerCase() === normalized

    return matchesIdentifier && (user.password || '') === trimmedPassword
  }) || null
}

export function checkUserUniqueness({ email, username, phone }) {
  const trimmedEmail = (email || '').trim().toLowerCase()
  const trimmedUsername = (username || '').trim().toLowerCase()
  const trimmedPhone = (phone || '').trim().toLowerCase()
  const users = getStoredUsers()

  for (const user of users) {
    if (trimmedEmail && (user.email || '').trim().toLowerCase() === trimmedEmail) {
      return { success: false, field: 'email', message: 'This email is already used.' }
    }
    if (trimmedUsername && (user.username || '').trim().toLowerCase() === trimmedUsername) {
      return { success: false, field: 'username', message: 'This username is already used.' }
    }
    if (trimmedPhone && (user.phone || '').trim().toLowerCase() === trimmedPhone) {
      return { success: false, field: 'phone', message: 'This phone number is already used.' }
    }
  }

  return { success: true }
}

export function addStoredUser({ email, password, username, phone }) {
  const users = getStoredUsers()
  users.push({ email: email.trim(), password: password.trim(), username: username.trim(), phone: phone.trim() })
  saveStoredUsers(users)
}

export function persistUserCredential(email, password, username, phone, fullName = '', address = '') {
  if (!isBrowserStorageAvailable()) {
    return
  }

  const trimmedEmail = (email || '').trim()
  const trimmedPassword = (password || '').trim()
  const trimmedUsername = (username || '').trim()
  const trimmedPhone = (phone || '').trim()
  const trimmedFullName = (fullName || '').trim()
  const trimmedAddress = (address || '').trim()
  const users = getStoredUsers()

  const existingIndex = users.findIndex((user) => {
    return (
      (user.email || '').trim().toLowerCase() === trimmedEmail.toLowerCase() ||
      (user.username || '').trim().toLowerCase() === trimmedUsername.toLowerCase() ||
      (user.phone || '').trim().toLowerCase() === trimmedPhone.toLowerCase()
    )
  })

  const updatedUser = {
    email: trimmedEmail,
    password: trimmedPassword,
    username: trimmedUsername,
    phone: trimmedPhone,
    fullName: trimmedFullName,
    address: trimmedAddress,
  }

  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...updatedUser }
  } else {
    users.push(updatedUser)
  }

  saveStoredUsers(users)
}

export function clearUserCredential() {
  clearStoredUsers()
}

export function readUserCredential() {
  const [user] = getStoredUsers()
  return user || { email: '', password: '', username: '', phone: '', fullName: '', address: '' }
}

export function updateStoredUser(identifier, updates) {
  if (!isBrowserStorageAvailable()) {
    return
  }

  const normalized = (identifier || '').trim().toLowerCase()
  if (!normalized) {
    return
  }

  const users = getStoredUsers()
  const index = users.findIndex((user) => {
    return (
      (user.email || '').trim().toLowerCase() === normalized ||
      (user.username || '').trim().toLowerCase() === normalized ||
      (user.phone || '').trim().toLowerCase() === normalized
    )
  })

  if (index < 0) {
    return
  }

  users[index] = { ...users[index], ...updates }
  saveStoredUsers(users)
}

export function resetUserPassword(identifier, newPassword) {
  const normalizedIdentifier = (identifier || '').trim().toLowerCase()
  const trimmedPassword = (newPassword || '').trim()

  if (!normalizedIdentifier || !trimmedPassword) {
    return { success: false, message: 'Please enter a valid email or username and a new password.' }
  }

  const users = getStoredUsers()
  const index = users.findIndex((user) => {
    const emailMatch = (user.email || '').trim().toLowerCase() === normalizedIdentifier
    const usernameMatch = (user.username || '').trim().toLowerCase() === normalizedIdentifier
    const phoneMatch = (user.phone || '').trim().toLowerCase() === normalizedIdentifier
    return emailMatch || usernameMatch || phoneMatch
  })

  if (index < 0) {
    return { success: false, message: 'No account was found for that email or username.' }
  }

  users[index] = { ...users[index], password: trimmedPassword }
  saveStoredUsers(users)
  return { success: true }
}
