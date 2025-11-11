import { Link } from 'react-router-dom'

export default function Welcome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark text-gray-100 p-6">
      <h1 className="text-4xl font-bold text-primary mb-4">GymLog</h1>
      <p className="text-gray-400 mb-10 text-center max-w-md">
        Track your workouts, measure your progress, and stay consistent.  
        Your personal fitness companion — built for progress.
      </p>

      <div className="flex space-x-4">
        <Link
          to="/login"
          className="px-6 py-2 rounded bg-primary text-black font-semibold hover:bg-green-400 transition"
        >
          Login
        </Link>
        <Link
          to="/signup"
          className="px-6 py-2 rounded border border-primary text-primary hover:bg-primary hover:text-black transition"
        >
          Sign Up
        </Link>
      </div>
    </div>
  )
}
