import Navbar from '../components/Navbar'
import { FloatingActionButton } from '../components/FloatingActionButton'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark text-gray-100">
      {/* Navbar fixa no topo */}
      <Navbar />

      {/* Espaçamento compensando a altura da navbar */}
      <main
        className="
          pt-16       /* compensa a altura da navbar (aprox 64px) */
          px-4 sm:px-6 lg:px-8
          pb-20       /* evita botão colar no final da tela no mobile */
          max-w-5xl   /* limita largura centralizada */
          mx-auto
          w-full
        "
      >
        {children}
      </main>

      {/* FAB - Botão de ação rápida fixo */}
      <FloatingActionButton />
    </div>
  )
}
