import React, { useCallback, useEffect, useRef, useState } from 'react'
import { loadNaverMapScript } from '@/utils/naverMapLoader'
import type { Spot } from '@/types'

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const DEFAULT_ZOOM = 14

export interface NaverMapProps {
  /** 지도 중심 좌표 */
  center?: { lat: number; lng: number }
  /** 표시할 에너지 스팟 목록 */
  spots?: Spot[]
  /** 지도 높이 (기본 24rem = h-96) */
  height?: string | number
  className?: string
  /** 로딩 여부 (스팟 로딩 중일 때 스피너 등 외부 제어) */
  isLoading?: boolean
  /** 지도 클릭 이벤트 핸들러 */
  onMapClick?: (lat: number, lng: number) => void
}

/**
 * 네이버 지도 API를 사용해 중심 좌표와 스팟 마커를 표시하는 지도 컴포넌트.
 * VITE_NAVER_MAP_CLIENT_ID가 없으면 안내 문구만 표시합니다.
 */
const NaverMap: React.FC<NaverMapProps> = ({
  center = DEFAULT_CENTER,
  spots = [],
  height = '24rem',
  className = '',
  isLoading = false,
  onMapClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<naver.maps.Map | null>(null)
  const markersRef = useRef<naver.maps.Marker[]>([])
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null)

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [containerReady, setContainerReady] = useState(false)

  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined

  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    ;(containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    setContainerReady(Boolean(el))
  }, [])

  // 개발 환경에서만: Client ID 로드 여부 로그 (인증 실패 원인 확인용)
  useEffect(() => {
    if (import.meta.env.DEV) {
      const loaded = Boolean(clientId && clientId.trim().length > 0)
      const length = (clientId || '').trim().length
      console.log('[NaverMap] Client ID loaded:', loaded, '| length:', length, '| (NCP Web 서비스 URL에 http://localhost:5173 등록 필요)')
    }
  }, [clientId])

  // 스크립트 로드 및 지도 초기화 (컨테이너가 DOM에 붙은 뒤에만 실행)
  useEffect(() => {
    if (!clientId) {
      setStatus('error')
      setErrorMessage('지도 사용을 위해 네이버 지도 API Client ID를 설정해주세요.')
      return
    }
    if (!containerReady || !containerRef.current) {
      return
    }

    setStatus('loading')

    loadNaverMapScript(clientId)
      .then(() => {
        const container = containerRef.current
        const hasMaps = typeof window.naver?.maps !== 'undefined'

        if (!container || !hasMaps) {
          setStatus('error')
          setErrorMessage('지도를 초기화할 수 없습니다.')
          return
        }

        const { maps } = window.naver!
        const centerLatLng = new maps.LatLng(center.lat, center.lng)

        const map = new maps.Map(container, {
          center: centerLatLng,
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
        })

        mapRef.current = map
        infoWindowRef.current = new maps.InfoWindow({ maxWidth: 280 })

        if (onMapClick) {
          maps.Event.addListener(map, 'click', (e: any) => {
            onMapClick(e.coord.lat(), e.coord.lng())
          })
        }

        setStatus('ready')
      })
      .catch((err) => {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : '지도 로드에 실패했습니다.')
      })

    return () => {
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
      infoWindowRef.current?.close()
      infoWindowRef.current = null
      mapRef.current = null
    }
  }, [clientId, containerReady])

  // center 변경 시 지도 중심 이동
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current || !window.naver?.maps) return
    const latLng = new window.naver.maps.LatLng(center.lat, center.lng)
    mapRef.current.setCenter(latLng)
  }, [status, center.lat, center.lng])

  // spots 변경 시 마커 갱신
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current || !window.naver?.maps) return

    const map = mapRef.current
    const { maps } = window.naver

    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    spots.forEach((spot) => {
      const position = new maps.LatLng(spot.lat, spot.lng)
      const marker = new maps.Marker({
        position,
        map,
        title: spot.name,
      })

      maps.Event.addListener(marker, 'click', () => {
        infoWindowRef.current?.close()
        const content = [
          `<div style="padding:8px;min-width:180px;max-width:260px;">`,
          `<strong style="font-size:14px;">${escapeHtml(spot.name)}</strong>`,
          spot.score ? `<span style="color:#6366f1;font-size:12px;"> (${spot.score}점)</span>` : '',
          `<p style="margin:6px 0 0;font-size:12px;color:#666;">${escapeHtml(spot.address || '')}</p>`,
          spot.description
            ? `<p style="margin:4px 0 0;font-size:11px;color:#888;">${escapeHtml(spot.description)}</p>`
            : '',
          `</div>`,
        ].join('')
        infoWindowRef.current?.setContent(content)
        infoWindowRef.current?.open(map, marker)
      })

      markersRef.current.push(marker)
    })
  }, [status, spots])

  if (!clientId) {
    return (
      <div
        className={`rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 ${className}`}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="text-center px-4">
          <p className="font-medium">지도 사용을 위해 Client ID를 설정해주세요.</p>
          <p className="text-sm mt-2">
            .env에 VITE_NAVER_MAP_CLIENT_ID를 추가하고, 네이버 클라우드 플랫폼에서 지도 API를 등록하세요.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        className={`rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 ${className}`}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="text-center px-4">
          <p className="font-medium">지도를 불러올 수 없습니다.</p>
          <p className="text-sm mt-2">{errorMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`} style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      <div ref={setContainerRef} className="w-full h-full" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      )}
      {status === 'ready' && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 pointer-events-none">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      )}
    </div>
  )
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export default NaverMap
