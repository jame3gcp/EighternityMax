import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'

import RoleGate from './components/RoleGate/RoleGate'
import AdminLayout from './components/AdminLayout/AdminLayout'
import { useActivityTracker } from './hooks/useActivityTracker'

// 코드 스플리팅: 페이지별 lazy loading
const Login = lazy(() => import('./pages/Login/Login'))
const AuthCallback = lazy(() => import('./pages/AuthCallback/AuthCallback'))
const Onboarding = lazy(() => import('./pages/Onboarding/Onboarding'))
const Home = lazy(() => import('./pages/Home/Home'))
const MyCycle = lazy(() => import('./pages/MyCycle/MyCycle'))
const Interpretation = lazy(() => import('./pages/Interpretation/Interpretation'))
const DailyGuide = lazy(() => import('./pages/DailyGuide/DailyGuide'))
const EnergyForecast = lazy(() => import('./pages/EnergyForecast/EnergyForecast'))
const LifeProfile = lazy(() => import('./pages/LifeProfile/LifeProfile'))
const LifeDirections = lazy(() => import('./pages/LifeDirections/LifeDirections'))
const Record = lazy(() => import('./pages/Record/Record'))
const LuckyHub = lazy(() => import('./pages/LuckyHub/LuckyHub'))
const LuckyHubRankings = lazy(() => import('./pages/LuckyHubRankings/LuckyHubRankings'))
const EnergyMap = lazy(() => import('./pages/EnergyMap/EnergyMap'))
const Guide = lazy(() => import('./pages/Guide/Guide'))
const MyPage = lazy(() => import('./pages/MyPage/MyPage'))
const DevProfileTest = lazy(() => import('./pages/DevProfileTest/DevProfileTest'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService/TermsOfService'))

const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'))
const AdminUserList = lazy(() => import('./pages/Admin/UserList'))
const AdminAICostMonitor = lazy(() => import('./pages/Admin/AICostMonitor'))
const AdminContentCMS = lazy(() => import('./pages/Admin/ContentCMS'))
const AdminBilling = lazy(() => import('./pages/Admin/Billing'))
const AdminAuditLog = lazy(() => import('./pages/Admin/AuditLog'))
const AdminBehaviorAnalytics = lazy(() => import('./pages/Admin/BehaviorAnalytics'))
const AdminRankings = lazy(() => import('./pages/Admin/AdminRankings'))

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
  const isAdminPage = location.pathname.startsWith('/admin')

  useActivityTracker()
  
  const routes = (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleGate allow={['admin']} redirectTo="/">
                <AdminDashboard />
              </RoleGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <RoleGate allow={['admin']} redirectTo="/">
                <AdminUserList />
              </RoleGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ai-costs"
          element={
            <ProtectedRoute>
              <RoleGate allow={['admin']} redirectTo="/">
                <AdminAICostMonitor />
              </RoleGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/content"
          element={
            <ProtectedRoute>
              <RoleGate allow={['admin']} redirectTo="/">
                <AdminContentCMS />
              </RoleGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/billing"
          element={
            <ProtectedRoute>
              <RoleGate allow={['admin']} redirectTo="/">
                <AdminBilling />
              </RoleGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/behavior"
          element={
            <ProtectedRoute>
              <RoleGate allow={['admin']} redirectTo="/">
                <AdminBehaviorAnalytics />
              </RoleGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute>
              <RoleGate allow={['admin']} redirectTo="/">
                <AdminAuditLog />
              </RoleGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rankings"
          element={
            <ProtectedRoute>
              <RoleGate allow={['admin']} redirectTo="/">
                <AdminRankings />
              </RoleGate>
            </ProtectedRoute>
          }
        />

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
          path="/interpretation"
          element={
            <ProtectedRoute>
              <Interpretation />
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
          path="/lucky-hub/rankings"
          element={
            <ProtectedRoute>
              <LuckyHubRankings />
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

  if (isAdminPage) {
    return <AdminLayout>{routes}</AdminLayout>
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
