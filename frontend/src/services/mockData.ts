import type { CycleData, Period, Phase, Record, User, Interpretation } from '@/types'

// 8단계 사이클 정의 (backend/src/data/interpretationPhases.js와 동기화)
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

const PHASE_INTERPRETATIONS = [
  {
    periodSummary: '오늘은 새벽 구간에서 시작해 점차 상승할 흐름입니다.',
    description: '새벽 단계는 하루 사이클의 시작점입니다. 에너지가 아직 낮고, 몸과 마음이 깨어나기 시작하는 시간대입니다. 무리한 결정이나 과한 활동보다는 가볍게 하루를 여는 데 집중하세요.',
    energyTraitSummary: '에너지·감정·집중이 모두 낮은 구간으로, 점차 상승할 준비가 됩니다.',
    recommendations: ['가벼운 스트레칭이나 호흡으로 몸 깨우기', '오늘 할 일을 간단히 정리만 하기', '무거운 업무는 미루고 가벼운 루틴만 진행하기'],
    warnings: ['새벽에 중요한 결정이나 대화는 피하기', '과한 카페인으로 급격히 끌어올리지 않기'],
    nextPhaseDescription: '상승 단계에서는 에너지가 서서히 올라갑니다. 집중이 필요한 일을 이때부터 시작하면 좋습니다.',
    nextPhaseTransitionHint: '대략 2~3시간 후 상승 구간으로 넘어갑니다. 아침 식사와 함께 가벼운 활동을 시작해 보세요.',
  },
  {
    periodSummary: '오늘은 상승 구간으로 에너지와 집중이 서서히 올라가는 흐름입니다.',
    description: '상승 단계는 에너지와 집중력이 서서히 올라가는 시기입니다. 아침을 지나 활력이 생기기 시작하므로, 난이도 있는 일이나 학습을 시작하기 좋습니다.',
    energyTraitSummary: '에너지와 집중이 상승하는 구간으로, 점점 피크에 가까워집니다.',
    recommendations: ['중요한 업무나 공부를 이 시간대에 배치하기', '짧은 휴식으로 리듬 유지하기', '소통이 필요한 일을 앞당겨 처리하기'],
    warnings: ['한꺼번에 너무 많은 일을 맡지 않기', '점심 전 과식으로 오후 에너지를 깎지 않기'],
    nextPhaseDescription: '정점 단계에서는 하루 중 에너지와 집중이 가장 높습니다. 가장 중요한 일을 이 구간에 배치하세요.',
    nextPhaseTransitionHint: '몇 시간 안에 정점에 도달합니다. 지금부터 난이도 높은 작업을 준비해 두세요.',
  },
  {
    periodSummary: '오늘은 정점 구간으로 하루 중 에너지가 가장 높은 시간대입니다.',
    description: '정점 단계는 하루 사이클에서 에너지·감정·집중이 가장 높은 구간입니다. 중요한 결정, 프레젠테이션, 창의적 작업처럼 최고의 퍼포먼스가 필요한 일을 하기에 적합합니다.',
    energyTraitSummary: '에너지·감정·집중이 모두 높은 피크 구간입니다.',
    recommendations: ['가장 어렵거나 중요한 일을 이 시간에 처리하기', '회의나 협상, 발표 등 소통이 중요한 일 배치하기', '짧은 브레이크로 집중력을 오래 유지하기'],
    warnings: ['정점에서 무리하게 일을 밀어붙이지 않기', '휴식 없이 연속으로 일하면 이후 급격히 떨어질 수 있음'],
    nextPhaseDescription: '유지 단계에서는 높은 수준을 유지하면서도 점차 완만히 이어갑니다. 마무리 작업에 적합합니다.',
    nextPhaseTransitionHint: '정점은 길지 않습니다. 핵심 업무를 먼저 끝내고, 나머지는 유지 구간으로 넘기세요.',
  },
  {
    periodSummary: '오늘은 유지 구간으로 높은 에너지를 유지하다 점차 하강으로 넘어가는 흐름입니다.',
    description: '유지 단계는 높았던 에너지가 서서히 유지되며 완만히 이어지는 시기입니다. 정점에서 맡은 일을 마무리하거나, 반복 작업·정리 같은 데 적합합니다.',
    energyTraitSummary: '에너지와 집중이 높은 편을 유지하되, 점차 하강으로 넘어가는 구간입니다.',
    recommendations: ['진행 중인 일의 마무리와 정리하기', '이메일·문서 정리 등 반복 업무 처리하기', '가벼운 회의나 점검 업무 배치하기'],
    warnings: ['새로운 대형 프로젝트를 이 구간에 시작하지 않기', '과한 멀티태스킹으로 집중을 흐트리지 않기'],
    nextPhaseDescription: '하강 단계에서는 에너지가 서서히 줄어듭니다. 새로운 무리한 일보다는 마무리와 전환을 생각하세요.',
    nextPhaseTransitionHint: '곧 하강 구간으로 넘어갑니다. 지금까지 한 일을 정리하고, 저녁 루틴을 준비하세요.',
  },
  {
    periodSummary: '오늘은 하강 구간으로 에너지가 서서히 줄어드는 흐름입니다.',
    description: '하강 단계는 에너지와 집중이 서서히 줄어드는 시기입니다. 새로운 무리한 일보다는 마무리, 정리, 팀원과의 소통처럼 부담을 줄인 활동이 적합합니다.',
    energyTraitSummary: '에너지·집중이 점차 낮아지는 구간입니다.',
    recommendations: ['미완료 업무를 가볍게 마무리하거나 내일로 넘기기', '동료와의 간단한 소통·정리 회의하기', '가벼운 산책이나 스트레칭으로 전환하기'],
    warnings: ['이 시간에 중요한 결정이나 새 프로젝트 시작 피하기', '카페인·과식으로 억지로 끌어올리지 않기'],
    nextPhaseDescription: '저점 단계에서는 에너지가 가장 낮습니다. 휴식과 회복에 집중하세요.',
    nextPhaseTransitionHint: '저점이 오기 전에 일과를 정리하고, 휴식 모드로 전환할 준비를 하세요.',
  },
  {
    periodSummary: '오늘은 저점 구간으로 에너지가 가장 낮은 시간대입니다. 잠시 쉬었다가 회복을 기다리세요.',
    description: '저점 단계는 하루 사이클에서 에너지·감정·집중이 가장 낮은 구간입니다. 무리한 업무보다는 휴식, 가벼운 식사, 짧은 낮잠이나 명상으로 회복하는 데 맞춰 보내는 것이 좋습니다.',
    energyTraitSummary: '에너지·감정·집중이 모두 낮은 구간으로, 회복의 시작을 기다리는 시간입니다.',
    recommendations: ['15~20분 가벼운 낮잠이나 눈 감고 쉬기', '가벼운 간식·수분 섭취로 에너지 보충하기', '단순·반복 작업만 하거나 미루기'],
    warnings: ['저점에서 중요한 일을 하거나 큰 결정 내리지 않기', '과한 카페인·당분으로 급상승 후 반등 피하기'],
    nextPhaseDescription: '회복 단계에서는 에너지가 서서히 올라갑니다. 가벼운 활동부터 다시 시작하세요.',
    nextPhaseTransitionHint: '저점은 오래 가지 않습니다. 잠시 쉬었다가 회복 구간에서 가벼운 일부터 재개하세요.',
  },
  {
    periodSummary: '오늘은 회복 구간으로 에너지가 서서히 올라가는 흐름입니다.',
    description: '회복 단계는 저점을 지나 에너지와 기분이 서서히 올라가는 시기입니다. 무리한 업무보다는 가벼운 운동, 정리, 다음 날 준비처럼 부담 적은 활동이 잘 맞습니다.',
    energyTraitSummary: '에너지·감정이 서서히 상승하는 구간입니다.',
    recommendations: ['가벼운 산책·스트레칭으로 몸 풀기', '내일 할 일 정리·우선순위 정하기', '가족·친구와 가벼운 대화나 취미 활동하기'],
    warnings: ['회복 직후 무거운 일을 한꺼번에 맡지 않기', '늦은 시간 카페인으로 수면 리듬 깨지 않기'],
    nextPhaseDescription: '준비 단계에서는 하루를 마무리하고 다음 날을 위한 휴식·준비를 하기에 좋습니다.',
    nextPhaseTransitionHint: '곧 준비 구간으로 넘어갑니다. 저녁 루틴을 시작하고 수면 준비를 하세요.',
  },
  {
    periodSummary: '오늘은 준비 구간으로 하루를 마무리하고 내일을 위한 휴식 시간입니다.',
    description: '준비 단계는 하루 사이클의 마지막 구간으로, 다음 날 새벽을 위한 휴식과 정리가 적합한 시간입니다. 강한 자극이나 새 업무보다는 마무리와 이완에 집중하세요.',
    energyTraitSummary: '에너지가 낮아지며 휴식 모드로 전환되는 구간입니다.',
    recommendations: ['수면 환경 정리·라이트 다운하기', '내일 아침 루틴만 간단히 생각해 두기', '명상·호흡·가벼운 독서로 이완하기'],
    warnings: ['늦은 밤까지 스마트폰·밝은 화면으로 수면 방해하지 않기', '새로운 일이나 논의를 밤늦게 시작하지 않기'],
    nextPhaseDescription: '다음은 새벽 단계입니다. 충분한 수면 후 다시 상승 구간에서 하루를 시작하게 됩니다.',
    nextPhaseTransitionHint: '곧 새벽 구간으로 이어집니다. 규칙적인 수면으로 내일 사이클을 준비하세요.',
  },
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
    const safeId = Math.max(0, Math.min(7, phaseId))
    const phase = PHASE_NAMES[safeId]
    const nextPhaseId = (safeId + 1) % PHASE_NAMES.length
    const nextPhaseName = PHASE_NAMES[nextPhaseId]
    const content = PHASE_INTERPRETATIONS[safeId] ?? PHASE_INTERPRETATIONS[0]

    return {
      phaseId: safeId,
      title: `${phase} 단계 해석`,
      description: content.description,
      energyTraitSummary: content.energyTraitSummary,
      recommendations: content.recommendations,
      warnings: content.warnings,
      recommendationItems: content.recommendations.map((text) => ({ text })),
      warningItems: content.warnings.map((text) => ({ text })),
      nextPhase: nextPhaseId,
      nextPhaseName,
      periodSummary: content.periodSummary,
      nextPhaseDescription: content.nextPhaseDescription,
      nextPhaseTransitionHint: content.nextPhaseTransitionHint,
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

  /** 당일 기록은 최종값 1건만: 같은 날 있으면 update, 없으면 insert */
  createRecord(record: Omit<Record, 'id' | 'timestamp'>): Record {
    const existing = this.records.find(
      (r) => r.userId === record.userId && r.date === record.date
    )
    if (existing) {
      return this.updateRecord(existing.id, {
        energy: record.energy,
        emotion: record.emotion,
        focus: record.focus,
        memo: record.memo,
        timestamp: Date.now(),
      })
    }
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
