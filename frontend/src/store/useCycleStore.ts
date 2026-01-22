import { create } from 'zustand'
import type { CycleData, Period, Phase } from '@/types'
import { cycleApi } from '@/services/api'

interface CycleState {
  currentCycle: CycleData | null
  period: Period
  isLoading: boolean
  error: string | null
  fetchCycle: (period: Period) => Promise<void>
  setPeriod: (period: Period) => void
}

export const useCycleStore = create<CycleState>((set, get) => ({
  currentCycle: null,
  period: 'day',
  isLoading: false,
  error: null,
  fetchCycle: async (period: Period) => {
    set({ isLoading: true, error: null })
    try {
      const cycle = await cycleApi.getCycle(period)
      set({ currentCycle: cycle, period, isLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '사이클 데이터를 불러오는데 실패했습니다.', isLoading: false })
    }
  },
  setPeriod: (period: Period) => {
    set({ period })
    get().fetchCycle(period)
  },
}))
