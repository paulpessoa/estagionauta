import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './hooks/useAuth'
import { Header } from './components/layout/Header'
import { Footer } from './components/Footer'
import HomePage from './pages/Index'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import ListagemAgencias from './pages/admin/ListagemAgencias'
import ModeracaoAgencias from './pages/admin/ModeracaoAgencias'
import CadastroAgencia from './pages/CadastroAgencia'
import AgenciasPage from './pages/Agencias'
import MapaAgencias from './pages/MapaAgencias'
import { Toaster } from './components/ui/sonner'
import Analisecurriculo from './pages/Analisecurriculo'
import Sucesso from './pages/Sucesso'
import ResultadoCurriculo from './pages/ResultadoCurriculo'
import CalculadoraRecesso from './pages/CalculadoraRecesso'
import Admin from './pages/Admin'
import EsqueciSenha from './pages/EsqueciSenha'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient()

// Componente que define a estrutura de layout e as rotas
function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-14"> {/* Ajuste no padding para o header fixo */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/agencias" element={<ModeracaoAgencias />} />
          <Route path="/admin/listagem-agencias" element={<ListagemAgencias />} />
          <Route path="/admin/moderacao-agencias" element={<ModeracaoAgencias />} />
          <Route path="/cadastro-agencia" element={<CadastroAgencia />} />
          <Route path="/agencias" element={<AgenciasPage />} />
          <Route path="/mapa-agencias" element={<MapaAgencias />} />       
          <Route path="/analise-curriculo" element={<Analisecurriculo />} />
          <Route path="/analise-curriculo/sucesso" element={<Sucesso />} />
          <Route path="/resultado-curriculo/:id" element={<ResultadoCurriculo />} />
          <Route path="/calculadora-recesso" element={<CalculadoraRecesso />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="*" element={<NotFound />} />
          {/* Adicione outras rotas principais aqui */}
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppLayout />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
