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
import { User, Settings, LogOut, BarChart3, FileText, CreditCard, Menu, AlertCircle, Users, Building2, Sun, Moon, LogIn, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Permission } from '@/types/permissions'
import { useTheme } from 'next-themes'
import { toast } from '@/components/ui/use-toast'
import {toast as tototo } from 'sonner'

const NavLinks = ({ mobile = false, onLinkClick }: { mobile?: boolean; onLinkClick?: () => void }) => {
  const { isSupabaseAvailable, isAdmin, isModerator } = useAuth()
  
  return (
    <div className={mobile ? "flex flex-col space-y-4 text-sm" : "hidden md:flex items-center space-x-6 text-sm font-medium"}>
      <Link
        to="/mapa-agencias"
        className={`transition-colors hover:text-foreground/80 text-foreground/60`}
        onClick={onLinkClick}
      >
        Mapa de Agências
      </Link>
      <Link
        to="/agencias"
        className={`transition-colors hover:text-foreground/80 text-foreground/60`}
        onClick={onLinkClick}
      >
        Lista de Agências
      </Link>
      <Link
        to="/calculadora-recesso"
        className={`transition-colors hover:text-foreground/80 text-foreground/60`}
        onClick={onLinkClick}
      >
        Calculadora
      </Link>
      <Link
        to="#"
        // to="/analise-curriculo"
        className={`transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1`}
        // onClick={onLinkClick}
        onClick={() => {
          tototo.info("Devido a alta demanda, a análise de currículos está temporariamente indisponível. Estamos trabalhando para melhorar a experiência. Agradecemos pela compreensão!");
        }}>
        Análise de Currículo
        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
          com IA
        </Badge>
        {!isSupabaseAvailable && (
          <AlertCircle className="h-3 w-3 text-yellow-500" />
        )}
      </Link>
      {(isAdmin || isModerator) && (
        <>
          <Link
            to="/admin/moderacao-agencias"
            className='transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1'
            onClick={onLinkClick}
          >
            <Building2 className="h-4 w-4 mr-2"/>
            Moderar Agências
          </Link>
        </>
      )}
    </div>
  )
}

export function Header() {
  const {
    user,
    profile,
    signOut,
    isLoading,
    isSupabaseAvailable,
    hasPermission
  } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  console.log('Header auth state:', { isLoading, user, profile, isSupabaseAvailable })

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
          // <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

          {/* Desktop Navigation */}
          <NavLinks />

          <div className="flex items-center space-x-2">
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

            {/* Desktop Login/Register Buttons */}
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

        {/* Desktop Navigation */}
        <NavLinks />
        <div className="flex items-center space-x-2">
      

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            {/* Theme Toggle - Mobile */}
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
                      {/* <div>
                        <p className="font-medium text-sm">{profile.full_name}</p>
                        <p className="text-xs text-muted-foreground">{profile.email}</p>
                      </div> */}
                      <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm">{profile.full_name || profile.email}</p>
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
                    </div>
                    
                    {profile.credits > 0 && (
                      // <div className="flex items-center space-x-2">
                      //   <span className="text-yellow-400 text-sm">{profile.credits}★</span>
                      //     <span className="relative cursor-pointer" onClick={() => tototo.info('Funcionalidade de comentários em desenvolvimento.')}>
                      //     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      //       <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      //     </svg>
                      //     {/* <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">4</span> */}
                      //   </span>
                      // </div>
                      null
                    )}
                    
                    <div className="flex flex-col space-y-2">
                      <Button variant="ghost" asChild className="justify-start">
                        <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </Button>
                      {hasPermission('resumes.view') && (
                        <Button variant="ghost" asChild className="justify-start">
                          <Link to="/minhas-analises" onClick={() => setMobileMenuOpen(false)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Minhas Análises
                          </Link>
                        </Button>
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

          {/* Desktop User Menu */}
          {user && profile ? (
            <div className="hidden md:flex items-center space-x-2">
              {profile.credits > 0 && (
                // <div className="flex items-center space-x-2">
                //   <span className="text-yellow-400 text-sm">{profile.credits} ★</span>
                //     <span className="relative cursor-pointer" onClick={() => tototo.info('Funcionalidade de comentários em desenvolvimento.')}>
                //         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                //       <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                //     </svg>
                //     {/* <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">4</span> */}
                //   </span>
                // </div>
                null
              )}
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
                  {hasPermission('resumes.view') && (
                    <DropdownMenuItem asChild>
                      <Link to="/minhas-analises">
                        <FileText className="mr-2 h-4 w-4" />
                        Minhas Análises
                      </Link>
                    </DropdownMenuItem>
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
