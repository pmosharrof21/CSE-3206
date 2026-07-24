import { beforeEach, describe, expect, it } from 'vitest'
import { formatCurrency, isSignInFormValid, persistAuthState, readAuthState, persistUserCredential, readUserCredential, resetUserPassword } from './formatting'

describe('formatCurrency', () => {
  it('formats prices with the ৳ symbol', () => {
    expect(formatCurrency(180)).toBe('৳ 180')
    expect(formatCurrency(1400)).toBe('৳ 1,400')
  })
})

describe('isSignInFormValid', () => {
  it('requires both email and password', () => {
    expect(isSignInFormValid('', 'secret')).toBe(false)
    expect(isSignInFormValid('guest@example.com', 'secret')).toBe(true)
  })
})

describe('auth persistence', () => {
  beforeEach(() => {
    const store = {}
    globalThis.localStorage = {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => {
        store[key] = String(value)
      },
      removeItem: (key) => {
        delete store[key]
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key])
      },
    }
  })

  it('persists and reads the signed-in account state', () => {
    persistAuthState('guest@example.com', true)

    expect(readAuthState()).toEqual({ accountEmail: 'guest@example.com', signedIn: true })
  })

  it('stores signup credentials and reads them back', () => {
    persistUserCredential('guest@example.com', 'secret', 'guestuser', '0123456789')

    expect(readUserCredential()).toEqual({
      email: 'guest@example.com',
      password: 'secret',
      username: 'guestuser',
      phone: '0123456789',
    })
  })

  it('updates the stored password for a matching email or username', () => {
    persistUserCredential('guest@example.com', 'secret', 'guestuser', '0123456789')

    const updated = resetUserPassword('guestuser', 'new-secret')

    expect(updated).toEqual({ success: true })
    expect(readUserCredential().password).toBe('new-secret')
  })
})
