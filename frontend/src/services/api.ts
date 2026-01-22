import type { CycleData, Period, Record, User, Interpretation } from '@/types'
import { mockDataService } from './mockData'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
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

// 목업 모드에서는 실제 API 대신 목업 데이터를 반환
const isMockMode = !import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL.includes('localhost')

class CycleApi {
  async getCycle(period: Period): Promise<CycleData> {
    if (isMockMode) {
      return mockDataService.getCycleData(period)
    }
    const client = new ApiClient(API_BASE_URL)
    return client.get<CycleData>(`/cycles?period=${period}`)
  }

  async getInterpretation(phaseId: number): Promise<Interpretation> {
    if (isMockMode) {
      return mockDataService.getInterpretation(phaseId)
    }
    const client = new ApiClient(API_BASE_URL)
    return client.get<Interpretation>(`/interpretations/${phaseId}`)
  }
}

class RecordApi {
  async getRecords(userId: string, limit?: number): Promise<Record[]> {
    if (isMockMode) {
      return mockDataService.getRecords(userId, limit)
    }
    const client = new ApiClient(API_BASE_URL)
    const url = limit ? `/records?userId=${userId}&limit=${limit}` : `/records?userId=${userId}`
    return client.get<Record[]>(url)
  }

  async createRecord(record: Omit<Record, 'id' | 'timestamp'>): Promise<Record> {
    if (isMockMode) {
      return mockDataService.createRecord(record)
    }
    const client = new ApiClient(API_BASE_URL)
    return client.post<Record>('/records', record)
  }

  async updateRecord(id: string, record: Partial<Record>): Promise<Record> {
    if (isMockMode) {
      return mockDataService.updateRecord(id, record)
    }
    const client = new ApiClient(API_BASE_URL)
    return client.put<Record>(`/records/${id}`, record)
  }

  async deleteRecord(id: string): Promise<void> {
    if (isMockMode) {
      return mockDataService.deleteRecord(id)
    }
    const client = new ApiClient(API_BASE_URL)
    return client.delete<void>(`/records/${id}`)
  }
}

class UserApi {
  async getCurrentUser(): Promise<User> {
    if (isMockMode) {
      return mockDataService.getCurrentUser()
    }
    const client = new ApiClient(API_BASE_URL)
    return client.get<User>('/users/me')
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    if (isMockMode) {
      return mockDataService.updateUser(userId, updates)
    }
    const client = new ApiClient(API_BASE_URL)
    return client.put<User>(`/users/${userId}`, updates)
  }
}

export const cycleApi = new CycleApi()
export const recordApi = new RecordApi()
export const userApi = new UserApi()
