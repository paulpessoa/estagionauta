import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { Footer } from './components/Footer';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/theme-provider';
import { routes } from './route';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ReviewModal from './components/modals/ReviewModal'
import { HelmetProvider } from 'react-helmet-async';

const queryClient = new QueryClient();

import { toast } from 'sonner';
import { BrainCircuit } from 'lucide-react';

function AppLayout() {
  const handleCopilotClick = () => {
    toast.info("Copilot IA pessoal está em desenvolvimento!", {
      description: "Em breve, o Copilot ajudará você em tempo real durante suas simulações e candidaturas!"
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-14">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh] bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <Routes>
            {routes.map(({ path, component: Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <ReviewModal />

      {/* Floating Copilot Button */}
      <button
        onClick={handleCopilotClick}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 group"
        title="Copilot IA (Em Desenvolvimento)"
        style={{
          animation: 'pulse-shadow 2s infinite'
        }}
      >
        <BrainCircuit className="h-6 w-6 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Custom keyframe animation for shadow pulsing */}
      <style>{`
        @keyframes pulse-shadow {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 15px rgba(124, 58, 237, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(124, 58, 237, 0);
          }
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        defaultTheme='light'
        forcedTheme='light'
        attribute='class'
        disableTransitionOnChange
        enableSystem={false}
      >
        <HelmetProvider>
          <BrowserRouter>
            <AuthProvider>
              <AppLayout />
              <Toaster />
            </AuthProvider>
          </BrowserRouter>
        </HelmetProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;