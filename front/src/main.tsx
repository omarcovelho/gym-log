import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthContext'
import ProtectedRoute from '@/auth/ProtectedRoute'
import ProtectedRouteWithStats from '@/auth/ProtectedRouteWithStats'
import PublicRoute from '@/auth/PublicRoute'
import AppLayout from '@/layouts/AppLayout'
import Welcome from '@/pages/Welcome'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import UserStats from '@/pages/UserStats'
import ExercisesList from '@/pages/ExercisesList'
import ExerciseCreateEdit from '@/pages/ExerciseCreateEdit'
import WorkoutTemplateCreateEdit from '@/pages/WorkoutTemplateCreateEdit'
import WorkoutTemplatesList from '@/pages/WorkoutTemplatesList'
import { ToastProvider } from '@/components/ToastProvider'
import { checkScheduledNotification } from '@/utils/pwa'
import './i18n'
import './index.css'
import WorkoutLogsList from './pages/WorkoutLogsList'
import WorkoutSessionView from './pages/WorkoutSessionView'
import WorkoutSessionDetails from './pages/WorkoutSessionDetails'
import Progress from './pages/Progress'
import About from './pages/About'
import BodyMeasurementsList from './pages/BodyMeasurementsList'
import BodyMeasurementForm from './pages/BodyMeasurementForm'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createBrowserRouter([
    // Public routes (redirect to /app if already authenticated)
    { 
        path: '/', 
        element: (
            <PublicRoute>
                <Welcome />
            </PublicRoute>
        )
    },
    { 
        path: '/login', 
        element: (
            <PublicRoute>
                <Login />
            </PublicRoute>
        )
    },
    { 
        path: '/signup', 
        element: (
            <PublicRoute>
                <Signup />
            </PublicRoute>
        )
    },
    { 
        path: '/forgot-password', 
        element: (
            <PublicRoute>
                <ForgotPassword />
            </PublicRoute>
        )
    },
    { 
        path: '/reset-password', 
        element: (
            <PublicRoute>
                <ResetPassword />
            </PublicRoute>
        )
    },

    // Protected routes (under /app)
    {
        path: '/app/stats',
        element: (
            <ProtectedRoute>
                <AppLayout>
                    <UserStats />
                </AppLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: '/app',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <Home />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },
    {
        path: '/app/progress',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <Progress />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },

    /* ------------------- EXERCISES ------------------- */
    {
        path: '/app/exercises',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <ExercisesList />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },
    {
        path: '/app/exercises/new',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <ExerciseCreateEdit />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },
    {
        path: '/app/exercises/:id/edit',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <ExerciseCreateEdit />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },

    /* ------------------- TEMPLATES ------------------- */
    {
        path: '/app/templates',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <WorkoutTemplatesList />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },
    {
        path: '/app/templates/new',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <WorkoutTemplateCreateEdit />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },
    {
        path: '/app/templates/:id/edit',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <WorkoutTemplateCreateEdit />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },
    {
        path: '/app/workouts',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <WorkoutLogsList />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },
    {
        path: '/app/workouts/:id',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <WorkoutSessionView />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },
    {
        path: '/app/workouts/:id/view',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <WorkoutSessionDetails />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },
    {
        path: '/app/about',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <About />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },
    {
        path: '/app/measurements',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <BodyMeasurementsList />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },
    {
        path: '/app/measurements/new',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <BodyMeasurementForm />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },
    {
        path: '/app/measurements/:id/edit',
        element: (
            <ProtectedRouteWithStats>
                <AppLayout>
                    <BodyMeasurementForm />
                </AppLayout>
            </ProtectedRouteWithStats>
        ),
    },

])

function App() {
  // Check for scheduled notifications when app opens
  useEffect(() => {
    checkScheduledNotification()
  }, [])

  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
