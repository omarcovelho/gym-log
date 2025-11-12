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
import ExercisesList from '@/pages/ExercisesList'
import ExerciseCreateEdit from '@/pages/ExerciseCreateEdit'
import WorkoutTemplateCreateEdit from '@/pages/WorkoutTemplateCreateEdit'
import WorkoutTemplatesList from '@/pages/WorkoutTemplatesList'
import { ToastProvider } from '@/components/ToastProvider'
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

    /* ------------------- EXERCISES ------------------- */
    {
        path: '/app/exercises',
        element: (
            <ProtectedRoute>
                <AppLayout>
                    <ExercisesList />
                </AppLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: '/app/exercises/new',
        element: (
            <ProtectedRoute>
                <AppLayout>
                    <ExerciseCreateEdit />
                </AppLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: '/app/exercises/:id/edit',
        element: (
            <ProtectedRoute>
                <AppLayout>
                    <ExerciseCreateEdit />
                </AppLayout>
            </ProtectedRoute>
        ),
    },

    /* ------------------- TEMPLATES ------------------- */
    {
        path: '/app/templates',
        element: (
            <ProtectedRoute>
                <AppLayout>
                    <WorkoutTemplatesList />
                </AppLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: '/app/templates/new',
        element: (
            <ProtectedRoute>
                <AppLayout>
                    <WorkoutTemplateCreateEdit />
                </AppLayout>
            </ProtectedRoute>
        ),
    },
    {
        path: '/app/templates/:id/edit',
        element: (
            <ProtectedRoute>
                <AppLayout>
                    <WorkoutTemplateCreateEdit />
                </AppLayout>
            </ProtectedRoute>
        ),
    },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={qc}>
            <AuthProvider>
                <ToastProvider>
                    <RouterProvider router={router} />
                </ToastProvider>
            </AuthProvider>
        </QueryClientProvider>
    </React.StrictMode>,
)
