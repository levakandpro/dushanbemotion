// src/app/router/index.jsx

import React, { useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from 'react-router-dom'
import { useAuth } from '../../lib/useAuth'
import Loader from '../../components/ui/Loader'

// Auth pages
import Login from '../../auth/Login'
import Register from '../../auth/Register'
import ForgotPassword from '../../auth/ForgotPassword'
import ResetPasswordPage from '../../auth/ResetPasswordPage'
import ConfirmedPage from '../../auth/ConfirmedPage'
import CallbackPage from '../../auth/CallbackPage'
import AuthorOnboardingPage from '../../auth/AuthorOnboardingPage'
import OnboardingSuccessPage from '../../auth/OnboardingSuccessPage'

// Account page
import AccountPage from '../../pages/AccountPage'

// Editor
import EditorV2Screen from '../../editorV2/EditorV2Screen'
import ViewProjectScreen from '../../editorV2/view/ViewProjectScreen'
// import BazarPage from '../../pages/BazarPage'
// import CollectionViewPage from '../../editorV2/screens/bazar/CollectionViewPage'
import ServiceViewPage from '../../pages/ServiceViewPage'
import OrderPage from '../../pages/OrderPage'
import { MyOrders } from '../../components/SafeDeal'

// Author Panel
import AuthorLayout from '../../author/AuthorLayout'
import AuthorHome from '../../author/pages/AuthorHome'
import AuthorWorks from '../../author/pages/AuthorWorks'
import AuthorServices from '../../author/pages/AuthorServices'
import AuthorCollabs from '../../author/pages/AuthorCollabs'
import CollabDetail from '../../author/pages/CollabDetail'
import AuthorCollections from '../../author/pages/AuthorCollections'
import AuthorOrders from '../../author/pages/AuthorOrders'
import AuthorBalance from '../../author/pages/AuthorBalance'

// Splash page
import IntroRouter from '../../editorV2/splash/IntroRouter'

// Public Profile
// import PublicProfile from '../../author/pages/public/PublicProfile'

// Pricing
import PricingScreen from '../../pricing/PricingScreen'
import PaymentScreen from '../../pricing/PaymentScreen'

// ADMIN
import AdminApp from '../../admin/AdminApp'

// список email с доступом в админку
const ADMIN_EMAILS = ['levakandproduction@gmail.com']

/**
 * Wrapper для ViewProjectScreen с получением shareId из URL
 */
function ViewProjectRoute() {
  const { shareId } = useParams()
  return <ViewProjectScreen shareId={shareId || ''} />
}

/**
 * Защищенный маршрут - требует авторизации
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loader />
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

/**
 * Публичный маршрут - редирект на dashboard, если авторизован (кроме главной страницы)
 */
function PublicRoute({ children, allowAuth = false }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loader />
  }

  // Если allowAuth=true, разрешаем авторизованным пользователям оставаться на странице
  if (user && !allowAuth) {
    return <Navigate to="/editor" replace />
  }

  return <>{children}</>
}

/**
 * Админ-маршрут - только для указанных email
 */
function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loader />
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  if (!ADMIN_EMAILS.includes(user.email)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Публичные маршруты авторизации */}
        <Route
          path="/auth/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/confirmed"
          element={
            <PublicRoute>
              <ConfirmedPage />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/callback"
          element={
            <PublicRoute allowAuth={true}>
              <CallbackPage />
            </PublicRoute>
          }
        />
        <Route
          path="/author/onboarding"
          element={
            <ProtectedRoute>
              <AuthorOnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth/onboarding-success"
          element={
            <PublicRoute allowAuth={true}>
              <OnboardingSuccessPage />
            </PublicRoute>
          }
        />


        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminApp />
            </AdminRoute>
          }
        />

        {/* Account - личный кабинет пользователя */}
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />

        {/* Редактор - публичный маршрут (без авторизации) */}
        <Route path="/editor" element={<EditorV2Screen />} />

        {/* Просмотр shared проекта - публичный */}
        <Route path="/view/:shareId" element={<ViewProjectRoute />} />

        {/* Public Profile */}
        {/* <Route path="/u/:username" element={<PublicProfile />} /> */}

        {/* Bazar - лента медиа */}
        {/* <Route path="/bazar" element={<BazarPage />} /> */}
        {/* <Route path="/bazar/collection/:collectionId" element={<CollectionViewPage />} /> */}
        {/* <Route path="/bazar/service/:id" element={<ServiceViewPage />} /> */}
        <Route path="/service/:id" element={<ServiceViewPage />} />
        <Route path="/order/:id" element={<OrderPage />} />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />

        {/* Author Panel - панель автора */}
        <Route
          path="/author"
          element={
            <ProtectedRoute>
              <AuthorLayout>
                <AuthorHome />
              </AuthorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/works"
          element={
            <ProtectedRoute>
              <AuthorLayout>
                <AuthorWorks />
              </AuthorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/services"
          element={
            <ProtectedRoute>
              <AuthorLayout>
                <AuthorServices />
              </AuthorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/collabs"
          element={
            <ProtectedRoute>
              <AuthorLayout>
                <AuthorCollabs />
              </AuthorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/collabs/:collabId"
          element={
            <ProtectedRoute>
              <AuthorLayout>
                <CollabDetail />
              </AuthorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/orders"
          element={
            <ProtectedRoute>
              <AuthorLayout>
                <AuthorOrders />
              </AuthorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/balance"
          element={
            <ProtectedRoute>
              <AuthorLayout>
                <AuthorBalance />
              </AuthorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/collections"
          element={
            <ProtectedRoute>
              <AuthorLayout>
                <AuthorCollections />
              </AuthorLayout>
            </ProtectedRoute>
          }
        />

        {/* Pricing - страница тарифов */}
        <Route
          path="/pricing"
          element={
            <PublicRoute allowAuth={true}>
              <PricingScreen />
            </PublicRoute>
          }
        />

        {/* Payment - страница оплаты */}
        <Route
          path="/payment"
          element={
            <PublicRoute allowAuth={true}>
              <PaymentScreen />
            </PublicRoute>
          }
        />

        {/* Splash page - главная страница с кнопкой "БА ПЕШ" */}
        <Route
          path="/"
          element={
            <PublicRoute allowAuth={true}>
              <IntroRouter />
            </PublicRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

