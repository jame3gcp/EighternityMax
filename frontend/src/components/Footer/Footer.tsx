import React from 'react'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © 2026 EighternityMax. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link
              to="/privacy-policy"
              className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              개인정보 처리방침
            </Link>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <Link
              to="/terms-of-service"
              className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              서비스 이용약관
            </Link>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <a
              href="mailto:support@eighternitymax.com"
              className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              문의하기
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
