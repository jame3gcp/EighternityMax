import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'

// 코드 스플리팅: 페이지별 lazy loading
const Onboarding = lazy(() => import('./pages/Onboarding/Onboarding'))
const Home = lazy(() => import('./pages/Home/Home'))
const MyCycle = lazy(() => import('./pages/MyCycle/MyCycle'))
const DailyGuide = lazy(() => import('./pages/DailyGuide/DailyGuide'))
const EnergyForecast = lazy(() => import('./pages/EnergyForecast/EnergyForecast'))
const LifeProfile = lazy(() => import('./pages/LifeProfile/LifeProfile'))
const LifeDirections = lazy(() => import('./pages/LifeDirections/LifeDirections'))
const Record = lazy(() => import('./pages/Record/Record'))
const LuckyHub = lazy(() => import('./pages/LuckyHub/LuckyHub'))
const EnergyMap = lazy(() => import('./pages/EnergyMap/EnergyMap'))
const Guide = lazy(() => import('./pages/Guide/Guide'))
const MyPage = lazy(() => import('./pages/MyPage/MyPage'))

// 로딩 컴포넌트
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen" role="status" aria-label="로딩 중">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" aria-hidden="true"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
    </div>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/" element={<Home />} />
            <Route path="/my-cycle" element={<MyCycle />} />
            <Route path="/daily-guide" element={<DailyGuide />} />
            <Route path="/energy-forecast" element={<EnergyForecast />} />
            <Route path="/life-profile" element={<LifeProfile />} />
            <Route path="/life-directions" element={<LifeDirections />} />
            <Route path="/record" element={<Record />} />
            <Route path="/lucky-hub" element={<LuckyHub />} />
            <Route path="/energy-map" element={<EnergyMap />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/mypage" element={<MyPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  )
}

export default App
