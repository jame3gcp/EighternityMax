/**
 * 접근성 유틸리티 함수
 */

/**
 * 키보드 이벤트가 Enter 또는 Space 키인지 확인
 */
export function isActivationKey(event: React.KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar'
}

/**
 * 키보드 이벤트가 Escape 키인지 확인
 */
export function isEscapeKey(event: React.KeyboardEvent): boolean {
  return event.key === 'Escape' || event.key === 'Esc'
}

/**
 * 키보드 이벤트가 화살표 키인지 확인
 */
export function isArrowKey(event: React.KeyboardEvent): boolean {
  return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
}

/**
 * 포커스를 트랩하는 함수 (모달 등에서 사용)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }

  element.addEventListener('keydown', handleTab)
  firstElement?.focus()

  return () => {
    element.removeEventListener('keydown', handleTab)
  }
}
