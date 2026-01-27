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
  provider?: string
  displayName?: string
}

export interface OAuthCallbackResponse {
  user: {
    user_id: string
    is_new_user: boolean
    provider: string
  }
  tokens: {
    access_token: string
    refresh_token: string
  }
  next_step: 'profile_required' | 'life_profile_required' | 'ready'
}

export interface Profile {
  profileId: string
  userId: string
  birthDate: string
  birthTime?: string | null
  gender: 'M' | 'F' | 'X'
  region?: string | null
  createdAt: number
  updatedAt: number
}

// 에너지 웰니스 관련 타입 정의
export interface EnergyElement {
  id: 'growth' | 'vitality' | 'stability' | 'clarity' | 'flow'
  name: string
  korean: string
  value: number // 0-100
  description: string
  traits: string[]
  icon?: string
  color?: string
}

export interface EnergyTrait {
  id: string
  name: string
  korean: string
  score: number // 0-100
  description: string
  strength: string
  icon?: string
}

export interface EnergyBlueprint {
  coreType: {
    name: string
    korean: string
    description: string
    icon?: string
  }
  timeAxis: Array<{
    period: string
    korean: string
    type: string
    icon?: string
  }>
  balance: {
    overall: number
    message: string
  }
}

export interface LifeProfile {
  userId: string
  profileId: string
  energyType: string
  energyTypeEmoji: string
  strengths: string[]
  patterns: {
    morning: { energy: number; focus: number; emotion: number }
    afternoon: { energy: number; focus: number; emotion: number }
    evening: { energy: number; focus: number; emotion: number }
  }
  cycleDescription: string
  recommendations: string[]
  version: string
  createdAt: number
  updatedAt: number
  // 에너지 웰니스 데이터 (선택적)
  energyElements?: EnergyElement[]
  energyTraits?: EnergyTrait[]
  energyBlueprint?: EnergyBlueprint
}

export interface Job {
  jobId: string
  status: 'queued' | 'running' | 'done' | 'failed'
  progress: number
  resultRef?: string
}

export interface DailyGuide {
  date: string
  phase_tag: string
  energy_index: number
  summary: string
  do: string[]
  avoid: string[]
  relationships: string
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

export interface DirectionCategory {
  id: string
  name: string
  score: number
  guide: string
  recommendation: string
}

export interface Directions {
  date: string
  categories: DirectionCategory[]
  explanation: string
}

export interface Spot {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  purpose: 'focus' | 'rest' | 'meet'
  score: number
  description: string
  address: string
  tags: string[]
}

export interface MonthlyReport {
  month: string
  total_logs: number
  averages: {
    energy: number
    emotion: number
    focus: number
  }
  insight: string
  top_activities: string[]
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
