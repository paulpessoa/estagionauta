
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import Index from "./pages/Index";
import Analisecurriculo from "./pages/Analisecurriculo";
import Sucesso from "./pages/Sucesso";
import ResultadoCurriculo from "./pages/ResultadoCurriculo";
import MapaAgencias from "./pages/MapaAgencias";
import CalculadoraRecesso from "./pages/CalculadoraRecesso";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import EsqueciSenha from "./pages/EsqueciSenha";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/analise-curriculo" element={<Analisecurriculo />} />
                  <Route path="/analise-curriculo/sucesso" element={<Sucesso />} />
                  <Route path="/resultado-curriculo/:id" element={<ResultadoCurriculo />} />
                  <Route path="/mapa-agencias" element={<MapaAgencias />} />
                  <Route path="/calculadora-recesso" element={<CalculadoraRecesso />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/cadastro" element={<Cadastro />} />
                  <Route path="/esqueci-senha" element={<EsqueciSenha />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
