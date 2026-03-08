import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import jwt from 'jsonwebtoken'
import { PHASE_NAMES, PHASE_INTERPRETATIONS } from './src/data/interpretationPhases.js'
import { generateFromProfile } from './src/services/lifeProfileGenerator.js'
import { solarToSaju, lunarToSaju } from './src/services/saju.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'
const devSecret = 'dev-secret-key-change-in-production'
const JWT_SECRET = (() => {
  const raw = process.env.JWT_SECRET
  if (isProduction && (!raw || String(raw).trim() === '' || raw === devSecret)) {
    console.error('FATAL: JWT_SECRET must be set to a secure, non-default value in production.')
    process.exit(1)
  }
  return raw && String(raw).trim() !== '' ? raw : devSecret
})()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(cookieParser())

// 데이터 파일 경로
const dataPath = join(__dirname, 'mock-data', 'data.json')

// 초기 데이터 로드
let data = {
  users: [],
  profiles: [],
  lifeProfiles: [],
  jobs: [],
  records: [],
  cycles: [],
  tokens: [], // refresh tokens
}

// 데이터 파일이 있으면 로드
try {
  const fileData = readFileSync(dataPath, 'utf-8')
  data = JSON.parse(fileData)
  // 기존 파일에 없는 필드 초기화 (마이그레이션)
  if (!data.tokens) data.tokens = []
  if (!data.profiles) data.profiles = []
  if (!data.lifeProfiles) data.lifeProfiles = []
  if (!data.jobs) data.jobs = []
  if (!data.users) data.users = []
  if (!data.records) data.records = []
  if (!data.cycles) data.cycles = []
} catch (error) {
  // 파일이 없으면 초기 데이터로 시작
  writeFileSync(dataPath, JSON.stringify(data, null, 2))
}

// 데이터 저장 함수
const saveData = () => {
  writeFileSync(dataPath, JSON.stringify(data, null, 2))
}

// JWT 토큰 생성 함수
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

// 인증 미들웨어
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// 유틸리티: 사용자 ID 생성
const generateUserId = () => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// 유틸리티: Job ID 생성
const generateJobId = () => `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// ===== 루트 경로 및 헬스 체크 =====

// 루트 경로
app.get('/', (req, res) => {
  res.json({
    service: 'Eighternity API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      v1: '/v1',
      api: '/api',
    },
    message: 'API 서버가 정상적으로 실행 중입니다.',
  })
})

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})

// ===== OAuth 인증 API (v1) =====

// OAuth 콜백 교환 (목업 버전)
app.post('/v1/auth/oauth/:provider/callback', (req, res) => {
  const { provider } = req.params
  const { code, redirect_uri, state } = req.body

  // 목업: code를 받아서 사용자 생성/조회
  // 실제 구현에서는 provider API를 호출하여 사용자 정보를 가져와야 함
  // 개발 테스트용: 'dev' provider는 항상 동일한 테스트 사용자 사용
  const providerUserId = provider === 'dev' 
    ? 'dev-test-user' 
    : `provider-${provider}-${code || Date.now()}`
  
  // 기존 사용자 확인
  let user = data.users.find(u => 
    u.provider === provider && u.providerUserId === providerUserId
  )

  const isNewUser = !user

  if (isNewUser) {
    // 새 사용자 생성 (개인정보 동의는 null → 로그인 후 동의 화면 필수)
    user = {
      id: generateUserId(),
      provider,
      providerUserId,
      email: `${providerUserId}@example.com`,
      displayName: `${provider} 사용자`,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      privacyConsentAt: null,
    }
    data.users.push(user)
    saveData()
  } else {
    user.lastLoginAt = Date.now()
    if (user.privacyConsentAt === undefined) user.privacyConsentAt = null
    saveData()
  }

  // 토큰 생성
  const { accessToken, refreshToken } = generateTokens(user.id)
  
  // refresh token 저장
  data.tokens.push({
    userId: user.id,
    token: refreshToken,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  })
  saveData()

  // 프로필 확인
  const profile = data.profiles.find(p => p.userId === user.id)
  const lifeProfile = data.lifeProfiles.find(p => p.userId === user.id)

  let nextStep = 'ready'
  if (!profile) {
    nextStep = 'profile_required'
  } else if (!lifeProfile) {
    nextStep = 'life_profile_required'
  }

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })

  res.json({
    user: {
      user_id: user.id,
      is_new_user: isNewUser,
      provider,
    },
    tokens: {
      access_token: accessToken,
      refresh_token: refreshToken,
    },
    next_step: nextStep,
    consent_required: !user.privacyConsentAt,
  })
})

// 토큰 갱신
app.post('/v1/auth/token/refresh', (req, res) => {
  const refreshToken = req.cookies.refresh_token || req.body.refresh_token

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' })
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET)
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' })
    }

    // 토큰이 저장소에 있는지 확인
    const tokenRecord = data.tokens.find(t => t.token === refreshToken && t.userId === decoded.userId)
    if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
      return res.status(401).json({ error: 'Token expired' })
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId)

    // 기존 토큰 제거하고 새 토큰 저장
    data.tokens = data.tokens.filter(t => t.token !== refreshToken)
    data.tokens.push({
      userId: decoded.userId,
      token: newRefreshToken,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
    saveData()

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
    })
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
})

// 로그아웃
app.post('/v1/auth/logout', authenticate, (req, res) => {
  const refreshToken = req.cookies.refresh_token || req.body.refresh_token

  if (refreshToken) {
    data.tokens = data.tokens.filter(t => t.token !== refreshToken)
    saveData()
  }

  res.clearCookie('refresh_token')
  res.json({ message: 'Logged out successfully' })
})

// ===== 프로필/AI 생성 API (v1) =====

// 프로필 조회 (saju 등 계산 결과 포함)
app.get('/v1/users/me/profile', authenticate, (req, res) => {
  const profile = data.profiles.find(p => p.userId === req.userId)
  
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' })
  }

  res.json({
    profileId: profile.profileId,
    userId: profile.userId,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    gender: profile.gender,
    region: profile.region,
    saju: profile.saju ?? null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  })
})

// 기본 정보 저장 (온보딩) — calendar_type·is_intercalation 반영, saju 계산·저장
app.post('/v1/users/me/profile', authenticate, (req, res) => {
  const { birth_date, birth_time, gender, region, calendar_type = 'solar', is_intercalation } = req.body

  if (!birth_date || !gender) {
    return res.status(400).json({ error: 'birth_date and gender are required' })
  }

  let saju = null
  let canonicalBirthDate = birth_date

  if (calendar_type === 'lunar') {
    saju = lunarToSaju(birth_date, !!is_intercalation, birth_time || undefined, gender)
    if (saju?.solar) {
      const { year, month, day } = saju.solar
      canonicalBirthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  } else {
    saju = solarToSaju(birth_date, birth_time || undefined, gender)
  }
  if (saju) {
    saju.calendarType = calendar_type
    saju.isIntercalation = !!is_intercalation
  }

  let profile = data.profiles.find(p => p.userId === req.userId)

  if (profile) {
    profile = {
      ...profile,
      birthDate: canonicalBirthDate,
      birthTime: birth_time || null,
      gender,
      region: region || null,
      saju: saju || undefined,
      updatedAt: Date.now(),
    }
    const index = data.profiles.findIndex(p => p.userId === req.userId)
    data.profiles[index] = profile
  } else {
    profile = {
      profileId: `profile-${Date.now()}`,
      userId: req.userId,
      birthDate: canonicalBirthDate,
      birthTime: birth_time || null,
      gender,
      region: region || null,
      saju: saju || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    data.profiles.push(profile)
  }

  saveData()

  res.json({
    profile_id: profile.profileId,
    status: 'saved',
    next_step: 'generate_life_profile',
  })
})

// AI 분석 생성 (비동기)
app.post('/v1/users/me/life-profile/generate', authenticate, (req, res) => {
  const { profile_id, options = {} } = req.body

  // 프로필 확인
  const profile = data.profiles.find(p => p.profileId === profile_id && p.userId === req.userId)
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' })
  }

  // Job 생성
  const jobId = generateJobId()
  const job = {
    jobId,
    userId: req.userId,
    profileId: profile_id,
    status: 'queued',
    progress: 0,
    options,
    createdAt: Date.now(),
  }
  data.jobs.push(job)
  saveData()

  // 비동기 처리 시뮬레이션 (실제로는 큐 시스템 사용)
  setTimeout(() => {
    const lifeProfile = generateFromProfile({ ...profile, userId: req.userId, profileId: profile_id })

    // 기존 Life Profile 업데이트 또는 생성
    const existingIndex = data.lifeProfiles.findIndex(p => p.userId === req.userId)
    if (existingIndex >= 0) {
      data.lifeProfiles[existingIndex] = lifeProfile
    } else {
      data.lifeProfiles.push(lifeProfile)
    }

    // Job 완료 처리
    const jobIndex = data.jobs.findIndex(j => j.jobId === jobId)
    if (jobIndex >= 0) {
      data.jobs[jobIndex] = {
        ...data.jobs[jobIndex],
        status: 'done',
        progress: 100,
        resultRef: `life-profile-${req.userId}`,
        completedAt: Date.now(),
      }
    }

    saveData()
  }, 3000) // 3초 후 완료

  res.json({
    job_id: jobId,
    status: 'queued',
  })
})

// AI 작업 상태 조회
app.get('/v1/jobs/:jobId', authenticate, (req, res) => {
  const { jobId } = req.params
  const job = data.jobs.find(j => j.jobId === jobId && j.userId === req.userId)

  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }

  // 진행률 업데이트 (시뮬레이션)
  if (job.status === 'queued' || job.status === 'running') {
    const elapsed = Date.now() - job.createdAt
    if (elapsed < 3000) {
      job.progress = Math.min(90, Math.floor((elapsed / 3000) * 90))
      job.status = 'running'
    }
  }

  res.json({
    status: job.status,
    progress: job.progress,
    result_ref: job.resultRef || null,
  })
})

// Life Profile 조회
app.get('/v1/users/me/life-profile', authenticate, (req, res) => {
  const lifeProfile = data.lifeProfiles.find(p => p.userId === req.userId)

  if (!lifeProfile) {
    return res.status(404).json({ error: 'Life profile not found' })
  }

  res.json({
    life_profile: lifeProfile,
    updated_at: lifeProfile.updatedAt,
    version: lifeProfile.version,
  })
})

// 오늘 가이드
app.get('/v1/users/me/daily-guide', authenticate, (req, res) => {
  const { date } = req.query
  const targetDate = date || new Date().toISOString().split('T')[0]

  const lifeProfile = data.lifeProfiles.find(p => p.userId === req.userId)
  if (!lifeProfile) {
    return res.status(404).json({ error: 'Life profile not found. Please generate it first.' })
  }

  // 오늘의 phase 계산 (간단한 로직)
  const today = new Date(targetDate)
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
  const phaseTag = `phase-${dayOfYear % 8}`

  const dailyGuide = {
    date: targetDate,
    phase_tag: phaseTag,
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

  res.json(dailyGuide)
})

// ===== 사용자 API (v1: getMe / consent — 테스트 계정도 구글과 동일하게 동의 필수) =====
app.get('/v1/users/me', authenticate, (req, res) => {
  const user = data.users.find(u => u.id === req.userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json({
    ...user,
    privacy_consent_given: !!user.privacyConsentAt,
  })
})

app.post('/v1/users/me/consent', authenticate, (req, res) => {
  const user = data.users.find(u => u.id === req.userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  user.privacyConsentAt = Date.now()
  saveData()
  res.json({ success: true, privacy_consent_given: true })
})

// ===== 사용자 API (기존 유지) =====
app.get('/api/users/me', authenticate, (req, res) => {
  const user = data.users.find(u => u.id === req.userId)
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
  const phaseId = Math.max(0, Math.min(7, parseInt(req.params.phaseId, 10) || 0))
  const phase = PHASE_NAMES[phaseId]
  const nextPhaseId = (phaseId + 1) % PHASE_NAMES.length
  const nextPhaseName = PHASE_NAMES[nextPhaseId]
  const content = PHASE_INTERPRETATIONS[phaseId] || PHASE_INTERPRETATIONS[0]

  const interpretation = {
    phaseId,
    title: `${phase} 단계 해석`,
    description: content.description,
    energyTraitSummary: content.energyTraitSummary,
    periodSummary: content.periodSummary,
    recommendations: content.recommendations,
    warnings: content.warnings,
    nextPhase: nextPhaseId,
    nextPhaseName,
    nextPhaseDescription: content.nextPhaseDescription,
    nextPhaseTransitionHint: content.nextPhaseTransitionHint,
  }
  if (content.recommendationItems) interpretation.recommendationItems = content.recommendationItems
  if (content.warningItems) interpretation.warningItems = content.warningItems

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

// ===== 404 핸들러 =====
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `요청하신 경로를 찾을 수 없습니다: ${req.method} ${req.path}`,
    availableEndpoints: {
      v1: '/v1',
      api: '/api',
      health: '/health',
    },
  })
})

// ===== 에러 핸들러 =====
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Eighternity 목업 서버가 http://0.0.0.0:${PORT} 에서 실행 중입니다.`)
  console.log(`📊 API 엔드포인트: http://localhost:${PORT}/api`)
  console.log(`🔍 V1 API 엔드포인트: http://localhost:${PORT}/v1`)
  console.log(`❤️  헬스 체크: http://localhost:${PORT}/health`)
  console.log(`\n🌐 외부 접근: http://172.30.29.44:${PORT}`)
})
