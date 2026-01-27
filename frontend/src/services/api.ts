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
} from '@/types'
import { mockDataService } from './mockData'

// API Base URL 설정
// - 개발 환경: localhost 또는 환경 변수 값
// - 프로덕션 환경: 환경 변수가 없으면 상대 경로 사용 (Vercel과 같은 도메인)
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  
  // 환경 변수가 명시적으로 설정되어 있으면 사용
  if (envUrl && envUrl.trim() !== '') {
    return envUrl
  }
  
  // 프로덕션 환경에서는 상대 경로 사용 (Vercel과 같은 도메인)
  if (import.meta.env.PROD) {
    return '' // 빈 문자열 = 상대 경로 → /v1/...
  }
  
  // 개발 환경에서는 localhost 기본값
  return 'http://localhost:3001'
}

const API_BASE_URL = getApiBaseUrl()
const V1_API_BASE = API_BASE_URL ? `${API_BASE_URL}/v1` : '/v1'

const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'

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

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    })

    if (response.status === 401 && accessToken) {
      try {
        await this.refreshToken()
        const retryHeaders: Record<string, string> = { ...headers }
        retryHeaders['Authorization'] = `Bearer ${TokenManager.getAccessToken()}`
        
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: retryHeaders,
          credentials: 'include',
        })
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
      const error: any = new Error(`API Error: ${response.statusText}`)
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
    return {
      id: data.id,
      name: data.display_name || data.name || '사용자',
      email: data.email,
      createdAt: data.created_at || data.createdAt,
      provider: data.provider,
      displayName: data.display_name,
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    if (isMockMode) {
      return mockDataService.updateUser(userId, updates)
    }
    const client = new ApiClient(API_BASE_URL)
    const data = await client.put<any>(`/api/users/${userId}`, updates)
    return {
      id: data.id,
      name: data.display_name || data.name,
      email: data.email,
      createdAt: data.created_at || data.createdAt,
      provider: data.provider,
      displayName: data.display_name,
    }
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

class LuckyApi {
  async getLuckyNumbers(type: 'lotto' | 'normal' = 'lotto', date?: string): Promise<{ numbers: number[]; message: string; disclaimer: string }> {
    const client = new ApiClient(V1_API_BASE)
    const query = `?type=${type}${date ? `&date=${date}` : ''}`
    return client.get<{ numbers: number[]; message: string; disclaimer: string }>(`/users/me/lucky-numbers${query}`)
  }
}

class ReportApi {
  async getMonthlyReport(year?: string, month?: string): Promise<MonthlyReport> {
    const client = new ApiClient(V1_API_BASE)
    const query = year && month ? `?year=${year}&month=${month}` : ''
    return client.get<MonthlyReport>(`/users/me/reports/monthly${query}`)
  }
}

import { supabase as supabaseClient } from './supabase'
import type { Provider } from '@supabase/supabase-js'

class AuthApi {
  async signInWithOAuth(provider: 'kakao' | 'google' | 'facebook' | 'apple') {
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
    const { data: { session }, error } = await supabaseClient.auth.getSession()
    if (error) throw error
    if (!session) return null

    const client = new ApiClient(V1_API_BASE)
    const response = await client.post<OAuthCallbackResponse>(
      `/auth/oauth/${session.user.app_metadata.provider || 'supabase'}/callback`,
      {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }
    )

    TokenManager.setTokens(response.tokens.access_token, response.tokens.refresh_token)
    return response
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
  async getProfile(): Promise<Profile> {
    const client = new ApiClient(V1_API_BASE)
    return client.get<Profile>('/users/me/profile')
  }

  async saveProfile(data: {
    birth_date: string
    birth_time?: string
    gender: 'M' | 'F' | 'X'
    region?: string
  }): Promise<{ profile_id: string; status: string; next_step: string }> {
    const client = new ApiClient(V1_API_BASE)
    return client.post('/users/me/profile', data)
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

export const cycleApi = new CycleApi()
export const recordApi = new RecordApi()
export const userApi = new UserApi()
export const authApi = new AuthApi()
export const profileApi = new ProfileApi()
export const lifeProfileApi = new LifeProfileApi()
export const dailyGuideApi = new DailyGuideApi()
export const directionApi = new DirectionApi()
export const spotApi = new SpotApi()
export const luckyApi = new LuckyApi()
export const reportApi = new ReportApi()
export { TokenManager }
