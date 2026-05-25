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

function AppLayout() {
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