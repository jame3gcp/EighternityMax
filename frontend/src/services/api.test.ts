import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TokenManager } from './api'

describe('TokenManager', () => {
  const storage: Record<string, string> = {}
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value },
      removeItem: (key: string) => { delete storage[key] },
      clear: () => { Object.keys(storage).forEach((k) => delete storage[k]) },
      length: 0,
      key: () => null,
    })
    Object.keys(storage).forEach((k) => delete storage[k])
  })

  it('stores and retrieves access and refresh tokens', () => {
    TokenManager.setTokens('access-1', 'refresh-1')
    expect(TokenManager.getAccessToken()).toBe('access-1')
    expect(TokenManager.getRefreshToken()).toBe('refresh-1')
  })

  it('returns null when no tokens stored', () => {
    expect(TokenManager.getAccessToken()).toBeNull()
    expect(TokenManager.getRefreshToken()).toBeNull()
  })

  it('clears tokens', () => {
    TokenManager.setTokens('a', 'r')
    TokenManager.clearTokens()
    expect(TokenManager.getAccessToken()).toBeNull()
    expect(TokenManager.getRefreshToken()).toBeNull()
  })
})
