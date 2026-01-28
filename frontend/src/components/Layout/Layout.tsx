import React from 'react'
import Header from '../Header/Header'
import Sidebar from '../Sidebar/Sidebar'
import Footer from '../Footer/Footer'
import { useUIStore } from '@/store/useUIStore'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isSidebarOpen } = useUIStore()
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <Sidebar />
      {/* 태블릿과 데스크탑에서 사이드바가 열려있을 때만 margin 적용 (xl 이상에서만) */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'xl:ml-64' : ''} pt-16 flex-1`}>
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout
