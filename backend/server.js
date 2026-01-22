import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// 데이터 파일 경로
const dataPath = join(__dirname, 'mock-data', 'data.json')

// 초기 데이터 로드
let data = {
  users: [
    {
      id: 'user-1',
      name: '사용자',
      email: 'user@example.com',
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    },
  ],
  records: [],
  cycles: [],
}

// 데이터 파일이 있으면 로드
try {
  const fileData = readFileSync(dataPath, 'utf-8')
  data = JSON.parse(fileData)
} catch (error) {
  // 파일이 없으면 초기 데이터로 시작
  writeFileSync(dataPath, JSON.stringify(data, null, 2))
}

// 데이터 저장 함수
const saveData = () => {
  writeFileSync(dataPath, JSON.stringify(data, null, 2))
}

// ===== 사용자 API =====
app.get('/api/users/me', (req, res) => {
  const user = data.users[0] || null
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json(user)
})

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params
  const userIndex = data.users.findIndex((u) => u.id === id)
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' })
  }
  data.users[userIndex] = { ...data.users[userIndex], ...req.body }
  saveData()
  res.json(data.users[userIndex])
})

// ===== 사이클 API =====
app.get('/api/cycles', (req, res) => {
  const { period = 'day' } = req.query
  const userId = req.query.userId || 'user-1'

  // 간단한 사이클 데이터 생성
  const now = new Date()
  const hours = now.getHours()
  const currentPhase = Math.floor((hours / 24) * 8) % 8

  const phaseNames = [
    '새벽 (Dawn)',
    '상승 (Rising)',
    '정점 (Peak)',
    '유지 (Sustained)',
    '하강 (Declining)',
    '저점 (Low)',
    '회복 (Recovery)',
    '준비 (Preparation)',
  ]

  const phaseColors = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b',
    '#f97316',
    '#ef4444',
    '#10b981',
    '#06b6d4',
  ]

  const phases = phaseNames.map((name, index) => {
    const baseEnergy = 50 + Math.sin((index / phaseNames.length) * Math.PI * 2) * 30
    const baseEmotion = 50 + Math.cos((index / phaseNames.length) * Math.PI * 2) * 30
    const baseFocus = 50 + Math.sin((index / phaseNames.length) * Math.PI * 2 + Math.PI / 4) * 30

    return {
      id: index,
      name,
      energy: Math.max(0, Math.min(100, baseEnergy + (index === currentPhase ? 10 : 0))),
      emotion: Math.max(0, Math.min(100, baseEmotion + (index === currentPhase ? 10 : 0))),
      focus: Math.max(0, Math.min(100, baseFocus + (index === currentPhase ? 10 : 0))),
      description: `${name} 단계입니다.`,
      recommendations: [
        `${name} 단계에 맞는 활동을 추천합니다.`,
        '충분한 휴식을 취하세요.',
        '규칙적인 생활 패턴을 유지하세요.',
      ],
      warnings: ['과도한 활동은 피하세요.', '스트레스를 관리하세요.'],
      color: phaseColors[index],
    }
  })

  const cycle = {
    userId,
    period,
    currentPhase,
    phases,
    timestamp: Date.now(),
  }

  res.json(cycle)
})

// ===== 해석 API =====
app.get('/api/interpretations/:phaseId', (req, res) => {
  const phaseId = parseInt(req.params.phaseId, 10)
  const phaseNames = [
    '새벽 (Dawn)',
    '상승 (Rising)',
    '정점 (Peak)',
    '유지 (Sustained)',
    '하강 (Declining)',
    '저점 (Low)',
    '회복 (Recovery)',
    '준비 (Preparation)',
  ]

  const phase = phaseNames[phaseId] || phaseNames[0]
  const nextPhaseId = (phaseId + 1) % phaseNames.length
  const nextPhase = phaseNames[nextPhaseId]

  const interpretation = {
    phaseId,
    title: `${phase} 단계 해석`,
    description: `현재 ${phase} 단계에 있습니다. 이 단계는 사이클의 중요한 전환점입니다.`,
    recommendations: [
      '규칙적인 수면 패턴 유지',
      '적절한 운동과 휴식의 균형',
      '명상이나 호흡 운동 실천',
    ],
    warnings: ['과도한 스트레스 피하기', '충분한 수분 섭취'],
    nextPhase,
    nextPhaseId,
  }

  res.json(interpretation)
})

// ===== 기록 API =====
app.get('/api/records', (req, res) => {
  const { userId, limit } = req.query
  let userRecords = data.records.filter((r) => r.userId === userId)

  // 기록이 없으면 샘플 데이터 생성
  if (userRecords.length === 0) {
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      userRecords.push({
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
    data.records = [...data.records, ...userRecords]
    saveData()
  }

  userRecords.sort((a, b) => b.timestamp - a.timestamp)
  const result = limit ? userRecords.slice(0, parseInt(limit, 10)) : userRecords
  res.json(result)
})

app.post('/api/records', (req, res) => {
  const newRecord = {
    id: `record-${Date.now()}`,
    ...req.body,
    timestamp: Date.now(),
  }
  data.records.push(newRecord)
  data.records.sort((a, b) => b.timestamp - a.timestamp)
  saveData()
  res.status(201).json(newRecord)
})

app.put('/api/records/:id', (req, res) => {
  const { id } = req.params
  const recordIndex = data.records.findIndex((r) => r.id === id)
  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Record not found' })
  }
  data.records[recordIndex] = { ...data.records[recordIndex], ...req.body }
  saveData()
  res.json(data.records[recordIndex])
})

app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params
  const recordIndex = data.records.findIndex((r) => r.id === id)
  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Record not found' })
  }
  data.records.splice(recordIndex, 1)
  saveData()
  res.status(204).send()
})

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Eighternity 목업 서버가 http://localhost:${PORT} 에서 실행 중입니다.`)
  console.log(`📊 API 엔드포인트: http://localhost:${PORT}/api`)
})
