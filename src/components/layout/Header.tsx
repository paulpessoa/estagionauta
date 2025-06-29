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
import { User, Settings, LogOut, BarChart3, FileText, CreditCard, Menu, AlertCircle, Building2, Sun, Moon, LogIn, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { AuthRequiredModal } from '@/components/AuthRequiredModal'

const NavLinks = ({ mobile = false, onLinkClick }: { mobile?: boolean; onLinkClick?: () => void }) => {
  const { isSupabaseAvailable, isAdmin, isModerator, user, profile } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleCurriculoIAClick = (e: React.MouseEvent) => {
    if (!user || !profile) {
      e.preventDefault()
      setShowAuthModal(true)
    } else if (onLinkClick) {
      onLinkClick()
    }
  }

  return (
    <>
      <div className={mobile ? "flex flex-col space-y-4 text-sm" : "hidden md:flex items-center space-x-6 text-sm font-medium"}>
        <Link
          to="/agencias"
          className={`transition-colors hover:text-foreground/80 text-foreground/60`}
          onClick={onLinkClick}
        >
          Agências de Estágio
        </Link>
        <Link
          to="/analise-curriculo"
          className={`transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1`}
          onClick={handleCurriculoIAClick}

        >
          Análise de Currículo
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
            com IA
          </Badge>
          {!isSupabaseAvailable && (
            <AlertCircle className="h-3 w-3 text-yellow-500" />
          )}
        </Link>
        <Link
          to="/calculadora-recesso"
          className={`transition-colors hover:text-foreground/80 text-foreground/60`}
          onClick={onLinkClick}        >
          Calculadora de Recesso
        </Link>
      </div>
      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}

export function Header() {
  const {
    user,
    profile,
    signOut,
    isLoading,
    isSupabaseAvailable,
    isAdmin,
    isModerator
  } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 w-full z-50 border-b border-border/40 bg-white/30 dark:bg-black/20 backdrop-blur-lg supports-[backdrop-filter]:bg-background/40 shadow-lg">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Estagionauta" className="h-9 w-auto" />
              <span className="hidden font-bold sm:inline-block text-lg">
                Estagionauta
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <div className="animate-pulse h-8 w-8 bg-muted rounded-full"></div>
          </div>
        </div>
      </header>
    )
  }

  if (!user || !profile) {
    return (
      <header className="fixed w-full z-50 border-b border-border/40 bg-white/30 dark:bg-black/20 backdrop-blur-lg supports-[backdrop-filter]:bg-background/40 shadow-lg">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Estagionauta" className="h-8 w-auto" />
              <span className="hidden font-bold sm:inline-block text-lg">
                Estagionauta
              </span>
            </Link>
          </div>

          <NavLinks />

          <div className="flex items-center space-x-2">
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
                  
                  <div className="flex flex-col space-y-2 pt-4 border-t">
                    {isSupabaseAvailable ? (
                      <>
                        <Button variant="ghost" asChild className="justify-start">
                          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                            <LogIn className="mr-2 h-4 w-4" />
                            Entrar
                          </Link>
                        </Button>
                        <Button asChild className="justify-start">
                          <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                            <UserPlus className="mr-2 h-4 w-4" />
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
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden md:flex items-center space-x-2">
              {!isSupabaseAvailable && (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              {isSupabaseAvailable ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    aria-label="Alternar tema"
                  >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link to="/login">
                     <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                      </Link>
                  </Button>
                  <Button asChild>
                    <Link to="/cadastro">
                 <UserPlus className="mr-2 h-4 w-4" />
                    Cadastrar</Link>
                  </Button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Login indisponível
                </span>
              )}
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-border/40 bg-white/30 dark:bg-black/20 backdrop-blur-lg supports-[backdrop-filter]:bg-background/40 shadow-lg">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Estagionauta" className="h-9 w-auto" />
            <span className="hidden font-bold sm:inline-block text-lg">
              Estagionauta
            </span>
          </Link>
        </div>

        <NavLinks />
        
        <div className="flex items-center space-x-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Alternar tema"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </div>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-6 pt-6">
                <NavLinks mobile onLinkClick={() => setMobileMenuOpen(false)} />
                
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
                
                {user && profile ? (
                  <div className="flex flex-col space-y-4 pt-4 border-t">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={
                            profile.avatar_url || 
                            (user?.app_metadata?.provider === 'github' && user?.user_metadata?.avatar_url) ||
                            (user?.app_metadata?.provider === 'google' && user?.user_metadata?.avatar_url) ||
                            (user?.app_metadata?.provider === 'linkedin' && user?.user_metadata?.avatar_url) ||
                            undefined
                          } 
                          alt="Avatar" 
                        />
                        <AvatarFallback>
                          {profile.full_name?.charAt(0)?.toUpperCase() || profile.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{profile.full_name || profile.email}</p>
                        {profile.role !== 'student' && (
                          <Badge variant="secondary" className="text-xs w-fit">
                            {profile.role === 'admin' ? 'Admin' : profile.role === 'moderator' ? 'Moderador' : 'Agência'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
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
                     
                      {(isAdmin || isModerator) && (
                        <>
                          <Button variant="ghost" asChild className="justify-start">
                            <Link to="/simulador-entrevistas" onClick={() => setMobileMenuOpen(false)}>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Simulador de Entrevistas
                            </Link>
                          </Button>
                          <Button variant="ghost" asChild className="justify-start">
                            <Link to="/gerador-curriculos" onClick={() => setMobileMenuOpen(false)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Gerador de Currículos
                            </Link>
                          </Button>
                          <Button variant="ghost" asChild className="justify-start">
                            <Link to="/kanban-candidaturas" onClick={() => setMobileMenuOpen(false)}>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Kanban de Candidaturas
                            </Link>
                          </Button>
                          {isModerator && (
                            <Button variant="ghost" asChild className="justify-start">
                              <Link to="/admin/moderacao-agencias" onClick={() => setMobileMenuOpen(false)}>
                                <Building2 className="mr-2 h-4 w-4" />
                                Moderar Agências
                              </Link>
                            </Button>
                          )}
                        </>
                      )}
                      {profile.subscription_status === 'free' && (
                        <Button variant="ghost" asChild className="justify-start">
                          <Link to="/planos" onClick={() => setMobileMenuOpen(false)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Comprar Créditos
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
                        className="justify-start text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2 pt-4 border-t">
                    <Button variant="ghost" asChild className="justify-start">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Entrar
                      </Link>
                    </Button>
                    <Button asChild className="justify-start">
                      <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Cadastrar
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {user && profile ? (
            <div className="hidden md:flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                       <AvatarImage
                        src={
                          user?.user_metadata?.picture ||
                          user?.identities?.[0]?.identity_data?.picture ||
                          user?.identities?.[1]?.identity_data?.picture ||
                          profile?.avatar_url ||
                          undefined
                        }
                        alt={profile.full_name ?? "Imagem do usuário"}
                      />
                      <AvatarFallback>
                        {profile.full_name?.charAt(0)?.toUpperCase() || profile.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-md">{profile.full_name || profile.email}</p>
                        {profile.role !== 'student' && (
                          <Badge variant="secondary" className="text-xs">
                            {profile.role === 'admin' ? 'Admin' : profile.role === 'moderator' ? 'Moderador' : 'Agência'}
                          </Badge>
                        )}
                      </div>
                      <p className="w-[200px] truncate text-xs text-muted-foreground">
                        {profile.email}
                      </p>
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
                  {(isAdmin || isModerator) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/simulador-entrevistas">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Simulador de Entrevistas
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/gerador-curriculos">
                          <FileText className="mr-2 h-4 w-4" />
                          Gerador de Currículos
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/kanban-candidaturas">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Kanban de Candidaturas
                        </Link>
                      </DropdownMenuItem>
                      {isModerator && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin/moderacao-agencias">
                            <Building2 className="mr-2 h-4 w-4" />
                            Moderar Agências
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  {profile.subscription_status === 'free' && (
                    <DropdownMenuItem asChild>
                      <Link to="/planos">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Comprar Créditos
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
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
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
              <Button variant="ghost" asChild>
                <Link to="/login">
                 <LogIn className="mr-2 h-4 w-4" />
                Entrar</Link>
              </Button>
              <Button asChild>
                <Link to="/cadastro">
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
