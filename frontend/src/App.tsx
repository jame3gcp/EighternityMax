import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'

// 코드 스플리팅: 페이지별 lazy loading
const Login = lazy(() => import('./pages/Login/Login'))
const AuthCallback = lazy(() => import('./pages/AuthCallback/AuthCallback'))
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
const DevProfileTest = lazy(() => import('./pages/DevProfileTest/DevProfileTest'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService/TermsOfService'))

// 로딩 컴포넌트
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen" role="status" aria-label="로딩 중">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" aria-hidden="true"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
    </div>
  </div>
)

function AppRoutes() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/auth/callback'
  
  const routes = (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-cycle"
          element={
            <ProtectedRoute>
              <MyCycle />
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily-guide"
          element={
            <ProtectedRoute>
              <DailyGuide />
            </ProtectedRoute>
          }
        />
        <Route
          path="/energy-forecast"
          element={
            <ProtectedRoute>
              <EnergyForecast />
            </ProtectedRoute>
          }
        />
        <Route
          path="/life-profile"
          element={
            <ProtectedRoute>
              <LifeProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/life-directions"
          element={
            <ProtectedRoute>
              <LifeDirections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/record"
          element={
            <ProtectedRoute>
              <Record />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lucky-hub"
          element={
            <ProtectedRoute>
              <LuckyHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/energy-map"
          element={
            <ProtectedRoute>
              <EnergyMap />
            </ProtectedRoute>
          }
        />
        <Route path="/guide" element={<Guide />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev/profile-test"
          element={
            <ProtectedRoute>
              <DevProfileTest />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  )

  if (isAuthPage) {
    return routes
  }

  return <Layout>{routes}</Layout>
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
