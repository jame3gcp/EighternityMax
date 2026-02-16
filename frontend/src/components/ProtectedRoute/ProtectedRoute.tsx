import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { TokenManager, userApi } from '@/services/api'
import { useUserStore } from '@/store/useUserStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const REDIRECT_KEY = 'auth_redirect_path'

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation()
  const accessToken = TokenManager.getAccessToken()
  const { privacyConsentGiven, setUser, setPrivacyConsentGiven } = useUserStore()
  const [consentCheckDone, setConsentCheckDone] = useState(false)

  // 토큰은 있으나 동의 여부를 아직 모를 때 /users/me로 조회
  useEffect(() => {
    if (!accessToken || privacyConsentGiven !== undefined) {
      setConsentCheckDone(true)
      return
    }
    let cancelled = false
    userApi.getCurrentUser()
      .then((user) => {
        if (cancelled) return
        setUser(user)
        setPrivacyConsentGiven(user.privacyConsentGiven ?? false)
        setConsentCheckDone(true)
      })
      .catch(() => {
        if (cancelled) return
        setConsentCheckDone(true)
      })
    return () => { cancelled = true }
  }, [accessToken, privacyConsentGiven, setUser, setPrivacyConsentGiven])

  if (import.meta.env.DEV) {
    console.log('[ProtectedRoute]', {
      path: location.pathname,
      hasToken: !!accessToken,
      privacyConsentGiven,
      consentCheckDone,
    })
  }

  if (!accessToken) {
    if (location.pathname !== '/login' && location.pathname !== '/auth/callback') {
      sessionStorage.setItem(REDIRECT_KEY, location.pathname + location.search)
    }
    return <Navigate to="/login" replace />
  }

  // 동의 여부 조회 중에는 짧은 로딩 (다른 보호된 페이지로 가지 않도록)
  if (!consentCheckDone || privacyConsentGiven === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // 개인정보 동의 미완료 시 온보딩(동의 화면)으로만 접근 허용
  if (privacyConsentGiven === false) {
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />
    }
    return <>{children}</>
  }

  return <>{children}</>
}

// 저장된 리다이렉트 경로를 가져오고 삭제하는 유틸리티 함수
export const getRedirectPath = (): string | null => {
  const path = sessionStorage.getItem(REDIRECT_KEY)
  if (path) {
    sessionStorage.removeItem(REDIRECT_KEY)
    return path
  }
  return null
}

export default ProtectedRoute
