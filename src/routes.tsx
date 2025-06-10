import { Routes, Route } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import Index from '@/pages/Index'
import Analisecurriculo from '@/pages/Analisecurriculo'
import Sucesso from '@/pages/Sucesso'
import ResultadoCurriculo from '@/pages/ResultadoCurriculo'
import Agencias from '@/pages/Agencias'
import CalculadoraRecesso from '@/pages/CalculadoraRecesso'
import Admin from '@/pages/Admin'
import Login from '@/pages/Login'
import Cadastro from '@/pages/Cadastro'
import EsqueciSenha from '@/pages/EsqueciSenha'
import NotFound from '@/pages/NotFound'
import ModeracaoAgencias from '@/pages/admin/ModeracaoAgencias'
import ListagemAgencias from '@/pages/admin/ListagemAgencias'
import CadastroAgencia from '@/pages/CadastroAgencia'

export function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/analise-curriculo" element={<Analisecurriculo />} />
          <Route path="/analise-curriculo/sucesso" element={<Sucesso />} />
          <Route path="/resultado-curriculo/:id" element={<ResultadoCurriculo />} />
          <Route path="/agencias" element={<Agencias />} />
          <Route path="/cadastro-agencia" element={<CadastroAgencia />} />
          <Route path="/calculadora-recesso" element={<CalculadoraRecesso />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/agencias" element={<ModeracaoAgencias />} />
          <Route path="/admin/listagem-agencias" element={<ListagemAgencias />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
} 