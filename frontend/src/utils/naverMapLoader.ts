/**
 * 네이버 지도 API v3 스크립트 동적 로드
 * - 한 번 로드된 스크립트는 재요청하지 않음
 * - Client ID는 VITE_NAVER_MAP_CLIENT_ID 환경 변수 사용
 */

const SCRIPT_ID = 'naver-maps-script'
const SCRIPT_BASE = 'https://oapi.map.naver.com/openapi/v3/maps.js'
const PARAM_CANDIDATES = ['ncpKeyId', 'ncpClientId', 'govClientId', 'finClientId', 'clientId'] as const

type ClientIdParam = (typeof PARAM_CANDIDATES)[number]

type DynamicWindow = Record<string, unknown>

let loadPromise: Promise<void> | null = null
let resolvedClientIdParam: ClientIdParam | null = null

/**
 * 네이버 지도 스크립트를 로드하고, 로드 완료 시 resolve하는 Promise를 반환합니다.
 * Client ID가 없으면 즉시 reject합니다.
 */
export function loadNaverMapScript(clientId: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window is not defined'))
  }

  if (!clientId || clientId.trim() === '') {
    return Promise.reject(new Error('Naver Map Client ID is required (VITE_NAVER_MAP_CLIENT_ID)'))
  }

  if (typeof (window as any).naver !== 'undefined' && (window as any).naver.maps) {
    return Promise.resolve()
  }

  const existing = document.getElementById(SCRIPT_ID)
  if (existing) {
    return loadPromise || Promise.resolve()
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      const cleanId = clientId.trim()
      await injectNaverScriptWithFallback(cleanId)
    })().catch((error) => {
      loadPromise = null
      throw error
    })
  }

  return loadPromise
}

async function injectNaverScriptWithFallback(clientId: string): Promise<void> {
  const orderedParams = resolvedClientIdParam
    ? [resolvedClientIdParam, ...PARAM_CANDIDATES.filter((param) => param !== resolvedClientIdParam)]
    : [...PARAM_CANDIDATES]

  const reasons: string[] = []

  for (const param of orderedParams) {
    try {
      await injectNaverScript(clientId, param)
      resolvedClientIdParam = param
      return
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      reasons.push(`${param}: ${message}`)
    }
  }

  throw new Error(`Naver Map authentication failed for all client ID modes. ${reasons.join(' | ')}`)
}

function injectNaverScript(clientId: string, param: ClientIdParam): Promise<void> {
  return new Promise((resolve, reject) => {
    const callbackName = `__naver_maps_init_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const script = document.createElement('script')
    const dynamicWindow = window as unknown as DynamicWindow
    const previousAuthFailure = dynamicWindow.navermap_authFailure
    let settled = false

    const cleanup = () => {
      deleteWindowCallback(callbackName)
      dynamicWindow.navermap_authFailure = previousAuthFailure
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    setWindowCallback(callbackName, () => {
      if (settled) return
      settled = true
      cleanup()
      resolve()
    })

    dynamicWindow.navermap_authFailure = (...args: unknown[]) => {
      if (typeof previousAuthFailure === 'function') {
        ;(previousAuthFailure as (...innerArgs: unknown[]) => void)(...args)
      }

      if (settled) return
      settled = true
      cleanup()
      reject(new Error('Authentication Failed'))
    }

    script.id = SCRIPT_ID
    script.type = 'text/javascript'
    script.async = true
    script.src = `${SCRIPT_BASE}?${param}=${encodeURIComponent(clientId)}&callback=${callbackName}`
    script.onerror = () => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error('Failed to load Naver Map script'))
    }

    document.head.appendChild(script)
  })
}

function setWindowCallback(name: string, callback: (...args: unknown[]) => void): void {
  ;(window as unknown as DynamicWindow)[name] = callback
}

function deleteWindowCallback(name: string): void {
  delete (window as unknown as DynamicWindow)[name]
}
