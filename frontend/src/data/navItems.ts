/**
 * 공통 네비게이션 항목 (Sidebar, Header 단일 소스)
 * 라벨·경로·순서·그룹 변경 시 이 파일만 수정하면 됨.
 * 기준: docs/MENU_STRUCTURE_SPEC.md
 */

export type NavGroupId = 'identity' | 'daily' | 'strategic' | 'utility'

export interface NavItem {
  path: string
  label: string
  icon?: string
  group?: NavGroupId
}

export const userNavItems: NavItem[] = [
  { path: '/', label: 'Home', icon: '🏠', group: 'identity' },
  { path: '/life-profile', label: 'Life Profile (나의 설계도)', icon: '👤', group: 'identity' },
  { path: '/daily-guide', label: '데일리 가이드', icon: '📅', group: 'daily' },
  { path: '/energy-forecast', label: '에너지 예보', icon: '📊', group: 'daily' },
  { path: '/life-directions', label: '인생 방향', icon: '🧭', group: 'strategic' },
  { path: '/my-cycle', label: '나의 사이클', icon: '🌀', group: 'strategic' },
  { path: '/interpretation', label: '사이클 해석', icon: '📖', group: 'strategic' },
  { path: '/record', label: '기록 & 리포트', icon: '📝', group: 'utility' },
  { path: '/lucky-hub', label: '행운 센터', icon: '🍀', group: 'utility' },
  { path: '/energy-map', label: '에너지 스팟', icon: '📍', group: 'utility' },
  { path: '/guide', label: '콘텐츠 / 가이드', icon: '📚', group: 'utility' },
  { path: '/mypage', label: '마이페이지', icon: '⚙️', group: 'utility' },
]

export const adminNavItems: NavItem[] = [
  { path: '/admin', label: '대시보드', icon: '📈' },
  { path: '/admin/users', label: '사용자 관리', icon: '👥' },
  { path: '/admin/content', label: '콘텐츠 관리', icon: '📚' },
  { path: '/admin/billing', label: '결제/프로모션', icon: '💳' },
  { path: '/admin/rankings', label: '게임 랭킹', icon: '🏆' },
  { path: '/admin/behavior', label: '사용자 행동', icon: '🖱️' },
  { path: '/admin/audit', label: '감사 로그', icon: '📜' },
  { path: '/admin/ai-costs', label: 'AI 비용', icon: '💰' },
  { path: '/', label: '서비스로 이동', icon: '🔙' },
]
