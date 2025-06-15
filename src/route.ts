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

export const routes = [
  { path: '/', component: HomePage },
  { path: '/login', component: Login },
  { path: '/esqueci-senha', component: EsqueciSenha },
  { path: '/cadastro', component: Cadastro },

  { path: '/admin', component: Admin },
  { path: '/admin/moderacao-agencias', component: ModeracaoAgencias },

  { path: '/cadastro-agencia', component: CadastroAgencia },
  { path: '/mapa-agencias', component: MapaAgencias },
  

  { path: '/analise-curriculo', component: Analisecurriculo },
  { path: '/analise-curriculo/sucesso', component: Sucesso },
  { path: '/agencias', component: Agencias },
  { path: '/calculadora-recesso', component: CalculadoraRecesso },
  { path: '/gerador-curriculos', component: GeradorCurriculos},
  { path: '/simulador-entrevistas', component: SimuladorEntrevistas },
  { path: '/kanban-candidaturas', component: KanbanCandidaturas },
  { path: '/precos', component: Precos},
  { path: '/resultado-curriculo/:id', component: ResultadoCurriculo },
  { path: '/resultado-curriculo-exemplo', component: ResultadoCurriculoExemplo },
  { path: '/sucesso', component: Sucesso },
  { path: '/afiliados', component: Afiliados },
  { path: '*', component: NotFound },
]