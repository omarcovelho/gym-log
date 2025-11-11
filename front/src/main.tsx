import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthContext'
import ProtectedRoute from '@/auth/ProtectedRoute'
import AppLayout from '@/layouts/AppLayout'
import Welcome from '@/pages/Welcome'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ExercisesCreate from '@/pages/ExercisesCreate'
import './index.css'

const qc = new QueryClient()

const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <Welcome /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },

  // Protected routes (under /app)
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Home />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/app/exercises/new',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <ExercisesCreate />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
