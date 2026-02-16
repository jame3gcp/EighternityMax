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
  /** 개인정보 수집·이용 동의 여부. false면 서비스 메뉴 접근 불가 */
  privacyConsentGiven?: boolean
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
  /** true이면 개인정보 동의 화면(온보딩)으로 이동 필요 */
  consent_required?: boolean
}

/** 만세력 계산 결과 (참조 페이지와 동일한 항목 — 개인정보) */
export interface Saju {
  /** 가입 시 입력 기준: 양력(solar) / 음력(lunar) */
  calendarType?: 'solar' | 'lunar'
  /** 음력 입력 시 윤달 여부 */
  isIntercalation?: boolean
  solar?: { year: number; month: number; day: number }
  lunar?: { year: number; month: number; day: number; intercalation?: boolean }
  gapjaKorean?: { year?: string; month?: string; day?: string; hour?: string }
  gapjaChinese?: { year?: string; month?: string; day?: string; hour?: string }
  gender?: 'M' | 'F' | 'X'
  birthTime?: string
  /** 오행 분포 및 주별 오행 */
  ohang?: {
    distribution?: { 목?: number; 화?: number; 토?: number; 금?: number; 수?: number }
    pillars?: Record<string, { stem?: { ko: string; zh: string }; branch?: { ko: string; zh: string } } | null>
  }
  /** 십성 (연월일시) */
  sipseong?: Record<string, { ko: string; zh: string; index: number } | null>
  /** 12운성 (연월일시) */
  unseong12?: Record<string, { ko: string; zh: string; index: number } | null>
  /** 천간 특수관계 (합/冲) 주별 */
  cheonganRelation?: Record<string, Array<{ type: string; typeKo: string; pair: number[]; withPillar: string; withStem: string }>>
  /** 지지 형충회합 (지장간·방합·삼합·반합·가합·육합·암합·충·형·파·해·원진·귀문) 주별 */
  jijiRelation?: Record<string, { jangan?: string | null; banghap?: string | null; samhap?: string | null; banhap?: string | null; gahap?: string | null; yukhap?: string | null; amhap?: string | null; chung?: string | null; hyeong?: string | null; pa?: string | null; hae?: string | null; wonjin?: string | null; gweemun?: string | null; ko: Record<string, string | null> } | null>
  /** 십이신살 (역마/도화/화개 등) 주별 */
  sinsal12?: Record<string, Array<{ ko: string; zh: string; type: string }> | null>
  /** 십이신살 행(참조): 주별 재살/지살/겁살 */
  sinsal12Pillar?: Record<string, string | null>
  /** 신살 종합 (월덕귀인 등) 주별 */
  sinsalCombined?: Record<string, string[]>
  /** 대운 (한국천문연구원 기준) */
  daeun?: { forward: boolean; steps: Array<{ age?: number; gapja: string; gapjaKo: string; sipseong?: { ko: string; zh: string } | null; sipseongJi?: { ko: string; zh: string } | null; sinsal?: string | null; unseong12?: { ko: string; zh: string } | null }>; note?: string }
  /** 세운(년운) */
  seun?: Array<{ year: number; gapja: string; gapjaKo: string; sipseong?: { ko: string; zh: string } | null; sipseongJi?: { ko: string; zh: string } | null; sinsal?: string | null; unseong12?: { ko: string; zh: string } | null }>
  /** 월운 */
  woleun?: Array<{ month: number; gapja: string; gapjaKo: string; sipseong?: { ko: string; zh: string } | null; sipseongJi?: { ko: string; zh: string } | null; sinsal?: string | null; unseong12?: { ko: string; zh: string } | null }>
}

export interface Profile {
  profileId: string
  userId: string
  birthDate: string
  birthTime?: string | null
  gender: 'M' | 'F' | 'X'
  region?: string | null
  /** 만세력 계산 결과 (사주4주, 오행, 십성, 12운성 등 — 개인정보) */
  saju?: Saju | null
  createdAt: number
  updatedAt: number
}

/** ChatGPT 사주 상세 분석 결과 (저장 후 다른 메뉴에서 재사용) */
export interface SajuAnalysisResult {
  summary?: string
  personality?: string
  strengths?: string[]
  weaknesses?: string[]
  life_phases?: string
  recommendations?: string[]
}

export type SajuAnalysisStatus = 'not_found' | 'queued' | 'done' | 'failed' | 'skipped'

export interface SajuAnalysisResponse {
  id: string
  status: SajuAnalysisStatus
  analysis?: SajuAnalysisResult
  error_message?: string
  updated_at?: number
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
