import type {
  CycleData,
  Period,
  Record as EnergyRecord,
  User,
  Interpretation,
  OAuthCallbackResponse,
  Profile,
  LifeProfile,
  Job,
  DailyGuide,
  Directions,
  Spot,
  MonthlyReport,
  SajuAnalysisResponse,
} from '@/types'
import { mockDataService } from './mockData'
import { supabase as supabaseClient } from './supabase'
import type { Provider } from '@supabase/supabase-js'

// API Base URL 설정
// - VITE_API_URL 이 있으면 해당 백엔드 서버 사용.
// - 프로덕션: 백엔드가 별도 도메인에 있으면 반드시 VITE_API_URL 설정 (Vercel env에 추가 후 재배포).
//   설정하지 않으면 같은 도메인(프론트 호스트)으로 요청해 /api/* 호출 시 404 발생.
// - 개발: 기본값 localhost:3001
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL

  if (envUrl && envUrl.trim() !== '') {
    return envUrl
  }

  if (import.meta.env.PROD) {
    return '' // 상대 경로 (백엔드가 같은 도메인일 때만 유효)
  }

  return 'http://localhost:3001'
}

const API_BASE_URL = getApiBaseUrl()
const V1_API_BASE = API_BASE_URL ? `${API_BASE_URL}/v1` : '/v1'

// 디버깅: API 설정 정보 로깅 (개발 환경에서만)
if (import.meta.env.DEV) {
  console.log('[API Config]', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    PROD: import.meta.env.PROD,
    MODE: import.meta.env.MODE,
    API_BASE_URL,
    V1_API_BASE,
  })
}

const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'

/** 네트워크/연결 실패(서버 미실행 등)로 fetch가 실패했는지 판별 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Failed to fetch') return true
  const e = error as { code?: string; message?: string }
  return e?.code === 'NETWORK_ERROR' || (typeof e?.message === 'string' && e.message.includes('서버에 연결할 수 없습니다'))
}

/** 네트워크 오류 시 사용자에게 보여줄 메시지 (공용) */
export const NETWORK_ERROR_MESSAGE = '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해 주세요.'

class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token'
  private static REFRESH_TOKEN_KEY = 'refresh_token'

  static setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken)
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY)
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }

  static clearTokens() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const accessToken = TokenManager.getAccessToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (options?.headers) {
      Object.assign(headers, options.headers)
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const url = `${this.baseUrl}${endpoint}`
    
    // 디버깅: API 호출 정보 로깅 (개발 환경에서만)
    if (import.meta.env.DEV) {
      console.log('[API Request]', {
        method: options?.method || 'GET',
        url,
        baseUrl: this.baseUrl,
        endpoint,
        hasToken: !!accessToken,
      })
    }

    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })
    } catch (e) {
      const err = new Error(NETWORK_ERROR_MESSAGE) as Error & { code: string }
      err.code = 'NETWORK_ERROR'
      if (import.meta.env.DEV) {
        console.warn('[API] 연결 실패:', this.baseUrl, e)
      }
      throw err
    }

    if (response.status === 401 && accessToken) {
      try {
        await this.refreshToken()
        const retryHeaders: Record<string, string> = { ...headers }
        retryHeaders['Authorization'] = `Bearer ${TokenManager.getAccessToken()}`
        
        let retryResponse: Response
        try {
          retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: retryHeaders,
            credentials: 'include',
          })
        } catch (e) {
          const err = new Error(NETWORK_ERROR_MESSAGE) as Error & { code: string }
          err.code = 'NETWORK_ERROR'
          throw err
        }
        if (!retryResponse.ok) {
          throw new Error(`API Error: ${retryResponse.statusText}`)
        }
        return retryResponse.json()
      } catch (error) {
        TokenManager.clearTokens()
        window.location.href = '/login'
        throw error
      }
    }

    if (!response.ok) {
      let message = `API Error: ${response.statusText}`
      try {
        const body = await response.json().catch(() => ({}))
        if (body && typeof (body as { message?: string }).message === 'string') {
          message = (body as { message: string }).message
        }
      } catch {
        // ignore
      }
      const error: any = new Error(message)
      error.statusCode = response.status
      error.statusText = response.statusText
      throw error
    }

    return response.json()
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = TokenManager.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token')
    }

    const response = await fetch(`${V1_API_BASE}/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    TokenManager.setTokens(data.access_token, data.refresh_token || refreshToken)
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint)
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }
}

class CycleApi {
  async getCycle(period: Period, userId?: string): Promise<CycleData> {
    if (isMockMode) {
      return mockDataService.getCycleData(period)
    }
    try {
      const client = new ApiClient(V1_API_BASE)
      const query = userId ? `?period=${period}&userId=${userId}` : `?period=${period}`
      return await client.get<CycleData>(`/users/me/cycles${query}`)
    } catch (error) {
      console.warn('CycleApi: API call failed, falling back to mock data', error)
      return mockDataService.getCycleData(period)
    }
  }

  async getInterpretation(phaseId: number): Promise<Interpretation> {
    if (isMockMode) {
      return mockDataService.getInterpretation(phaseId)
    }
    try {
      const client = new ApiClient(API_BASE_URL)
      return await client.get<Interpretation>(`/api/interpretations/${phaseId}`)
    } catch (error) {
      console.warn('CycleApi: Interpretation API failed, falling back to mock data', error)
      return mockDataService.getInterpretation(phaseId)
    }
  }
}

class RecordApi {
  async getRecords(userId: string, limit?: number): Promise<EnergyRecord[]> {
    if (isMockMode) {
      return mockDataService.getRecords(userId, limit)
    }
    const client = new ApiClient(V1_API_BASE)
    const query = limit ? `?limit=${limit}` : ''
    return client.get<EnergyRecord[]>(`/users/me/logs${query}`)
  }

  async createRecord(record: Omit<EnergyRecord, 'id' | 'timestamp'>): Promise<{ id: string; status: string }> {
    if (isMockMode) {
      const res = await mockDataService.createRecord(record)
      return { id: res.id, status: 'saved' }
    }
    const client = new ApiClient(V1_API_BASE)
    return client.post<{ id: string; status: string }>('/users/me/daily-log', record)
  }

  async updateRecord(id: string, record: Partial<EnergyRecord>): Promise<EnergyRecord> {
    if (isMockMode) {
      return mockDataService.updateRecord(id, record)
    }
    const client = new ApiClient(API_BASE_URL)
    return client.put<EnergyRecord>(`/api/records/${id}`, record)
  }

  async deleteRecord(id: string): Promise<void> {
    if (isMockMode) {
      return mockDataService.deleteRecord(id)
    }
    const client = new ApiClient(API_BASE_URL)
    return client.delete<void>(`/api/records/${id}`)
  }
}

class UserApi {
  async getCurrentUser(): Promise<User> {
    if (isMockMode) {
      return mockDataService.getCurrentUser()
    }
    const client = new ApiClient(V1_API_BASE)
    const data = await client.get<any>('/users/me')
    const user: User = {
      id: data.id,
      name: data.displayName || data.display_name || data.name || '사용자',
      email: data.email ?? '',
      createdAt: data.created_at ?? data.createdAt ?? 0,
      ...(typeof (data.role ?? data.user_role) === 'string' && { role: data.role ?? data.user_role }),
      ...(data.provider && { provider: data.provider }),
      ...((data.displayName ?? data.display_name) && { displayName: data.displayName ?? data.display_name }),
      ...(typeof data.privacy_consent_given === 'boolean' && { privacyConsentGiven: data.privacy_consent_given }),
    }
    return user
  }

  /** 개인정보 수집·이용 동의 저장. 동의 후에만 서비스 메뉴 접근 가능 */
  async saveConsent(): Promise<{ success: boolean; privacy_consent_given: boolean }> {
    if (isMockMode) {
      return { success: true, privacy_consent_given: true }
    }
    const client = new ApiClient(V1_API_BASE)
    return client.post<{ success: boolean; privacy_consent_given: boolean }>('/users/me/consent', {})
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    if (isMockMode) {
      return mockDataService.updateUser(userId, updates)
    }
    const client = new ApiClient(API_BASE_URL)
    const data = await client.put<any>(`/api/users/${userId}`, updates)
    const user: User = {
      id: data.id,
      name: data.display_name || data.name,
      email: data.email,
      createdAt: data.created_at || data.createdAt,
      ...(data.provider && { provider: data.provider }),
      ...(data.display_name && { displayName: data.display_name }),
    }
    return user
  }

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    if (isMockMode) {
      // Mock 모드에서는 로컬 스토리지만 정리
      TokenManager.clearTokens()
      return { success: true, message: '계정이 삭제되었습니다' }
    }
    const client = new ApiClient(V1_API_BASE)
    const result = await client.delete<{ success: boolean; message: string }>('/users/me')
    // 성공 시 토큰 정리
    if (result.success) {
      TokenManager.clearTokens()
    }
    return result
  }
}

class DirectionApi {
  async getDirections(date?: string): Promise<Directions> {
    const client = new ApiClient(V1_API_BASE)
    const query = date ? `?date=${date}` : ''
    return client.get<Directions>(`/users/me/directions${query}`)
  }
}

class SpotApi {
  async getSpots(lat: number, lng: number, purpose?: string): Promise<{ center: any; radius_km: number; spots: Spot[] }> {
    const client = new ApiClient(V1_API_BASE)
    const query = `?lat=${lat}&lng=${lng}${purpose ? `&purpose=${purpose}` : ''}`
    return client.get<{ center: any; radius_km: number; spots: Spot[] }>(`/users/me/spots${query}`)
  }
}

/** 행운 번호 단일 조회 응답 (오늘/특정일) */
export interface LuckyDrawResponse {
  date: string
  type: string
  numbers: number[]
  message?: string
  disclaimer?: string
  alreadyGeneratedToday?: boolean
}

/** 행운 번호 생성 응답 (201 또는 409 시 동일 형식) */
export interface LuckyGenerateResponse {
  alreadyGeneratedToday: boolean
  date: string
  type: string
  numbers: number[]
}

/** 행운 번호 히스토리 항목 */
export interface LuckyDrawHistoryItem {
  date: string
  type: string
  numbers: number[]
}

class LuckyApi {
  /** 오늘 생성된 행운 번호 조회. date 있으면 해당 날짜로 조회(클라이언트 오늘 기준 초기화용). 없으면 null (404). */
  async getTodayLuckyNumbers(date?: string): Promise<LuckyDrawResponse | null> {
    const client = new ApiClient(V1_API_BASE)
    const url = date ? `/users/me/lucky-numbers?date=${encodeURIComponent(date)}` : '/users/me/lucky-numbers'
    try {
      return await client.get<LuckyDrawResponse>(url)
    } catch (e: any) {
      if (e?.statusCode === 404) return null
      throw e
    }
  }

  /** 행운 번호 생성 (오늘 1회). 이미 생성됐으면 409 body 반환 + alreadyGeneratedToday: true */
  async generateLuckyNumbers(type: 'lotto' | 'normal' = 'lotto'): Promise<LuckyGenerateResponse> {
    const token = TokenManager.getAccessToken()
    const url = `${V1_API_BASE}/users/me/lucky-numbers`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ type }),
      credentials: 'include',
    })
    const data = await res.json().catch(() => ({})) as { date?: string; type?: string; numbers?: number[] }
    if (res.status === 409) {
      return {
        alreadyGeneratedToday: true,
        date: data.date ?? '',
        type: data.type ?? 'lotto',
        numbers: Array.isArray(data.numbers) ? data.numbers : [],
      }
    }
    if (!res.ok) {
      const msg = (data as { message?: string; error?: string })?.message ?? (data as { error?: string })?.error ?? (res.statusText || `HTTP ${res.status}`)
      const err = new Error(msg) as Error & { statusCode: number }
      err.statusCode = res.status
      throw err
    }
    return {
      alreadyGeneratedToday: false,
      date: data.date ?? '',
      type: data.type ?? 'lotto',
      numbers: Array.isArray(data.numbers) ? data.numbers : [],
    }
  }

  /** 과거 행운 번호 목록 (날짜 내림차순) */
  async getLuckyNumbersHistory(limit = 30): Promise<LuckyDrawHistoryItem[]> {
    const client = new ApiClient(V1_API_BASE)
    return client.get<LuckyDrawHistoryItem[]>(`/users/me/lucky-numbers/history?limit=${limit}`)
  }

  /** 특정 날짜 행운 번호 조회 (히스토리/과거일용). 없으면 404 throw */
  async getLuckyNumbersByDate(date: string): Promise<LuckyDrawResponse> {
    const client = new ApiClient(V1_API_BASE)
    return client.get<LuckyDrawResponse>(`/users/me/lucky-numbers?date=${encodeURIComponent(date)}`)
  }
}

export interface GameScoreSubmitResponse {
  weekKey: string
  score: number
  updated: boolean
  message?: string
}

export interface GameRankingEntry {
  rank: number
  userId: string
  displayName: string
  score?: number
  points?: number
}

export interface GameRankingResponse {
  weekKey: string
  gameId?: string
  list: GameRankingEntry[]
  myRank?: number
  myScore?: number
  total: number
}

export interface GameRankingAllResponse {
  weekKey: string
  list: GameRankingEntry[]
  myRank?: number
  total: number
}

class GameScoresApi {
  async submit(gameId: string, score: number, metadata?: Record<string, unknown>): Promise<GameScoreSubmitResponse> {
    const client = new ApiClient(V1_API_BASE)
    return client.post<GameScoreSubmitResponse>('/users/me/game-scores', { gameId, score, metadata })
  }

  async getRanking(gameId: string, weekKey?: string, limit = 20): Promise<GameRankingResponse> {
    const client = new ApiClient(V1_API_BASE)
    const params = new URLSearchParams({ gameId, limit: String(limit) })
    if (weekKey) params.set('weekKey', weekKey)
    return client.get<GameRankingResponse>(`/users/me/game-scores/rankings?${params}`)
  }

  async getRankingAll(weekKey?: string, limit = 20): Promise<GameRankingAllResponse> {
    const client = new ApiClient(V1_API_BASE)
    const params = new URLSearchParams({ limit: String(limit) })
    if (weekKey) params.set('weekKey', weekKey)
    return client.get<GameRankingAllResponse>(`/users/me/game-scores/rankings/all?${params}`)
  }
}

class ReportApi {
  async getMonthlyReport(year?: string, month?: string): Promise<MonthlyReport> {
    const client = new ApiClient(V1_API_BASE)
    const query = year && month ? `?year=${year}&month=${month}` : ''
    return client.get<MonthlyReport>(`/users/me/reports/monthly${query}`)
  }
}

class AuthApi {
  /** 당분간 구글 로그인만 사용 (카카오 등 추후 적용 예정) */
  async signInWithOAuth(provider: 'google') {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
    return data
  }

  async handleAuthCallback(): Promise<OAuthCallbackResponse | null> {
    console.log('[AuthCallback] 시작')
    
    // URL hash에 토큰이 있으면 Supabase 클라이언트 호출 없이 백엔드로 바로 전달
    // (프론트 Supabase env 미설정 시 "Invalid API key" 방지)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessTokenFromHash = hashParams.get('access_token')
    const refreshTokenFromHash = hashParams.get('refresh_token')
    
    if (accessTokenFromHash) {
      console.log('[AuthCallback] Hash에서 access_token 발견, 백엔드로 직접 전달')
      const client = new ApiClient(V1_API_BASE)
      const response = await client.post<OAuthCallbackResponse>(
        '/auth/oauth/google/callback',
        {
          access_token: accessTokenFromHash,
          refresh_token: refreshTokenFromHash || '',
        }
      )
      TokenManager.setTokens(response.tokens.access_token, response.tokens.refresh_token)
      console.log('[AuthCallback] 토큰 저장 완료 (hash 경로)')
      return response
    }
    
    // Hash에 토큰이 없으면 Supabase 세션 사용 (로컬 등)
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession()
      console.log('[AuthCallback] Supabase 세션 확인:', { hasSession: !!session, error })
      
      if (error) throw error
      if (!session) return null

      const provider = session.user.app_metadata?.provider || 'google'
      const client = new ApiClient(V1_API_BASE)
      const response = await client.post<OAuthCallbackResponse>(
        `/auth/oauth/${provider}/callback`,
        {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }
      )

      console.log('[AuthCallback] 백엔드 응답:', { hasTokens: !!response.tokens.access_token, nextStep: response.next_step })
      TokenManager.setTokens(response.tokens.access_token, response.tokens.refresh_token)
      console.log('[AuthCallback] 토큰 저장 완료:', { hasStoredToken: !!TokenManager.getAccessToken() })
      return response
    } catch (e) {
      throw e
    }
  }

  async logout(): Promise<void> {
    const client = new ApiClient(V1_API_BASE)
    try {
      await client.post('/auth/logout', {})
      await supabaseClient.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      TokenManager.clearTokens()
    }
  }
}

class ProfileApi {
  /** 프로필 조회. 없으면 null (404 시 개인정보 입력 유도용) */
  async getProfile(): Promise<Profile | null> {
    try {
      const client = new ApiClient(V1_API_BASE)
      return await client.get<Profile>('/users/me/profile')
    } catch (error: any) {
      if (error?.statusCode === 404) return null
      throw error
    }
  }

  async saveProfile(data: {
    birth_date: string
    birth_time?: string
    gender: 'M' | 'F' | 'X'
    region?: string
    calendar_type?: 'solar' | 'lunar'
    is_intercalation?: boolean
  }): Promise<{
    profile_id: string
    status: string
    next_step: string
    saju_analysis_id?: string | null
    saju_analysis_status?: string
    profile?: Profile | null
  }> {
    const client = new ApiClient(V1_API_BASE)
    return client.post('/users/me/profile', data)
  }

  /** 사주 상세 분석 조회 (다른 메뉴에서 재사용). 없으면 200 + status: 'not_found' 또는 404 → null */
  async getSajuAnalysis(): Promise<SajuAnalysisResponse | null> {
    try {
      const client = new ApiClient(V1_API_BASE)
      const data = await client.get<SajuAnalysisResponse | { status: 'not_found'; message?: string }>('/users/me/saju-analysis')
      if (data && 'status' in data && data.status === 'not_found') return null
      return data as SajuAnalysisResponse
    } catch (error: any) {
      if (error?.statusCode === 404) return null
      throw error
    }
  }

  /** 저장된 프로필의 사주로 OpenAI 사주 분석 생성 (버튼 클릭 시). 201 { id, status } */
  async generateSajuAnalysis(): Promise<{ id: string; status: string }> {
    const client = new ApiClient(V1_API_BASE)
    return client.post<{ id: string; status: string }>('/users/me/saju-analysis/generate', {})
  }
}

class LifeProfileApi {
  async generateLifeProfile(profileId: string, options?: {
    detail_level?: 'summary' | 'standard' | 'deep'
    language?: string
  }): Promise<{ job_id: string; status: string }> {
    const client = new ApiClient(V1_API_BASE)
    return client.post('/users/me/life-profile/generate', {
      profile_id: profileId,
      options: options || { detail_level: 'standard', language: 'ko' },
    })
  }

  async getJobStatus(jobId: string): Promise<Job> {
    const client = new ApiClient(V1_API_BASE)
    return client.get<Job>(`/jobs/${jobId}`)
  }

  async getLifeProfile(): Promise<{ life_profile: LifeProfile; updated_at: number; version: string } | null> {
    try {
      const client = new ApiClient(V1_API_BASE)
      return await client.get<{ life_profile: LifeProfile; updated_at: number; version: string }>('/users/me/life-profile')
    } catch (error: any) {
      // 404는 Life Profile이 아직 생성되지 않은 정상적인 경우
      if (error?.statusCode === 404 || 
          error?.message?.includes('404') || 
          error?.message?.includes('Not Found') ||
          error?.message?.includes('not found')) {
        console.log('Life Profile이 아직 생성되지 않았습니다.')
        return null
      }
      // 다른 에러는 그대로 throw
      throw error
    }
  }
}

class DailyGuideApi {
  async getDailyGuide(date?: string): Promise<DailyGuide> {
    try {
      const client = new ApiClient(V1_API_BASE)
      const query = date ? `?date=${date}` : ''
      return await client.get<DailyGuide>(`/users/me/daily-guide${query}`)
    } catch (error) {
      console.warn('DailyGuideApi: API call failed, returning mock data', error)
      // 목업 데이터 반환
      const targetDate = date || new Date().toISOString().split('T')[0]
      return {
        date: targetDate,
        phase_tag: 'phase-3',
        energy_index: 75,
        summary: '오늘은 활동적인 하루가 될 것입니다. 오전에 집중력이 높으니 중요한 일을 계획하세요.',
        do: [
          '창의적인 작업에 집중하기',
          '중요한 결정은 오전에 하기',
          '가벼운 운동으로 에너지 회복',
        ],
        avoid: [
          '과도한 업무 스케줄',
          '중요한 약속을 오후 늦게 잡기',
        ],
        relationships: '오늘은 협력적인 대화가 잘 통할 시기입니다. 팀 프로젝트나 협업에 집중하세요.',
      }
    }
  }
}

class AdminApi {
  async getStats(): Promise<{
    totalUsers: number
    totalSubscribers: number
    totalRevenue: number
    monthlyGrowth: number
    activeSubscriptions: number
  }> {
    const client = new ApiClient(V1_API_BASE)
    return client.get('/admin/stats')
  }

  async getUsers(page = 1, limit = 20): Promise<{
    users: any[]
    total: number
    pages: number
  }> {
    const client = new ApiClient(V1_API_BASE)
    return client.get(`/admin/users?page=${page}&limit=${limit}`)
  }

  async getUserById(id: string): Promise<any> {
    const client = new ApiClient(V1_API_BASE)
    return client.get(`/admin/users/${id}`)
  }

  async updateUserRole(id: string, role: string): Promise<any> {
    const client = new ApiClient(V1_API_BASE)
    return client.patch(`/admin/users/${id}/role`, { role })
  }

  async getAiCosts(): Promise<{
    totalCost: number
    usageByModel: Record<string, number>
    recentLogs: any[]
  }> {
    const client = new ApiClient(V1_API_BASE)
    return client.get('/admin/ai-costs')
  }

  async getAuditLogs(page = 1): Promise<{ logs: any[]; total: number; pages: number }> {
    const client = new ApiClient(V1_API_BASE)
    return client.get(`/admin/audit-logs?page=${page}`)
  }

  async getGuides(): Promise<any[]> {
    const client = new ApiClient(V1_API_BASE)
    return client.get('/admin/guides')
  }

  async createGuide(data: any): Promise<any> {
    const client = new ApiClient(V1_API_BASE)
    return client.post('/admin/guides', data)
  }

  async updateGuide(id: string, data: any): Promise<any> {
    const client = new ApiClient(V1_API_BASE)
    return client.patch(`/admin/guides/${id}`, data)
  }

  async getSpots(): Promise<any[]> {
    const client = new ApiClient(V1_API_BASE)
    return client.get('/admin/spots')
  }

  async createSpot(data: any): Promise<any> {
    const client = new ApiClient(V1_API_BASE)
    return client.post('/admin/spots', data)
  }

  async updateSpot(id: string, data: any): Promise<any> {
    const client = new ApiClient(V1_API_BASE)
    return client.patch(`/admin/spots/${id}`, data)
  }

  async getCoupons(): Promise<any[]> {
    const client = new ApiClient(V1_API_BASE)
    return client.get('/admin/coupons')
  }

  async createCoupon(data: any): Promise<any> {
    const client = new ApiClient(V1_API_BASE)
    return client.post('/admin/coupons', data)
  }

  async updateCoupon(id: string, data: any): Promise<any> {
    const client = new ApiClient(V1_API_BASE)
    return client.patch(`/admin/coupons/${id}`, data)
  }

  async getPayments(page = 1, limit = 20): Promise<{ payments: any[]; total: number; pages: number }> {
    const client = new ApiClient(V1_API_BASE)
    return client.get(`/admin/payments?page=${page}&limit=${limit}`)
  }

  async refundPayment(id: string, reason?: string): Promise<any> {
    const client = new ApiClient(V1_API_BASE)
    return client.post(`/admin/payments/${id}/refund`, { reason })
  }

  async overrideSubscription(userId: string, data: any): Promise<any> {
    const client = new ApiClient(V1_API_BASE)
    return client.post(`/admin/users/${userId}/override-subscription`, data)
  }

  async getRetention(): Promise<any[]> {
    const client = new ApiClient(V1_API_BASE)
    return client.get('/admin/analytics/retention')
  }

  async getBehaviorStats(from: string, to: string): Promise<{
    from: string | null
    to: string | null
    topMenus: any[]
    avgDuration: any[]
    hourlyActive: any[]
  }> {
    const client = new ApiClient(V1_API_BASE)
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const query = params.toString() ? `?${params.toString()}` : ''
    return client.get(`/admin/analytics/behavior${query}`)
  }

  async getRankings(params?: { weekKey?: string; gameId?: string; limit?: number }) {
    const client = new ApiClient(V1_API_BASE)
    const search = new URLSearchParams()
    if (params?.weekKey) search.set('weekKey', params.weekKey)
    if (params?.gameId) search.set('gameId', params.gameId)
    if (params?.limit) search.set('limit', String(params.limit))
    const q = search.toString()
    return client.get<{ weekKey: string; gameId?: string; list?: Array<{ rank: number; userId: string; displayName: string; email?: string; score: number }>; byGame?: Record<string, Array<{ rank: number; userId: string; score: number }>> }>(`/admin/rankings${q ? `?${q}` : ''}`)
  }

  async getRankingSettings() {
    const client = new ApiClient(V1_API_BASE)
    return client.get<{ week_start_day: number; games_enabled: Record<string, boolean> }>('/admin/rankings/settings')
  }

  async updateRankingSettings(data: { week_start_day?: number; games_enabled?: Record<string, boolean> }) {
    const client = new ApiClient(V1_API_BASE)
    return client.patch<{ week_start_day: number; games_enabled: Record<string, boolean> }>('/admin/rankings/settings', data)
  }

  async getSiteContentVersions(contentKey?: string): Promise<any[]> {
    const client = new ApiClient(V1_API_BASE)
    const query = contentKey ? `?contentKey=${contentKey}` : ''
    return client.get(`/admin/site-contents${query}`)
  }

  async createSiteContent(data: any): Promise<any> {
    const client = new ApiClient(V1_API_BASE)
    return client.post('/admin/site-contents', data)
  }

  async updateSiteContent(id: string, data: any): Promise<any> {
    const client = new ApiClient(V1_API_BASE)
    return client.patch(`/admin/site-contents/${id}`, data)
  }
}

class SiteContentApi {
  async getActive(contentKey: string): Promise<any> {
    const client = new ApiClient(V1_API_BASE)
    return client.get(`/site-contents/${contentKey}`)
  }
}

class AnalyticsApi {
  async logActivity(data: { type: string; path: string; durationMs?: number; metadata?: any }): Promise<void> {
    const client = new ApiClient(V1_API_BASE)
    return client.post('/analytics/log', data)
  }
}

export const authApi = new AuthApi()
export const profileApi = new ProfileApi()
export const lifeProfileApi = new LifeProfileApi()
export const dailyGuideApi = new DailyGuideApi()
export const directionApi = new DirectionApi()
export const spotApi = new SpotApi()
export const cycleApi = new CycleApi()
export const recordApi = new RecordApi()
export const userApi = new UserApi()
export const luckyApi = new LuckyApi()
export const gameScoresApi = new GameScoresApi()
export const reportApi = new ReportApi()
export const adminApi = new AdminApi()
export const siteContentApi = new SiteContentApi()
export const analyticsApi = new AnalyticsApi()
export { TokenManager }
