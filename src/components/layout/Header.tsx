
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Settings, LogOut, Users, BarChart3, FileText, CreditCard } from 'lucide-react'

export function Header() {
  const { user, profile, signOut, loading } = useAuth()

  if (loading) {
    return (
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="hidden font-bold sm:inline-block text-xl">
                Estagionauta
              </span>
            </Link>
          </div>
          <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="hidden font-bold sm:inline-block text-xl">
              Estagionauta
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            to="/mapa-agencias"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Mapa de Agências
          </Link>
          <Link
            to="/calculadora-recesso"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Calculadora
          </Link>
          <Link
            to="/analise-curriculo"
            className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1"
          >
            Análise de Currículo
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              Grátis
            </Badge>
          </Link>
          <Button variant="ghost" asChild size="sm">
            <a 
              href="https://menvo.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Mentores
            </a>
          </Button>
        </nav>

        <div className="flex items-center space-x-4">
          {user && profile ? (
            <div className="flex items-center space-x-2">
              {profile.credits > 0 && (
                <Badge variant="outline" className="text-xs">
                  {profile.credits} créditos
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || undefined} alt="Avatar" />
                      <AvatarFallback>
                        {profile.full_name?.charAt(0)?.toUpperCase() || profile.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile.full_name || profile.email}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {profile.email}
                      </p>
                      {profile.role !== 'student' && (
                        <Badge variant="secondary" className="w-fit text-xs">
                          {profile.role === 'admin' ? 'Admin' : profile.role === 'moderator' ? 'Moderador' : 'Agência'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/minhas-analises">
                      <FileText className="mr-2 h-4 w-4" />
                      Minhas Análises
                    </Link>
                  </DropdownMenuItem>
                  {profile.subscription_status === 'free' && (
                    <DropdownMenuItem asChild>
                      <Link to="/planos">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Comprar Créditos
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(profile.role === 'admin' || profile.role === 'moderator') && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Administração
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/configuracoes">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link to="/cadastro">Cadastrar</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
