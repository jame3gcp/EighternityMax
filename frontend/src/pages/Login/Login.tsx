import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Card from '@/components/Card/Card'
import { authApi, TokenManager } from '@/services/api'
import { useUserStore } from '@/store/useUserStore'
import { getRedirectPath } from '@/components/ProtectedRoute/ProtectedRoute'

const isDev = import.meta.env.DEV

// 구글 로고 컴포넌트 (당분간 구글 기반 로그인만 사용, 카카오는 추후 적용 예정)
const GoogleLogo = () => (
  <svg
    className="mr-2 w-5 h-5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setUser, setPrivacyConsentGiven } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const [devLoginError, setDevLoginError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    try {
      await authApi.signInWithOAuth('google')
    } catch (error: unknown) {
      console.error('Login error:', error)
      const err = error as { msg?: string; error_code?: string }
      const msg = err?.msg ?? (error as Error)?.message ?? ''
      if (msg.includes('provider is not enabled') || err?.error_code === 'validation_failed') {
        alert('구글 로그인이 아직 설정되지 않았습니다.\n\nSupabase 대시보드 → Authentication → Providers에서 Google을 활성화해 주세요.\n자세한 방법은 docs/SUPABASE_OAUTH_SETUP.md를 참고하세요.')
      } else {
        alert('로그인 초기화에 실패했습니다. Supabase 환경 변수를 확인해 주세요.')
      }
    }
  }

  // 개발 테스트용 로그인
  const handleDevLogin = async () => {
    if (isLoading) return // 중복 클릭 방지
    setDevLoginError(null)
    setIsLoading(true)
    try {
      // 백엔드 OAuth 콜백을 통해 테스트 사용자 생성 및 토큰 발급
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      
      console.log('테스트 로그인 시도:', `${API_BASE_URL}/v1/auth/oauth/dev/callback`)
      
      const response = await fetch(`${API_BASE_URL}/v1/auth/oauth/dev/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: `dev-test-${Date.now()}`,
          redirect_uri: window.location.origin + '/auth/callback',
        }),
      })

      console.log('응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('서버 에러 응답:', errorText)
        throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`)
      }

      let data
      try {
        data = await response.json()
        console.log('로그인 성공:', data)
      } catch (parseError) {
        console.error('JSON 파싱 에러:', parseError)
        const text = await response.text()
        console.error('응답 본문:', text)
        throw new Error('서버 응답을 파싱할 수 없습니다.')
      }

      // 응답 데이터 검증
      if (!data) {
        throw new Error('서버 응답이 비어있습니다.')
      }

      // 토큰 저장
      if (!data.tokens || !data.tokens.access_token) {
        console.error('응답 데이터:', data)
        throw new Error('토큰이 응답에 포함되지 않았습니다.')
      }
      
      // refresh_token이 없을 수 있으므로 안전하게 처리
      const refreshToken = data.tokens.refresh_token || ''
      TokenManager.setTokens(data.tokens.access_token, refreshToken)

      // 사용자 정보 저장
      if (!data.user || !data.user.user_id) {
        console.error('응답 데이터:', data)
        throw new Error('사용자 정보가 응답에 포함되지 않았습니다.')
      }

      setUser({
        id: data.user.user_id,
        name: '테스트 사용자',
        email: 'test@example.com',
        createdAt: Date.now(),
        provider: data.user.provider || 'dev',
        displayName: '테스트 사용자',
      })

      // 저장된 리다이렉트 경로 확인
      const redirectPath = getRedirectPath()

      // 테스트 계정도 구글과 동일: 개인정보 동의 미완료 시 반드시 온보딩(동의 화면)으로 이동
      if (data.consent_required) {
        console.log('개인정보 동의 필요 → 온보딩으로 이동')
        setPrivacyConsentGiven(false)
        navigate('/onboarding', { replace: true })
        return
      }
      setPrivacyConsentGiven(true)

      // next_step에 따라 라우팅
      if (data.next_step === 'profile_required' || data.next_step === 'life_profile_required') {
        console.log('온보딩으로 이동')
        navigate('/onboarding')
      } else if (redirectPath) {
        console.log('원래 페이지로 리다이렉트:', redirectPath)
        navigate(redirectPath, { replace: true })
      } else {
        console.log('홈으로 이동')
        navigate('/', { replace: true })
      }
    } catch (error: any) {
      console.error('Dev login error:', error)
      const message = error?.message || (error instanceof Error ? error.message : '알 수 없는 오류')
      const friendlyMessage =
        error instanceof TypeError && message.includes('fetch')
          ? '백엔드 서버에 연결할 수 없습니다. 터미널에서 "cd backend && npm run dev" 실행 후 다시 시도해주세요.'
          : `테스트 로그인 실패: ${message}`
      setDevLoginError(friendlyMessage)
      alert(friendlyMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Eighternity
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              당신의 에너지 사이클을 발견하세요
            </p>
          </div>

          <div className="space-y-4">
            {/* 구글 로그인만 사용 (카카오는 추후 적용 예정) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              className="w-full touch-target font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500 px-4 py-3 text-base"
            >
              <div className="flex items-center justify-center">
                <GoogleLogo />
                <span>구글로 시작하기</span>
              </div>
            </motion.button>
          </div>

          <p className="text-xs text-center text-gray-500 mt-6">
            로그인 시 개인정보 처리방침 및 이용약관에 동의하게 됩니다.
          </p>

          {/* 개발 환경 테스트 로그인 */}
          {isDev && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-center text-gray-400 mb-3">
                개발 테스트 모드
              </p>
              <button
                type="button"
                onClick={handleDevLogin}
                disabled={isLoading}
                className="touch-target font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary px-4 py-2 text-base w-full border-dashed"
                aria-label="테스트 계정으로 로그인"
              >
                {isLoading ? '⏳ 로그인 중...' : '🔧 테스트 계정으로 로그인'}
              </button>
              {isLoading && (
                <p className="text-xs text-center text-gray-400 mt-2">
                  백엔드 서버에 연결 중...
                </p>
              )}
              {devLoginError && (
                <p className="text-xs text-center text-red-600 dark:text-red-400 mt-2" role="alert">
                  {devLoginError}
                </p>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

export default Login
