import { lazy } from "react"
import { ProtectedRoute } from "./components/ProtectedRoute"
import React from "react"
import { Navigate, useParams } from "react-router-dom"

const HomePage = lazy(() => import("./pages/Index"))
const Admin = lazy(() => import("./pages/Admin"))
const Agencias = lazy(() => import("./pages/Agencias"))
const Analisecurriculo = lazy(() => import("./pages/Analisecurriculo"))
const Cadastro = lazy(() => import("./pages/Cadastro"))
const CadastroAgencia = lazy(() => import("./pages/CadastroAgencia"))
const CalculadoraRecesso = lazy(() => import("./pages/CalculadoraRecesso"))
const EsqueciSenha = lazy(() => import("./pages/EsqueciSenha"))
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"))
const Login = lazy(() => import("./pages/Login"))
const MapaAgencias = lazy(() => import("./pages/MapaAgencias"))
const ResultadoCurriculo = lazy(() => import("./pages/ResultadoCurriculo"))
const ResultadoCurriculoExemplo = lazy(() => import("./pages/ResultadoCurriculoExemplo"))
const Sucesso = lazy(() => import("./pages/Sucesso"))
const NotFound = lazy(() => import("./pages/NotFound"))
const Precos = lazy(() => import("./pages/Precos"))
const ConvideAmigos = lazy(() => import("./pages/ConvideAmigos"))
const SimuladorEntrevistas = lazy(() => import("./pages/SimuladorEntrevistas"))

const KanbanCandidaturas = lazy(() => import("./pages/KanbanCandidaturas"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const MinhasAnalises = lazy(() => import("./pages/MinhasAnalises"))
const Configuracoes = lazy(() => import("./pages/Configuracoes"))
const Perfil = lazy(() => import("./pages/Perfil"))
const Creditos = lazy(() => import("./pages/Creditos"))
const EmailLogs = lazy(() => import("./pages/EmailLogs"))
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"))
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"))
const Status = lazy(() => import("./pages/Status"))
const ReferralRedirect = lazy(() => import("./pages/ReferralRedirect"))
const Recompensas = lazy(() => import("./pages/Recompensas"))
const Feedback = lazy(() => import("./pages/Feedback"))

// Componentes protegidos
const ProtectedDashboard = () =>
  React.createElement(ProtectedRoute, null, React.createElement(Dashboard))

const ProtectedAnaliseCurriculo = () =>
  React.createElement(
    ProtectedRoute,
    null,
    React.createElement(Analisecurriculo)
  )

const ProtectedMinhasAnalises = () =>
  React.createElement(ProtectedRoute, null, React.createElement(MinhasAnalises))

const ProtectedKanbanCandidaturas = () =>
  React.createElement(
    ProtectedRoute,
    null,
    React.createElement(KanbanCandidaturas)
  )

const ProtectedConfiguracoes = () =>
  React.createElement(ProtectedRoute, null, React.createElement(Configuracoes))

const ProtectedPerfil = () =>
  React.createElement(ProtectedRoute, null, React.createElement(Perfil))

const ProtectedCreditos = () =>
  React.createElement(ProtectedRoute, null, React.createElement(Creditos))

const ProtectedResultadoCurriculo = () =>
  React.createElement(
    ProtectedRoute,
    null,
    React.createElement(ResultadoCurriculo)
  )

const ProtectedEmailLogs = () =>
  React.createElement(ProtectedRoute, {
    requireRole: "moderator",
    children: React.createElement(EmailLogs)
  })

// Rotas que requerem role específica
const ProtectedAdmin = () =>
  React.createElement(ProtectedRoute, {
    requireRole: "moderator",
    children: React.createElement(Admin)
  })


const ProtectedSimuladorEntrevistas = () =>
  React.createElement(
    ProtectedRoute,
    null,
    React.createElement(SimuladorEntrevistas)
  )

const ProtectedSucesso = () =>
  React.createElement(ProtectedRoute, null, React.createElement(Sucesso))

const ProtectedRecompensas = () =>
  React.createElement(ProtectedRoute, null, React.createElement(Recompensas))

const RedirectToAnalises = () => React.createElement(Navigate, { to: "/analises", replace: true })
const RedirectToNewAnalise = () => React.createElement(Navigate, { to: "/analises/new", replace: true })
const RedirectToResultado = () => {
  const { id } = useParams<{ id: string }>()
  return React.createElement(Navigate, { to: `/analise/${id}`, replace: true })
}
const RedirectToExemplo = () => React.createElement(Navigate, { to: "/analise/exemplo", replace: true })

export const routes = [
  { path: "/", component: HomePage },
  { path: "/dashboard", component: ProtectedDashboard },
  { path: "/login", component: Login },
  { path: "/esqueci-senha", component: EsqueciSenha },
  { path: "/redefinir-senha", component: RedefinirSenha },
  { path: "/cadastro", component: Cadastro },

  { path: "/admin", component: ProtectedAdmin },
  { path: "/admin/usuarios", component: ProtectedAdmin },
  { path: "/admin/history", component: ProtectedAdmin },
  { path: "/admin/logs", component: ProtectedAdmin },
  { path: "/admin/importador", component: ProtectedAdmin },

  { path: "/cadastro-agencia", component: CadastroAgencia },

  { path: "/analises/new", component: ProtectedAnaliseCurriculo },
  { path: "/analises/sucesso", component: ProtectedSucesso },
  { path: "/analises", component: ProtectedMinhasAnalises },
  { path: "/email-logs", component: ProtectedEmailLogs },
  { path: "/agencias", component: Agencias },
  { path: "/calculadora", component: CalculadoraRecesso },

  { path: "/simulador-entrevistas", component: ProtectedSimuladorEntrevistas },
  {
    path: "/simulador-entrevistas/:id",
    component: ProtectedSimuladorEntrevistas
  },
  { path: "/candidaturas", component: ProtectedKanbanCandidaturas },
  { path: "/precos", component: Precos },
  { path: "/comprar-creditos", component: Precos },
  { path: "/configuracoes", component: ProtectedConfiguracoes },
  { path: "/perfil", component: ProtectedPerfil },
  { path: "/creditos", component: ProtectedCreditos },
  { path: "/analise/:id", component: ProtectedResultadoCurriculo },
  {
    path: "/analise/exemplo",
    component: ResultadoCurriculoExemplo
  },
  // Redirecionamentos para retrocompatibilidade
  { path: "/minhas-analises", component: RedirectToAnalises },
  { path: "/analise-curriculo", component: RedirectToNewAnalise },
  { path: "/resultado-curriculo/:id", component: RedirectToResultado },
  { path: "/resultado-curriculo-exemplo", component: RedirectToExemplo },
  { path: "/sucesso", component: ProtectedSucesso },
  { path: "/convide-amigos", component: ConvideAmigos },
  { path: "/recompensas", component: ProtectedRecompensas },
  { path: "/privacy-policy", component: PrivacyPolicy },
  { path: "/termos-de-uso", component: TermosDeUso },
  { path: "/status", component: Status },
  { path: "/r/:referralCode", component: ReferralRedirect },
  { path: "/feedback", component: Feedback },
  { path: "*", component: NotFound }
]
