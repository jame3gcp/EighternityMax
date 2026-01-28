import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useUIStore } from '@/store/useUIStore'
import { useUserStore } from '@/store/useUserStore'
import { authApi } from '@/services/api'
import Button from '../Button/Button'

const Header: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { toggleSidebar, toggleDarkMode, isDarkMode } = useUIStore()
  const { clearUser } = useUserStore()

  const handleLogout = async () => {
    try {
      await authApi.logout()
      clearUser()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      clearUser()
      navigate('/login')
    }
  }
  
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/my-cycle', label: '나의 사이클' },
    { path: '/daily-guide', label: '데일리 가이드' },
    { path: '/energy-forecast', label: '에너지 예보' },
    { path: '/life-profile', label: 'Life Profile' },
    { path: '/life-directions', label: '인생 방향' },
    { path: '/record', label: '기록 & 리포트' },
    { path: '/lucky-hub', label: '행운 센터' },
    { path: '/energy-map', label: '에너지 스팟' },
    { path: '/guide', label: '콘텐츠 / 가이드' },
    { path: '/mypage', label: '마이페이지' },
  ]
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* 모바일 & 태블릿: 메뉴 토글 버튼 (xl 미만) */}
            <button
              onClick={toggleSidebar}
              className="xl:hidden touch-target p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="메뉴 열기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/" className="ml-2 xl:ml-0">
              <h1 className="text-xl font-bold text-primary dark:text-primary-light">Eighternity</h1>
            </Link>
          </div>
          
          {/* 데스크탑: 상단 네비게이션 (xl 이상) */}
          <nav className="hidden xl:flex space-x-1" role="navigation" aria-label="메인 네비게이션">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`touch-target px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-current={location.pathname === item.path ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="touch-target p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="touch-target p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
              aria-label="로그아웃"
              title="로그아웃"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
