import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Link } from 'react-router-dom'
import { ShieldCheck, Settings, Cookie } from 'lucide-react'
import { Switch } from '../ui/switch'

// Declaracoes globais de tipos do TypeScript para trackers
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
    clarity: (...args: any[]) => void
  }
}

const GA_ID = 'G-VCWEV5J2EH'
const CLARITY_ID = 'rxxywp7h0j'

const initGoogleAnalytics = () => {
  if (typeof window === 'undefined') return
  if (window.gtag) return // Evita duplicar inicializacao
  try {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', GA_ID)
  } catch (error) {
    console.error('Erro ao carregar o Google Analytics:', error)
  }
}

const initClarity = () => {
  if (typeof window === 'undefined') return
  if (window.clarity) return // Evita duplicar inicializacao
  try {
    (function(c, l, a, r, i, t, y) {
      c[a] = c[a] || function(...args) { (c[a].q = c[a].q || []).push(args) };
      t = l.createElement(r) as HTMLScriptElement;
      t.async = true;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode?.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID)
  } catch (error) {
    console.error('Erro ao carregar o Microsoft Clarity:', error)
  }
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [preferences, setPreferences] = useState({
    analytics: true,
    clarity: true
  })

  useEffect(() => {
    const consent = localStorage.getItem('estagionauta-cookie-consent')
    if (consent) {
      try {
        if (consent === 'accepted') {
          initGoogleAnalytics()
          if (import.meta.env.PROD) {
            initClarity()
          }
        } else if (consent === 'rejected') {
          // Apenas essenciais
        } else {
          const parsed = JSON.parse(consent)
          if (parsed.analytics) {
            initGoogleAnalytics()
          }
          if (parsed.clarity && import.meta.env.PROD) {
            initClarity()
          }
          setPreferences({
            analytics: !!parsed.analytics,
            clarity: !!parsed.clarity
          })
        }
      } catch (e) {
        // Se houver algum erro de parse de versoes anteriores, solicita consentimento novamente
        setShowBanner(true)
      }
    } else {
      setShowBanner(true)
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted = { analytics: true, clarity: true }
    localStorage.setItem('estagionauta-cookie-consent', JSON.stringify(allAccepted))
    setShowBanner(false)
    initGoogleAnalytics()
    if (import.meta.env.PROD) {
      initClarity()
    }
  }

  const handleReject = () => {
    const allRejected = { analytics: false, clarity: false }
    localStorage.setItem('estagionauta-cookie-consent', JSON.stringify(allRejected))
    setShowBanner(false)
  }

  const handleSaveCustom = () => {
    localStorage.setItem('estagionauta-cookie-consent', JSON.stringify(preferences))
    setShowBanner(false)
    if (preferences.analytics) {
      initGoogleAnalytics()
    }
    if (preferences.clarity && import.meta.env.PROD) {
      initClarity()
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[480px] bg-background/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 z-[100] animate-in fade-in slide-in-from-bottom-8 duration-300">
      <div className="flex gap-4">
        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center rounded-xl flex-shrink-0 mt-0.5">
          <Cookie className="h-5 w-5" />
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              Sua privacidade e controle
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Utilizamos cookies para personalizar sua experiência e coletar dados analíticos sobre o uso do site. Em conformidade com a LGPD, solicitamos seu consentimento para ativar esses cookies. Veja nossa{' '}
              <Link to="/privacy-policy" className="text-blue-600 hover:underline dark:text-blue-400 font-medium">
                Política de Privacidade
              </Link>.
            </p>
          </div>

          {isCustomizing && (
            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-3 animate-in fade-in slide-in-from-top-4 duration-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Configurações de Cookies
              </p>
              
              {/* Cookies Essenciais */}
              <div className="flex items-start justify-between gap-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">Cookies Essenciais</span>
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">Sempre ativo</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Necessários para o funcionamento do site, como autenticação de conta, segurança e salvamento de preferências (como chaves BYOK localmente).
                  </p>
                </div>
                <Switch checked={true} disabled={true} className="mt-1" />
              </div>

              {/* Google Analytics */}
              <div className="flex items-start justify-between gap-4 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground">Google Analytics</span>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Coleta dados estatísticos e anônimos sobre o uso das páginas (quais telas são acessadas, tempo de permanência) para podermos otimizar o site.
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(val) => setPreferences(prev => ({ ...prev, analytics: val }))}
                  className="mt-1"
                />
              </div>

              {/* Microsoft Clarity */}
              <div className="flex items-start justify-between gap-4 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground">Microsoft Clarity</span>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Serviço de análise de comportamento visual (como rolagem e cliques) e captura de erros/bugs de renderização na interface.
                  </p>
                </div>
                <Switch
                  checked={preferences.clarity}
                  onCheckedChange={(val) => setPreferences(prev => ({ ...prev, clarity: val }))}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-4">
            <button
              type="button"
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline flex items-center gap-1.5"
            >
              <Settings className="h-3.5 w-3.5" />
              {isCustomizing ? 'Ocultar opções' : 'Personalizar cookies'}
            </button>
            
            <div className="flex gap-2">
              {isCustomizing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    className="text-xs h-8 px-3"
                  >
                    Apenas Essenciais
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveCustom}
                    className="text-xs h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Salvar Seleção
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    className="text-xs h-8 px-3"
                  >
                    Recusar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    className="text-xs h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Aceitar Todos
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
