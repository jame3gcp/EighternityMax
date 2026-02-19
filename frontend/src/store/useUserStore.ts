import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface UserState {
  user: User | null
  role: string | undefined
  /** 개인정보 동의 여부. undefined = 아직 미조회, false = 미동의(온보딩 필요), true = 동의 완료 */
  privacyConsentGiven: boolean | undefined
  setUser: (user: User) => void
  setRole: (role: string | undefined) => void
  setPrivacyConsentGiven: (value: boolean) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      role: undefined,
      privacyConsentGiven: undefined,
      setUser: (user) => set({
        user,
        role: typeof user.role === 'string' ? user.role : undefined,
        ...(typeof user.privacyConsentGiven === 'boolean' && { privacyConsentGiven: user.privacyConsentGiven }),
      }),
      setRole: (role) => set({ role }),
      setPrivacyConsentGiven: (value) => set({ privacyConsentGiven: value }),
      clearUser: () => set({ user: null, role: undefined, privacyConsentGiven: undefined }),
    }),
    {
      name: 'user-storage',
    }
  )
)
