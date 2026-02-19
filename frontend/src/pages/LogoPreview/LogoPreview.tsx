import React from 'react'
import { Link } from 'react-router-dom'
import LogoIcon from '@/components/LogoIcon/LogoIcon'
import type { LogoVariant } from '@/components/LogoIcon/LogoIcon'

const logos: { id: LogoVariant; title: string; desc: string }[] = [
  { id: 'a', title: 'A. 8등분 원', desc: '8단계 사이클을 직관적으로 표현' },
  { id: 'b', title: 'B. 무한대(∞) + 8', desc: 'Eternity + Eight, 영원한 8리듬' },
  { id: 'd', title: 'D. 8개 점이 있는 원', desc: '8단계 + 순환, 미니멀하고 모던' },
]

const LogoPreview: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-primary dark:text-primary-light mb-2">로고 후보 (A, B, D)</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        아래 세 가지 안을 비교해 보시고, 헤더/사이드바에 적용할 로고를 선택할 수 있습니다.
      </p>
      <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-3">
        {logos.map((logo) => (
          <div
            key={logo.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 flex flex-col items-center text-center shadow-sm"
          >
            <div className="w-20 h-20 flex items-center justify-center mb-4 text-primary dark:text-primary-light">
              <LogoIcon variant={logo.id} className="w-16 h-16" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{logo.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{logo.desc}</p>
            <div className="mt-4 flex items-center gap-2 text-primary dark:text-primary-light">
              <LogoIcon variant={logo.id} className="h-8 w-8" />
              <span className="text-lg font-bold">Eighternity</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link to="/" className="text-primary dark:text-primary-light hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}

export default LogoPreview
