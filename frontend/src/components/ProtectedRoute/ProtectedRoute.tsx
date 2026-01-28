import { Navigate, useLocation } from 'react-router-dom'
import { TokenManager } from '@/services/api'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const REDIRECT_KEY = 'auth_redirect_path'

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation()
  const accessToken = TokenManager.getAccessToken()

  if (!accessToken) {
    // 현재 경로를 저장하여 로그인 후 리다이렉트
    // 단, 로그인 페이지 자체는 저장하지 않음
    if (location.pathname !== '/login' && location.pathname !== '/auth/callback') {
      sessionStorage.setItem(REDIRECT_KEY, location.pathname + location.search)
    }
    return <Navigate to="/login" replace />
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
