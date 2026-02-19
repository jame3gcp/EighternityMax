import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/services/api'
import { useUserStore } from '@/store/useUserStore'
import { getRedirectPath } from '@/components/ProtectedRoute/ProtectedRoute'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const { setUser } = useUserStore()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[AuthCallback Page] 콜백 처리 시작')
        const response = await authApi.handleAuthCallback()
        
        if (response) {
          console.log('[AuthCallback Page] 응답 받음:', response)
          
          setUser({
            id: response.user.user_id,
            name: response.user.display_name ?? response.user.provider,
            email: response.user.email ?? '',
            createdAt: Date.now(),
            provider: response.user.provider,
          })

          // 저장된 리다이렉트 경로 확인
          const redirectPath = getRedirectPath()
          console.log('[AuthCallback Page] 리다이렉트 경로:', { redirectPath, nextStep: response.next_step, consent_required: response.consent_required })

          // 개인정보 동의 미완료 시 반드시 온보딩(동의 화면)으로 이동
          if (response.consent_required) {
            console.log('[AuthCallback Page] 개인정보 동의 필요 → 온보딩으로 이동')
            navigate('/onboarding', { replace: true })
            return
          }
          if (response.next_step === 'profile_required' || response.next_step === 'life_profile_required') {
            console.log('[AuthCallback Page] 온보딩으로 이동')
            navigate('/onboarding', { replace: true })
          } else if (redirectPath && redirectPath !== '/login') {
            // 원래 접근하려던 페이지로 리다이렉트 (로그인 페이지 제외)
            console.log('[AuthCallback Page] 저장된 경로로 이동:', redirectPath)
            navigate(redirectPath, { replace: true })
          } else {
            console.log('[AuthCallback Page] 홈으로 이동')
            navigate('/', { replace: true })
          }
        } else {
          console.warn('[AuthCallback Page] 응답이 없음, 로그인 페이지로 이동')
          navigate('/login', { replace: true })
        }
      } catch (error) {
        console.error('[AuthCallback Page] 에러:', error)
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
        alert(`로그인 처리 중 오류가 발생했습니다.\n\n${errorMessage}\n\n콘솔을 확인해주세요.`)
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate, setUser])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">로그인 처리 중...</p>
      </div>
    </div>
  )
}

export default AuthCallback
