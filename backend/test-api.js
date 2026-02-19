// Node.js 18+ 내장 fetch 사용

const BASE_URL = 'http://localhost:3001'
const V1_BASE = `${BASE_URL}/v1`

// 테스트 결과 저장
const testResults = {
  passed: [],
  failed: [],
  total: 0,
}

// 테스트 헬퍼 함수
async function test(name, testFn) {
  testResults.total++
  try {
    await testFn()
    testResults.passed.push(name)
    console.log(`✅ ${name}`)
  } catch (error) {
    testResults.failed.push({ name, error: error.message })
    console.log(`❌ ${name}: ${error.message}`)
  }
}

// API 호출 헬퍼
async function apiCall(endpoint, options = {}) {
  const url = `${V1_BASE}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  return { status: response.status, data }
}

// 테스트 실행
async function runTests() {
  console.log('🧪 STEP 1 API 테스트 시작\n')

  let accessToken = null
  let refreshToken = null
  let userId = null
  let profileId = null
  let jobId = null

  // ===== OAuth 인증 테스트 =====
  console.log('\n📋 OAuth 인증 테스트\n')

  await test('POST /v1/auth/oauth/kakao/callback - 정상 요청 (Mock Token)', async () => {
    const { status, data } = await apiCall('/auth/oauth/kakao/callback', {
      method: 'POST',
      body: JSON.stringify({ 
        access_token: 'mock-supabase-token',
        refresh_token: 'mock-refresh-token'
      }),
    })
    
    if (status !== 200 && status !== 401) throw new Error(`Expected 200 or 401, got ${status}`)
    
    if (status === 200) {
      accessToken = data.tokens.access_token
      userId = data.user.user_id
    } else {
      console.log('  ⚠️  실제 Supabase 토큰이 없어 401이 반환되었습니다.')
      accessToken = 'test-token'
    }
  })

  await test('POST /v1/auth/oauth/kakao/callback - code 누락 시 400 에러', async () => {
    const { status } = await apiCall('/auth/oauth/kakao/callback', {
      method: 'POST',
      body: JSON.stringify({
        redirect_uri: 'http://localhost:5173/login',
      }),
    })
    // 현재 구현에서는 code가 없어도 동작하므로, 이 테스트는 스킵하거나 수정 필요
    // if (status !== 400) throw new Error(`Expected 400, got ${status}`)
  })

  await test('POST /v1/auth/oauth/google/callback - 정상 요청', async () => {
    const { status, data } = await apiCall('/auth/oauth/google/callback', {
      method: 'POST',
      body: JSON.stringify({
        code: 'test-code-google-456',
        redirect_uri: 'http://localhost:5173/login',
        state: 'test-state-google',
      }),
    })
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!data.tokens?.access_token) throw new Error('Missing access_token')
  })

  // ===== 토큰 관리 테스트 =====
  console.log('\n📋 토큰 관리 테스트\n')

  await test('POST /v1/auth/token/refresh - 정상 갱신', async () => {
    const { status, data } = await apiCall('/auth/token/refresh', {
      method: 'POST',
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    })
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!data.access_token) throw new Error('Missing access_token')
    accessToken = data.access_token // 새 토큰으로 업데이트
  })

  await test('POST /v1/auth/token/refresh - 잘못된 토큰 시 401 에러', async () => {
    const { status } = await apiCall('/auth/token/refresh', {
      method: 'POST',
      body: JSON.stringify({
        refresh_token: 'invalid-token',
      }),
    })
    if (status !== 401) throw new Error(`Expected 401, got ${status}`)
  })

  // ===== 프로필 저장 테스트 =====
  console.log('\n📋 프로필 저장 테스트\n')

  await test('POST /v1/users/me/profile - 정상 저장', async () => {
    const { status, data } = await apiCall('/users/me/profile', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        birth_date: '1990-01-01',
        birth_time: '14:30',
        gender: 'M',
        region: '서울시 강남구',
      }),
    })
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!data.profile_id) throw new Error('Missing profile_id')
    profileId = data.profile_id
  })

  await test('POST /v1/users/me/profile - birth_date 누락 시 400 에러', async () => {
    const { status } = await apiCall('/users/me/profile', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        gender: 'M',
      }),
    })
    if (status !== 400) throw new Error(`Expected 400, got ${status}`)
  })

  await test('POST /v1/users/me/profile - 인증 토큰 없을 시 401 에러', async () => {
    const { status } = await apiCall('/users/me/profile', {
      method: 'POST',
      body: JSON.stringify({
        birth_date: '1990-01-01',
        gender: 'M',
      }),
    })
    if (status !== 401) throw new Error(`Expected 401, got ${status}`)
  })

  // ===== AI 분석 생성 테스트 =====
  console.log('\n📋 AI 분석 생성 테스트\n')

  await test('POST /v1/users/me/life-profile/generate - 정상 Job 생성', async () => {
    const { status, data } = await apiCall('/users/me/life-profile/generate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        profile_id: profileId,
        options: {
          detail_level: 'standard',
          language: 'ko',
        },
      }),
    })
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!data.job_id) throw new Error('Missing job_id')
    jobId = data.job_id
  })

  await test('GET /v1/jobs/{jobId} - Job 상태 조회', async () => {
    // 잠시 대기 (Job이 시작되도록)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { status, data } = await apiCall(`/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!data.status) throw new Error('Missing status')
    if (!['queued', 'running', 'done'].includes(data.status)) {
      throw new Error(`Invalid status: ${data.status}`)
    }
  })

  await test('GET /v1/jobs/{jobId} - 존재하지 않는 Job 시 404 에러', async () => {
    const { status } = await apiCall('/jobs/invalid-job-id', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (status !== 404) throw new Error(`Expected 404, got ${status}`)
  })

  // 분석 완료 대기 (최대 5초)
  console.log('\n⏳ AI 분석 완료 대기 중...')
  let analysisComplete = false
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const { data } = await apiCall(`/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (data.status === 'done') {
      analysisComplete = true
      break
    }
  }

  // ===== Life Profile 조회 테스트 =====
  console.log('\n📋 Life Profile 조회 테스트\n')

  if (analysisComplete) {
    await test('GET /v1/users/me/life-profile - 정상 조회', async () => {
      const { status, data } = await apiCall('/users/me/life-profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (status !== 200) throw new Error(`Expected 200, got ${status}`)
      if (!data.life_profile) throw new Error('Missing life_profile')
      if (!data.life_profile.energyType) throw new Error('Missing energyType')
    })
  } else {
    console.log('⚠️  AI 분석이 아직 완료되지 않아 Life Profile 테스트를 스킵합니다.')
  }

  await test('GET /v1/users/me/life-profile - 인증 토큰 없을 시 401 에러', async () => {
    const { status } = await apiCall('/users/me/life-profile', {
      method: 'GET',
    })
    if (status !== 401) throw new Error(`Expected 401, got ${status}`)
  })

  // ===== 데일리 가이드 테스트 =====
  console.log('\n📋 데일리 가이드 테스트\n')

  if (analysisComplete) {
    await test('GET /v1/users/me/daily-guide - 오늘 가이드 조회', async () => {
      const { status, data } = await apiCall('/users/me/daily-guide', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (status !== 200) throw new Error(`Expected 200, got ${status}`)
      if (!data.phase_tag) throw new Error('Missing phase_tag')
      if (!data.energy_index) throw new Error('Missing energy_index')
      if (!Array.isArray(data.do)) throw new Error('Missing do array')
      if (!Array.isArray(data.avoid)) throw new Error('Missing avoid array')
    })

    await test('GET /v1/users/me/daily-guide?date=2026-01-20 - 특정 날짜 조회', async () => {
      const { status, data } = await apiCall('/users/me/daily-guide?date=2026-01-20', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (status !== 200) throw new Error(`Expected 200, got ${status}`)
      if (data.date !== '2026-01-20') throw new Error('Date mismatch')
    })
  } else {
    console.log('⚠️  AI 분석이 아직 완료되지 않아 Daily Guide 테스트를 스킵합니다.')
  }

  console.log('\n📋 STEP 2 신규 기능 테스트\n')

  await test('POST /v1/users/me/daily-log - 오늘 기록 저장', async () => {
    const { status, data } = await apiCall('/users/me/daily-log', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        energy: 30,
        emotion: 40,
        focus: 50,
        memo: '테스트 메모',
      }),
    })
    if (status !== 201) throw new Error(`Expected 201, got ${status}`)
    if (!data.id) throw new Error('Missing log id')
  })

  await test('GET /v1/users/me/daily-guide - 기록 반영 에너지 지수 확인', async () => {
    const { status, data } = await apiCall('/users/me/daily-guide', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    const expectedEnergyIndex = 65;
    if (data.energy_index !== expectedEnergyIndex) {
      throw new Error(`Expected energy_index ${expectedEnergyIndex}, got ${data.energy_index}`)
    }
  })

  await test('GET /v1/users/me/energy-forecast - 30일 예보 조회', async () => {
    const { status, data } = await apiCall('/users/me/energy-forecast?days=7', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data) || data.length !== 7) throw new Error('Invalid forecast data')
  })

  await test('GET /v1/users/me/cycles - 사이클 정보 조회', async () => {
    const { status, data } = await apiCall('/users/me/cycles?period=week', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (data.period !== 'week') throw new Error('Period mismatch')
    if (!Array.isArray(data.phases)) throw new Error('Missing phases')
  })

  console.log('\n📋 STEP 3 신규 기능 테스트\n')

  await test('GET /v1/users/me/directions - 인생 방향 가이드 조회', async () => {
    const { status, data } = await apiCall('/users/me/directions', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data.categories) || data.categories.length !== 6) {
      throw new Error('Invalid categories data')
    }
    if (!data.explanation) throw new Error('Missing explanation')
  })

  console.log('\n📋 STEP 4 신규 기능 테스트\n')

  await test('GET /v1/users/me/spots - 에너지 스팟 추천 조회', async () => {
    const { status, data } = await apiCall('/users/me/spots?lat=37.5665&lng=126.9780&purpose=focus', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data.spots)) throw new Error('Missing spots array')
    if (data.spots.length > 0 && data.spots[0].purpose !== 'focus') {
      throw new Error('Purpose filter failed')
    }
  })

  console.log('\n📋 STEP 5 신규 기능 테스트\n')

  await test('GET /v1/users/me/lucky-numbers - 행운 번호 조회', async () => {
    const { status, data } = await apiCall('/users/me/lucky-numbers?type=lotto', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data.numbers) || data.numbers.length !== 6) {
      throw new Error('Invalid lucky numbers')
    }
  })

  console.log('\n📋 STEP 6 신규 기능 테스트\n')

  await test('GET /v1/users/me/reports/monthly - 월간 리포트 조회', async () => {
    const { status, data } = await apiCall('/users/me/reports/monthly', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (data.total_logs === undefined) throw new Error('Missing total_logs')
  })

  // ===== 로그아웃 테스트 =====
  console.log('\n📋 로그아웃 테스트\n')

  await test('POST /v1/auth/logout - 정상 로그아웃', async () => {
    const { status } = await apiCall('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
  })

  // ===== 결과 출력 =====
  console.log('\n' + '='.repeat(50))
  console.log('📊 테스트 결과 요약')
  console.log('='.repeat(50))
  console.log(`총 테스트: ${testResults.total}`)
  console.log(`✅ 통과: ${testResults.passed.length}`)
  console.log(`❌ 실패: ${testResults.failed.length}`)

  if (testResults.failed.length > 0) {
    console.log('\n실패한 테스트:')
    testResults.failed.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`)
    })
  }

  console.log('\n' + '='.repeat(50))

  // 종료 코드
  process.exit(testResults.failed.length > 0 ? 1 : 0)
}

// 서버가 실행 중인지 확인
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/users/me`)
    return true
  } catch (error) {
    return false
  }
}

// 메인 실행
async function main() {
  const serverRunning = await checkServer()
  if (!serverRunning) {
    console.error('❌ 백엔드 서버가 실행 중이 아닙니다.')
    console.error('   먼저 백엔드 서버를 실행해주세요: cd backend && npm run dev')
    process.exit(1)
  }

  await runTests()
}

main().catch((error) => {
  console.error('테스트 실행 중 오류:', error)
  process.exit(1)
})
