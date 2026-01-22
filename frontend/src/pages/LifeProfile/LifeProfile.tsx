import React from 'react'
import Card from '@/components/Card/Card'
import StatusCard from '@/components/StatusCard/StatusCard'

const LifeProfile: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Life Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">
          AI가 분석한 당신의 에너지 프로필입니다.
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">기본 분석</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <div className="text-3xl mb-2">⚡</div>
            <div className="font-semibold">Energy Type</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">활동형 리듬</div>
          </div>
          <div className="text-center p-4 bg-energy-yellow/10 rounded-lg">
            <div className="text-3xl mb-2">🔄</div>
            <div className="font-semibold">Activity Rhythm</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">오전 집중형</div>
          </div>
          <div className="text-center p-4 bg-energy-orange/10 rounded-lg">
            <div className="text-3xl mb-2">💪</div>
            <div className="font-semibold">Stress Response</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">적극적 대응</div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">강점 영역</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">집중 잘 되는 시간대</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span>오전 9시 - 12시</span>
                <span className="text-energy-green font-semibold">최고 집중</span>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                이 시간대에 중요한 업무나 창의적 작업을 계획하세요.
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">인간관계 성향</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span>협력적 리더십</span>
                <span className="text-energy-yellow font-semibold">강점</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                팀 프로젝트나 협업 환경에서 능력을 발휘합니다.
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">회복 패턴</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span>오후 2시 - 4시</span>
                <span className="text-energy-orange font-semibold">회복 시간</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                이 시간대에 가벼운 휴식이나 스트레칭을 권장합니다.
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-4">서비스 연동 정보</h2>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p>✓ 사이클 패턴 기준값 생성 완료</p>
          <p>✓ 예보 알고리즘 파라미터 설정 완료</p>
          <p>✓ 방향 가이드 추천 로직 기준 설정 완료</p>
        </div>
      </Card>
    </div>
  )
}

export default LifeProfile
