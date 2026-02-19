import { create } from 'zustand'
import type { LifeProfile } from '@/types'
import { lifeProfileApi, isNetworkError, NETWORK_ERROR_MESSAGE } from '@/services/api'

interface LifeProfileState {
  lifeProfile: LifeProfile | null
  isLoading: boolean
  error: string | null
  fetchLifeProfile: () => Promise<void>
  setLifeProfile: (profile: LifeProfile | null) => void
  clearLifeProfile: () => void
}

export const useLifeProfileStore = create<LifeProfileState>((set) => ({
  lifeProfile: null,
  isLoading: false,
  error: null,

  fetchLifeProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await lifeProfileApi.getLifeProfile()
      if (response) {
        set({ lifeProfile: response.life_profile, isLoading: false })
      } else {
        // Life Profile이 아직 생성되지 않음 (정상적인 경우)
        set({ lifeProfile: null, isLoading: false, error: null })
      }
    } catch (error: any) {
      // 404는 정상적인 경우일 수 있음 (아직 프로필이 생성되지 않음)
      if (error?.message?.includes('Not Found') || error?.statusCode === 404) {
        set({ lifeProfile: null, isLoading: false, error: null })
      } else {
        if (isNetworkError(error)) {
          set({ error: NETWORK_ERROR_MESSAGE, isLoading: false })
        } else {
          console.error('Failed to fetch life profile:', error)
          set({ error: 'Life Profile을 불러올 수 없습니다.', isLoading: false })
        }
      }
    }
  },

  setLifeProfile: (profile) => {
    set({ lifeProfile: profile })
  },

  clearLifeProfile: () => {
    set({ lifeProfile: null, error: null })
  },
}))
