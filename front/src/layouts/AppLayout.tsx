import Navbar from '../components/Navbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  console.log('✅ AppLayout rendered') // add this log too

  return (
    <div className="min-h-screen bg-dark text-gray-100">
      <Navbar />
      <main className="p-6">{children}</main>
    </div>
  )
}
