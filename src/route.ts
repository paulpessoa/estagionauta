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

export const routes = [
  { path: '/', component: HomePage },
  { path: '/admin', component: Admin },
  { path: '/agencias', component: Agencias },
  { path: '/analise-curriculo', component: Analisecurriculo },
  { path: '/cadastro', component: Cadastro },
  { path: '/cadastro-agencia', component: CadastroAgencia },
  { path: '/calculadora-recesso', component: CalculadoraRecesso },
  { path: '/esqueci-senha', component: EsqueciSenha },
  { path: '/login', component: Login },
  { path: '/mapa-agencias', component: MapaAgencias },
  { path: '/resultado-curriculo', component: ResultadoCurriculo },
  { path: '/resultado-curriculo-exemplo', component: ResultadoCurriculoExemplo },
  { path: '/sucesso', component: Sucesso },
  { path: '/admin/moderacao-agencias', component: ModeracaoAgencias },
  { path: '/precos', component: Precos},
  { path: '*', component: NotFound },
]