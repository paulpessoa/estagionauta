import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, LogIn, UserPlus, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  requireRole?: 'admin' | 'moderator' | 'student'
  fallback?: ReactNode
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireRole,
  fallback 
}: ProtectedRouteProps) {
  const { user, profile, isLoading, isSupabaseAvailable } = useAuth()

  // Se ainda está carregando, mostra loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Se não tem Supabase disponível
  if (!isSupabaseAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Lock className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-xl">Serviço Indisponível</CardTitle>
            <CardDescription>
              O sistema de autenticação está temporariamente indisponível.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Algumas funcionalidades estão limitadas devido a problemas técnicos.
            </p>
            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Voltar ao Início
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Se requer autenticação mas usuário não está logado
  if (requireAuth && (!user || !profile)) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Acesso Negado</CardTitle>
            <CardDescription>
              Você precisa estar logado para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Faça login ou crie uma conta para continuar.
            </p>
            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Fazer Login
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/cadastro">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar Conta
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Voltar ao Início
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Se requer role específica mas usuário não tem
  const hasRequiredRole = profile?.role === requireRole || (requireRole === 'moderator' && profile?.role === 'admin')
  if (requireRole && !hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Lock className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Permissão Insuficiente</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Esta área é restrita a usuários com permissões específicas.
            </p>
            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link to="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Ir ao Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Voltar ao Início
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Se passou por todas as validações, renderiza o conteúdo
  return <>{children}</>
} 