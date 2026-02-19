import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { TokenManager, userApi } from '@/services/api'
import { useUserStore } from '@/store/useUserStore'

interface RoleGateProps {
  children: React.ReactNode
  allow?: string[]
  redirectTo?: string
}

const REDIRECT_KEY = 'auth_redirect_path'

const RoleGate: React.FC<RoleGateProps> = ({
  children,
  allow = ['admin'],
  redirectTo = '/',
}) => {
  const location = useLocation()
  const accessToken = TokenManager.getAccessToken()
  const { role, user, setUser, setRole } = useUserStore()
  const [roleCheckDone, setRoleCheckDone] = useState(false)

  const currentRole = role ?? user?.role
  const normalizedAllowedRoles = useMemo(() => allow.map((value) => value.toLowerCase()), [allow])

  useEffect(() => {
    if (!accessToken || currentRole) {
      setRoleCheckDone(true)
      return
    }

    let cancelled = false
    userApi
      .getCurrentUser()
      .then((currentUser) => {
        if (cancelled) return
        setUser(currentUser)
        setRole(currentUser.role)
        setRoleCheckDone(true)
      })
      .catch(() => {
        if (cancelled) return
        setRoleCheckDone(true)
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, currentRole, setRole, setUser])

  if (!accessToken) {
    if (location.pathname !== '/login' && location.pathname !== '/auth/callback') {
      sessionStorage.setItem(REDIRECT_KEY, location.pathname + location.search)
    }
    return <Navigate to="/login" replace />
  }

  if (!roleCheckDone) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const normalizedRole = currentRole?.toLowerCase()
  if (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export default RoleGate
