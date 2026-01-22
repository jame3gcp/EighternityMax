import type { CycleData, Period, Phase, Record, User, Interpretation } from '@/types'

// 8단계 사이클 정의
const PHASE_NAMES = [
  '새벽 (Dawn)',
  '상승 (Rising)',
  '정점 (Peak)',
  '유지 (Sustained)',
  '하강 (Declining)',
  '저점 (Low)',
  '회복 (Recovery)',
  '준비 (Preparation)',
]

const PHASE_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#10b981', // emerald
  '#06b6d4', // cyan
]

class MockDataService {
  private records: Record[] = []
  private currentUserId = 'user-1'

  private generatePhases(period: Period, currentPhase: number): Phase[] {
    return PHASE_NAMES.map((name, index) => {
      const isCurrent = index === currentPhase
      const baseEnergy = 50 + Math.sin((index / PHASE_NAMES.length) * Math.PI * 2) * 30
      const baseEmotion = 50 + Math.cos((index / PHASE_NAMES.length) * Math.PI * 2) * 30
      const baseFocus = 50 + Math.sin((index / PHASE_NAMES.length) * Math.PI * 2 + Math.PI / 4) * 30

      return {
        id: index,
        name,
        energy: Math.max(0, Math.min(100, baseEnergy + (isCurrent ? 10 : 0) + (Math.random() - 0.5) * 10)),
        emotion: Math.max(0, Math.min(100, baseEmotion + (isCurrent ? 10 : 0) + (Math.random() - 0.5) * 10)),
        focus: Math.max(0, Math.min(100, baseFocus + (isCurrent ? 10 : 0) + (Math.random() - 0.5) * 10)),
        description: `${name} 단계입니다. 이 시기에는 에너지가 ${baseEnergy > 60 ? '높게' : baseEnergy > 40 ? '중간' : '낮게'} 유지됩니다.`,
        recommendations: [
          `${name} 단계에 맞는 활동을 추천합니다.`,
          '충분한 휴식을 취하세요.',
          '규칙적인 생활 패턴을 유지하세요.',
        ],
        warnings: [
          '과도한 활동은 피하세요.',
          '스트레스를 관리하세요.',
        ],
        color: PHASE_COLORS[index],
      }
    })
  }

  getCycleData(period: Period): CycleData {
    // 현재 시간 기반으로 단계 계산 (간단한 예시)
    const now = new Date()
    const hours = now.getHours()
    const currentPhase = Math.floor((hours / 24) * 8) % 8

    return {
      userId: this.currentUserId,
      period,
      currentPhase,
      phases: this.generatePhases(period, currentPhase),
      timestamp: Date.now(),
    }
  }

  getInterpretation(phaseId: number): Interpretation {
    const phase = PHASE_NAMES[phaseId] || PHASE_NAMES[0]
    const nextPhaseId = (phaseId + 1) % PHASE_NAMES.length
    const nextPhase = PHASE_NAMES[nextPhaseId]

    return {
      phaseId,
      title: `${phase} 단계 해석`,
      description: `현재 ${phase} 단계에 있습니다. 이 단계는 사이클의 중요한 전환점입니다.`,
      recommendations: [
        '규칙적인 수면 패턴 유지',
        '적절한 운동과 휴식의 균형',
        '명상이나 호흡 운동 실천',
      ],
      warnings: [
        '과도한 스트레스 피하기',
        '충분한 수분 섭취',
      ],
      nextPhase,
      nextPhaseId,
    }
  }

  getCurrentUser(): User {
    return {
      id: this.currentUserId,
      name: '사용자',
      email: 'user@example.com',
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30일 전
    }
  }

  getRecords(userId: string, limit?: number): Record[] {
    if (this.records.length === 0) {
      // 초기 샘플 데이터 생성
      const today = new Date()
      for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        this.records.push({
          id: `record-${i}`,
          userId,
          date: date.toISOString().split('T')[0],
          energy: 50 + Math.sin(i / 5) * 30 + (Math.random() - 0.5) * 20,
          emotion: 50 + Math.cos(i / 5) * 30 + (Math.random() - 0.5) * 20,
          focus: 50 + Math.sin(i / 5 + 1) * 30 + (Math.random() - 0.5) * 20,
          memo: i % 3 === 0 ? `오늘은 ${i}일 전이었습니다.` : undefined,
          timestamp: date.getTime(),
        })
      }
      this.records.sort((a, b) => b.timestamp - a.timestamp)
    }

    const userRecords = this.records.filter((r) => r.userId === userId)
    return limit ? userRecords.slice(0, limit) : userRecords
  }

  createRecord(record: Omit<Record, 'id' | 'timestamp'>): Record {
    const newRecord: Record = {
      ...record,
      id: `record-${Date.now()}`,
      timestamp: Date.now(),
    }
    this.records.push(newRecord)
    this.records.sort((a, b) => b.timestamp - a.timestamp)
    return newRecord
  }

  updateRecord(id: string, updates: Partial<Record>): Record {
    const index = this.records.findIndex((r) => r.id === id)
    if (index === -1) {
      throw new Error('Record not found')
    }
    this.records[index] = { ...this.records[index], ...updates }
    return this.records[index]
  }

  deleteRecord(id: string): void {
    const index = this.records.findIndex((r) => r.id === id)
    if (index !== -1) {
      this.records.splice(index, 1)
    }
  }

  updateUser(userId: string, updates: Partial<User>): User {
    // 간단한 목업이므로 실제로는 저장하지 않음
    const user = this.getCurrentUser()
    return { ...user, ...updates }
  }
}

export const mockDataService = new MockDataService()
