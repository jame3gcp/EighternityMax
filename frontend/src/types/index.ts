export type Period = 'day' | 'week' | 'month' | 'year'

export interface Phase {
  id: number
  name: string
  energy: number // 0-100
  emotion: number // 0-100
  focus: number // 0-100
  description: string
  recommendations: string[]
  warnings: string[]
  color: string
}

export interface CycleData {
  userId: string
  period: Period
  currentPhase: number // 0-7 (8단계)
  phases: Phase[]
  timestamp: number
}

export interface User {
  id: string
  name: string
  email: string
  createdAt: number
}

export interface Record {
  id: string
  userId: string
  date: string
  energy: number
  emotion: number
  focus: number
  memo?: string
  timestamp: number
}

export interface Interpretation {
  phaseId: number
  title: string
  description: string
  recommendations: string[]
  warnings: string[]
  nextPhase: number
  nextPhaseName: string
}
