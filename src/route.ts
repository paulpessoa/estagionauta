import HomePage from './pages/Index'
import Admin from './pages/Admin'
import Agencias from './pages/Agencias'
import Analisecurriculo from './pages/Analisecurriculo'
import Cadastro from './pages/Cadastro'
import CadastroAgencia from './pages/CadastroAgencia'
import CalculadoraRecesso from './pages/CalculadoraRecesso'
import EsqueciSenha from './pages/EsqueciSenha'
import Login from './pages/Login'
import MapaAgencias from './pages/MapaAgencias'
import ResultadoCurriculo from './pages/ResultadoCurriculo'
import ResultadoCurriculoExemplo from './pages/ResultadoCurriculoExemplo'
import Sucesso from './pages/Sucesso'
import ModeracaoAgencias from './pages/admin/ModeracaoAgencias'
import NotFound from './pages/NotFound'
import Precos from './pages/Precos'
import Afiliados from './pages/Afiliados'
import SimuladorEntrevistas from './pages/SimuladorEntrevistas'
import GeradorCurriculos from './pages/GeradorCurriculos'
import KanbanCandidaturas from './pages/KanbanCandidaturas'
import Dashboard from './pages/Dashboard'
import MinhasAnalises from './pages/MinhasAnalises'
import Configuracoes from './pages/Configuracoes'
import { ProtectedRoute } from './components/ProtectedRoute'
import React from 'react'

// Componentes protegidos
const ProtectedDashboard = () => React.createElement(ProtectedRoute, null, React.createElement(Dashboard))

const ProtectedAnaliseCurriculo = () => React.createElement(ProtectedRoute, null, React.createElement(Analisecurriculo))

const ProtectedMinhasAnalises = () => React.createElement(ProtectedRoute, null, React.createElement(MinhasAnalises))

const ProtectedKanbanCandidaturas = () => React.createElement(ProtectedRoute, null, React.createElement(KanbanCandidaturas))

const ProtectedConfiguracoes = () => React.createElement(ProtectedRoute, null, React.createElement(Configuracoes))

const ProtectedResultadoCurriculo = () => React.createElement(ProtectedRoute, null, React.createElement(ResultadoCurriculo))

// Rotas que requerem role específica
const ProtectedAdmin = () => React.createElement(ProtectedRoute, { requireRole: "admin" }, React.createElement(Admin))

const ProtectedModeracaoAgencias = () => React.createElement(ProtectedRoute, { requireRole: "moderator" }, React.createElement(ModeracaoAgencias))

const ProtectedGeradorCurriculos = () => React.createElement(ProtectedRoute, { requireRole: "admin" }, React.createElement(GeradorCurriculos))

const ProtectedSimuladorEntrevistas = () => React.createElement(ProtectedRoute, { requireRole: "admin" }, React.createElement(SimuladorEntrevistas))

export const routes = [
  { path: '/', component: HomePage },
  { path: '/dashboard', component: ProtectedDashboard },
  { path: '/login', component: Login },
  { path: '/esqueci-senha', component: EsqueciSenha },
  { path: '/cadastro', component: Cadastro },

  { path: '/admin', component: ProtectedAdmin },
  { path: '/admin/moderacao-agencias', component: ProtectedModeracaoAgencias },

  { path: '/cadastro-agencia', component: CadastroAgencia },
  { path: '/mapa-agencias', component: MapaAgencias },
  

  { path: '/analise-curriculo', component: ProtectedAnaliseCurriculo },
  { path: '/analise-curriculo/sucesso', component: Sucesso },
  { path: '/minhas-analises', component: ProtectedMinhasAnalises },
  { path: '/agencias', component: Agencias },
  { path: '/calculadora-recesso', component: CalculadoraRecesso },
  { path: '/gerador-curriculos', component: ProtectedGeradorCurriculos},
  { path: '/simulador-entrevistas', component: ProtectedSimuladorEntrevistas },
  { path: '/kanban-candidaturas', component: ProtectedKanbanCandidaturas },
  { path: '/precos', component: Precos},
  { path: '/comprar-creditos', component: Precos },
  { path: '/configuracoes', component: ProtectedConfiguracoes },
  { path: '/resultado-curriculo/:id', component: ProtectedResultadoCurriculo },
  { path: '/resultado-curriculo-exemplo', component: ResultadoCurriculoExemplo },
  { path: '/sucesso', component: Sucesso },
  { path: '/afiliados', component: Afiliados },
  { path: '*', component: NotFound },
]