import React from 'react'
import Header from '../Header/Header'
import Sidebar from '../Sidebar/Sidebar'
import Footer from '../Footer/Footer'
import { useUIStore } from '@/store/useUIStore'

interface AdminLayoutProps {
  children: React.ReactNode
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { isSidebarOpen } = useUIStore()
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Header isAdminView={true} />
      <Sidebar isAdminView={true} />
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'xl:ml-64' : ''} pt-16 flex-1`}>
        <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 fixed top-0 left-0 z-[60] uppercase tracking-wider shadow-sm">
          Admin Mode
        </div>
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default AdminLayout
