
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Settings, LogOut, BarChart3, FileText, CreditCard, Menu, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

export function Header() {
  const { user, profile, signOut, loading, isSupabaseAvailable } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  if (loading) {
    return (
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
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

  const NavLinks = ({ mobile = false, onLinkClick }: { mobile?: boolean; onLinkClick?: () => void }) => (
    <div className={mobile ? "flex flex-col space-y-4" : "hidden md:flex items-center space-x-6 text-sm font-medium"}>
      <Link
        to="/mapa-agencias"
        className={`transition-colors hover:text-foreground/80 text-foreground/60 ${mobile ? 'text-lg' : ''}`}
        onClick={onLinkClick}
      >
        Mapa de Agências
      </Link>
      <Link
        to="/calculadora-recesso"
        className={`transition-colors hover:text-foreground/80 text-foreground/60 ${mobile ? 'text-lg' : ''}`}
        onClick={onLinkClick}
      >
        Calculadora
      </Link>
      <Link
        to="/analise-curriculo"
        className={`transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1 ${mobile ? 'text-lg' : ''}`}
        onClick={onLinkClick}
      >
        Análise de Currículo
        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
          Grátis
        </Badge>
        {!isSupabaseAvailable && (
          <AlertCircle className="h-3 w-3 text-yellow-500" />
        )}
      </Link>
      <Button variant="ghost" asChild size={mobile ? "default" : "sm"}>
        <a 
          href="https://menvo.com.br" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`transition-colors hover:text-foreground/80 text-foreground/60 ${mobile ? 'text-lg w-full justify-start' : ''}`}
          onClick={onLinkClick}
        >
          Mentores
        </a>
      </Button>
    </div>
  )

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
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

        {/* Desktop Navigation */}
        <NavLinks />

        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-6 pt-6">
                <NavLinks mobile onLinkClick={() => setMobileMenuOpen(false)} />
                
                {/* Aviso sobre Supabase */}
                {!isSupabaseAvailable && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        Algumas funcionalidades estão limitadas
                      </p>
                    </div>
                  </div>
                )}
                
                {user && profile && isSupabaseAvailable ? (
                  <div className="flex flex-col space-y-4 pt-4 border-t">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || undefined} alt="Avatar" />
                        <AvatarFallback>
                          {profile.full_name?.charAt(0)?.toUpperCase() || profile.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{profile.full_name || profile.email}</p>
                        <p className="text-xs text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>
                    
                    {profile.credits > 0 && (
                      <Badge variant="outline" className="w-fit">
                        {profile.credits} créditos
                      </Badge>
                    )}
                    
                    <div className="flex flex-col space-y-2">
                      <Button variant="ghost" asChild className="justify-start">
                        <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button variant="ghost" asChild className="justify-start">
                        <Link to="/minhas-analises" onClick={() => setMobileMenuOpen(false)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Minhas Análises
                        </Link>
                      </Button>
                      {profile.subscription_status === 'free' && (
                        <Button variant="ghost" asChild className="justify-start">
                          <Link to="/planos" onClick={() => setMobileMenuOpen(false)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Comprar Créditos
                          </Link>
                        </Button>
                      )}
                      {(profile.role === 'admin' || profile.role === 'moderator') && (
                        <Button variant="ghost" asChild className="justify-start">
                          <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Administração
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" asChild className="justify-start">
                        <Link to="/configuracoes" onClick={() => setMobileMenuOpen(false)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Configurações
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          signOut()
                          setMobileMenuOpen(false)
                        }}
                        className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2 pt-4 border-t">
                    {isSupabaseAvailable ? (
                      <>
                        <Button variant="ghost" asChild className="justify-start">
                          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                            Entrar
                          </Link>
                        </Button>
                        <Button asChild className="justify-start">
                          <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                            Cadastrar
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Login/Cadastro não disponível
                      </p>
                    )}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop User Menu */}
          {user && profile && isSupabaseAvailable ? (
            <div className="hidden md:flex items-center space-x-2">
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
            <div className="hidden md:flex items-center space-x-2">
              {!isSupabaseAvailable && (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              {isSupabaseAvailable ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/login">Entrar</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/cadastro">Cadastrar</Link>
                  </Button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Login indisponível
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
