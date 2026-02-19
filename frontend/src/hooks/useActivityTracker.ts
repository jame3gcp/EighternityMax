import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { analyticsApi } from '@/services/api'

export const useActivityTracker = () => {
  const location = useLocation()
  const startTimeRef = useRef<number>(Date.now())
  const prevPathRef = useRef<string>(location.pathname)

  useEffect(() => {
    const handleRouteChange = () => {
      const endTime = Date.now()
      const durationMs = endTime - startTimeRef.current
      const path = prevPathRef.current

      if (durationMs > 1000) {
        analyticsApi.logActivity({
          type: 'page_view',
          path,
          durationMs,
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }
        }).catch(() => {})
      }

      startTimeRef.current = Date.now()
      prevPathRef.current = location.pathname
    }

    handleRouteChange()

    const handleUnload = () => {
      const endTime = Date.now()
      const durationMs = endTime - startTimeRef.current
      const path = location.pathname

      const data = JSON.stringify({
        type: 'page_view_exit',
        path,
        durationMs,
        metadata: { exit: true }
      })
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/v1/analytics/log', data)
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [location.pathname])
}
