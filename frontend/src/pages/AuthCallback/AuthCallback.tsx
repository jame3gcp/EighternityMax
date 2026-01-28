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
        const response = await authApi.handleAuthCallback()
        
        if (response) {
          setUser({
            id: response.user.user_id,
            name: response.user.provider,
            email: '',
            createdAt: Date.now(),
            provider: response.user.provider,
          })

          // 저장된 리다이렉트 경로 확인
          const redirectPath = getRedirectPath()

          if (response.next_step === 'profile_required' || response.next_step === 'life_profile_required') {
            navigate('/onboarding', { replace: true })
          } else if (redirectPath) {
            // 원래 접근하려던 페이지로 리다이렉트
            navigate(redirectPath, { replace: true })
          } else {
            navigate('/', { replace: true })
          }
        } else {
          navigate('/login', { replace: true })
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        alert('로그인 처리 중 오류가 발생했습니다.')
        navigate('/login')
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
