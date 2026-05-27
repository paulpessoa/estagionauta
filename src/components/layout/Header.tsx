import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  User,
  Settings,
  LogOut,
  BarChart3,
  FileText,
  CreditCard,
  Menu,
  AlertCircle,
  Building2,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  Monitor,
  Satellite,
  Zap,
  ChevronDown,
  Bell,
  Star,
  X,
  Shield,
  Kanban
} from "lucide-react"
import { useState } from "react"
import { useTheme } from "next-themes"
import { AuthRequiredModal } from "@/components/AuthRequiredModal"
import { MagicLinkModal } from "@/components/auth/MagicLinkModal"
import { Separator } from "@/components/ui/separator"
import { useCredits } from "../../hooks/useCredits"
import { useIsMobile } from "../../hooks/use-mobile"

const NavLinks = ({
  mobile = false,
  onLinkClick
}: {
  mobile?: boolean
  onLinkClick?: () => void
}) => {
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
      <div
        className={
          mobile
            ? "flex flex-col space-y-4 text-sm"
            : "hidden md:flex items-center space-x-6 text-sm font-medium"
        }
      >
        <Link
          to="/agencias"
          className={`transition-colors hover:text-foreground/80 text-foreground/60`}
          onClick={onLinkClick}
        >
          Lista de Agências
        </Link>
        <Link
          to="/simulador-entrevistas"
          className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1"
          onClick={handleCurriculoIAClick}
        >
          Simulador de Entrevistas
        </Link>
        <Link
          to="/precos"
          className="transition-colors hover:text-foreground/80 text-foreground/60"
          onClick={onLinkClick}
        >
          Planos
        </Link>
      </div>
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
}

const SmartActionButton = ({ mobile = false, onLinkClick }: { mobile?: boolean; onLinkClick?: () => void }) => {
  const { user, profile, isSupabaseAvailable } = useAuth()
  const [showMagicLinkModal, setShowMagicLinkModal] = useState(false)

  if (!isSupabaseAvailable) {
    return (
      <Button variant="outline" disabled className="opacity-50">
        <AlertCircle className="mr-2 h-4 w-4" />
        Sistema Offline
      </Button>
    )
  }

  // Usuário logado - não mostra botão de análise (já tem acesso direto)
  if (user && profile) {
    return null
  }

  // No mobile, mostrar botões diretos
  if (mobile) {
    return (
      <>
        <div className="flex flex-col space-y-2 w-full">
          <Button
            className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white font-bold shadow-lg hover:from-cyan-600 hover:to-purple-700 transition-all duration-300"
            asChild
          >
            <Link to="/login" onClick={onLinkClick}>
              <LogIn className="mr-2 h-4 w-4" />
              Entrar
            </Link>
          </Button>
          <Button variant="outline" asChild className="justify-start">
            <Link to="/cadastro" onClick={onLinkClick}>
              <UserPlus className="mr-2 h-4 w-4" />
              Criar Conta
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setShowMagicLinkModal(true)
              if (onLinkClick) onLinkClick()
            }}
            className="justify-start"
          >
            <Zap className="mr-2 h-4 w-4" />
            Login sem Senha
          </Button>
        </div>
        <MagicLinkModal
          open={showMagicLinkModal}
          onOpenChange={setShowMagicLinkModal}
        />
      </>
    )
  }

  // No desktop, usar dropdown
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white font-bold shadow-lg hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 transform hover: border border-cyan-300/30">
            <Monitor className="mr-2 h-4 w-4" />
            Começar Agora
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link to="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Entrar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/cadastro">
              <UserPlus className="mr-2 h-4 w-4" />
              Criar Conta
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowMagicLinkModal(true)}>
            <Zap className="mr-2 h-4 w-4" />
            Login sem Senha
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <MagicLinkModal
        open={showMagicLinkModal}
        onOpenChange={setShowMagicLinkModal}
      />
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
  const { credits } = useCredits()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showMagicLinkModal, setShowMagicLinkModal] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
  }



  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

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
                  <NavLinks
                    mobile
                    onLinkClick={() => setMobileMenuOpen(false)}
                  />

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
                    <div className="flex justify-center">
                      <SmartActionButton mobile />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden md:flex items-center space-x-2">
              {!isSupabaseAvailable && (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <SmartActionButton />
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
                    {/* Ícones de créditos */}

                    {!(isAdmin || isModerator) && (
                      <Link
                        to="/creditos"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-2 hover:bg-muted/50 p-2 rounded-lg transition-colors w-full"
                      >
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-foreground">
                          Meus Créditos
                        </span>
                      </Link>
                    )}

                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            profile.avatar_url ||
                            (user?.app_metadata?.provider === "github" &&
                              user?.user_metadata?.avatar_url) ||
                            (user?.app_metadata?.provider === "google" &&
                              user?.user_metadata?.avatar_url) ||
                            (user?.app_metadata?.provider === "linkedin" &&
                              user?.user_metadata?.avatar_url) ||
                            undefined
                          }
                          alt="Avatar"
                        />
                        <AvatarFallback>
                          {profile.full_name?.charAt(0)?.toUpperCase() ||
                            profile.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {profile.full_name || profile.email}
                        </p>
                        {profile.role !== "student" && (
                          <Badge variant="secondary" className="text-xs w-fit">
                            {profile.role === "admin"
                              ? "Admin"
                              : profile.role === "moderator"
                                ? "Moderador"
                                : "Agência"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button variant="ghost" asChild className="justify-start">
                        <Link
                          to="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </Button>

                      {/* Se for usuário comum, mostramos Minhas Análises e as ferramentas estudantis */}
                      {!(isAdmin || isModerator) && (
                        <>
                          <Button variant="ghost" asChild className="justify-start">
                            <Link
                              to="/minhas-analises"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Minhas Análises
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            asChild
                            className="justify-start"
                          >
                            <Link
                              to="/simulador-entrevistas"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Simulador de Entrevistas
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            asChild
                            className="justify-start"
                          >
                            <Link
                              to="/gerador-curriculos"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Gerador de Currículos
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            asChild
                            className="justify-start"
                          >
                            <Link
                              to="/candidaturas"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Kanban className="mr-2 h-4 w-4" />
                              Candidaturas
                            </Link>
                          </Button>
                        </>
                      )}

                      {/* Se for Admin/Moderator, mostramos Painel Administrativo */}
                      {(isAdmin || isModerator) && (
                        <Button
                          variant="ghost"
                          asChild
                          className="justify-start"
                        >
                          <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Painel Administrativo
                          </Link>
                        </Button>
                      )}

                      {/* Se for usuário comum plano free, comprar créditos */}
                      {!(isAdmin || isModerator) && profile.subscription_status === "free" && (
                        <Button
                          variant="ghost"
                          asChild
                          className="justify-start"
                        >
                          <Link
                            to="/precos"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Comprar Créditos
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" asChild className="justify-start">
                        <Link
                          to="/perfil"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Meu Perfil
                        </Link>
                      </Button>
                      <Button variant="ghost" asChild className="justify-start">
                        <Link
                          to="/configuracoes"
                          onClick={() => setMobileMenuOpen(false)}
                        >
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
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Entrar
                      </Link>
                    </Button>
                    <Button asChild className="justify-start">
                      <Link
                        to="/cadastro"
                        onClick={() => setMobileMenuOpen(false)}
                      >
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
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
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
                        {profile.full_name?.charAt(0)?.toUpperCase() ||
                          profile.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-md">
                          {profile.full_name || profile.email}
                        </p>
                        {profile.role !== "student" && (
                          <Badge variant="secondary" className="text-xs">
                            {profile.role === "admin"
                              ? "Admin"
                              : profile.role === "moderator"
                                ? "Moderador"
                                : "Agência"}
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

                  {/* Se for usuário comum, mostramos Minhas Análises e Créditos simplificados */}
                  {!(isAdmin || isModerator) && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/minhas-analises">
                          <FileText className="mr-2 h-4 w-4" />
                          Minhas Análises
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/creditos">
                          <Star className="mr-2 h-4 w-4 text-yellow-500 fill-yellow-500" />
                          Meus Créditos
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Se for usuário comum, mostramos as ferramentas estudantis */}
                  {!(isAdmin || isModerator) && (
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
                        <Link to="/candidaturas">
                          <Kanban className="mr-2 h-4 w-4" />
                          Candidaturas
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Se for Admin/Moderator, mostramos Painel Administrativo */}
                  {(isAdmin || isModerator) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin">
                          <Shield className="mr-2 h-4 w-4" />
                          Painel Administrativo
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Se for usuário comum em plano free, mostramos comprar créditos */}
                  {!(isAdmin || isModerator) && profile.subscription_status === "free" && (
                    <DropdownMenuItem asChild>
                      <Link to="/precos">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Comprar Créditos
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/perfil">
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/configuracoes">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-destructive focus:text-destructive"
                  >
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
              <SmartActionButton />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
