import React from 'react'
import Header from '../Header/Header'
import Sidebar from '../Sidebar/Sidebar'
import Footer from '../Footer/Footer'
interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <Sidebar />
      {/* PC(xl): 데스크톱 사이드바가 항상 표시되므로 main을 항상 오른쪽으로 밀어서 가리지 않음 */}
      <main className="transition-all duration-300 xl:ml-64 pt-16 flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout
