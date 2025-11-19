import Navbar from '../components/Navbar'
import { FloatingActionButton } from '../components/FloatingActionButton'
import { BottomNavigation } from '../components/BottomNavigation'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark text-gray-100">
      {/* Navbar fixa no topo */}
      <Navbar />

      {/* Espaçamento compensando a altura da navbar e menu inferior */}
      <main
        className="
          pt-16       /* compensa a altura da navbar (aprox 64px) */
          px-4 sm:px-6 lg:px-8
          pb-20       /* evita conteúdo colar no menu inferior no mobile */
          md:pb-8     /* no desktop não precisa tanto espaço */
          max-w-5xl   /* limita largura centralizada */
          mx-auto
          w-full
        "
      >
        {children}
      </main>

      {/* Menu inferior estilo Instagram (mobile) */}
      <BottomNavigation />

      {/* FAB - Botão de ação rápida fixo (desktop) */}
      <div className="hidden md:block">
        <FloatingActionButton />
      </div>
    </div>
  )
}
