import React from 'react'
import Header from '../Header/Header'
import Sidebar from '../Sidebar/Sidebar'
import { useUIStore } from '@/store/useUIStore'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isSidebarOpen } = useUIStore()
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <Sidebar />
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''} pt-16`}>
        {children}
      </main>
    </div>
  )
}

export default Layout
