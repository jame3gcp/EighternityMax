import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUIStore } from '@/store/useUIStore'
import { useUserStore } from '@/store/useUserStore'
import { motion, AnimatePresence } from 'framer-motion'
import { userNavItems, adminNavItems, type NavItem, type NavGroupId } from '@/data/navItems'
import LogoIcon from '@/components/LogoIcon/LogoIcon'

const NAV_GROUP_ORDER: NavGroupId[] = ['identity', 'daily', 'strategic', 'utility']
const NAV_GROUP_LABELS: Record<NavGroupId, string> = {
  identity: '나의 정체성',
  daily: '일상 가이드',
  strategic: '중장기 전략',
  utility: '도구 및 기록',
}

interface SidebarProps {
  isAdminView?: boolean
}

function groupUserNavItems(): { groupId: NavGroupId; label: string; items: NavItem[] }[] {
  return NAV_GROUP_ORDER.map((groupId) => ({
    groupId,
    label: NAV_GROUP_LABELS[groupId],
    items: userNavItems.filter((i) => i.group === groupId),
  })).filter((g) => g.items.length > 0)
}

function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem
  isActive: boolean
  onClick?: () => void
}) {
  const baseClass =
    'touch-target flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors'
  const activeClass = isActive
    ? 'bg-primary text-white'
    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
  return (
    <Link to={item.path} onClick={onClick} className={`${baseClass} ${activeClass}`}>
      <span className="text-xl">{item.icon ?? '•'}</span>
      <span>{item.label}</span>
    </Link>
  )
}

const Sidebar: React.FC<SidebarProps> = ({ isAdminView = false }) => {
  const location = useLocation()
  const { isSidebarOpen, closeSidebar } = useUIStore()
  const { role } = useUserStore()

  const isAdmin = role?.toLowerCase() === 'admin'
  const navItems = isAdminView ? adminNavItems : userNavItems
  const groupedUserNav = useMemo(() => groupUserNavItems(), [])
  const showGrouped = !isAdminView && groupedUserNav.length > 0

  const renderNavContent = (options: { onItemClick?: () => void }) => {
    if (showGrouped) {
      return groupedUserNav.map(({ groupId, label, items }) => (
        <div key={groupId} role="group" aria-label={label} className="mt-4 first:mt-0">
          <span
            className="block px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700"
            aria-hidden
          >
            {label}
          </span>
          <ul className="mt-2 space-y-2">
            {items.map((item) => (
              <li key={item.path}>
                <NavLink
                  item={item}
                  isActive={location.pathname === item.path}
                  onClick={options.onItemClick}
                />
              </li>
            ))}
          </ul>
        </div>
      ))
    }
    return (
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              item={item}
              isActive={location.pathname === item.path}
              onClick={options.onItemClick}
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <>
      {/* 모바일 & 태블릿 오버레이 사이드바 */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl z-50 xl:hidden"
            >
              <div className="flex flex-col h-full">
                <div className={`flex items-center justify-between p-4 border-b ${isAdminView ? 'border-red-200 dark:border-red-900/30' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-center gap-2">
                    <LogoIcon variant="b" className="h-7 w-7 text-primary dark:text-primary-light" />
                    <h2 className="text-lg font-bold text-primary dark:text-primary-light">Eighternity</h2>
                    {isAdminView && (
                      <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Admin</span>
                    )}
                  </div>
                  <button
                    onClick={closeSidebar}
                    className="touch-target p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="메뉴 닫기"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-4">
                  {renderNavContent({ onItemClick: closeSidebar })}
                  {isAdmin && !isAdminView && (
                    <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                      <Link
                        to="/admin"
                        onClick={closeSidebar}
                        className="touch-target flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <span className="text-xl">⚙️</span>
                        <span>관리자 모드</span>
                      </Link>
                    </div>
                  )}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 데스크탑 사이드바 (xl 이상에서만 항상 표시) */}
      <aside className={`hidden xl:block fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-md border-r ${isAdminView ? 'border-red-200 dark:border-red-900/30' : 'border-gray-200 dark:border-gray-700'} z-30`}>
        <nav className="p-4">
          {renderNavContent({})}
          {isAdmin && !isAdminView && (
            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
              <Link
                to="/admin"
                className="touch-target flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <span className="text-xl">⚙️</span>
                <span>관리자 모드</span>
              </Link>
            </div>
          )}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
