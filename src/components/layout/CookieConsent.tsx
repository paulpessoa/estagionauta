import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

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

  useEffect(() => {
    const consent = localStorage.getItem('estagionauta-cookie-consent')
    if (consent === 'accepted') {
      initGoogleAnalytics()
      if (import.meta.env.PROD) {
        initClarity()
      }
    } else if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('estagionauta-cookie-consent', 'accepted')
    setShowBanner(false)
    initGoogleAnalytics()
    if (import.meta.env.PROD) {
      initClarity()
    }
  }

  const handleReject = () => {
    localStorage.setItem('estagionauta-cookie-consent', 'rejected')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[420px] bg-background/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-5 z-[100] animate-in fade-in slide-in-from-bottom-8 duration-300">
      <div className="flex gap-3">
        <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-foreground">Sua privacidade e controle</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Utilizamos ferramentas de análise (Google Analytics e Microsoft Clarity) para registrar o comportamento dos usuários e corrigir erros. Em conformidade com a LGPD, solicitamos seu consentimento para ativar esses cookies. Veja nossa{' '}
            <Link to="/privacy-policy" className="text-blue-600 hover:underline dark:text-blue-400">
              Política de Privacidade
            </Link>.
          </p>
          <div className="flex justify-end gap-2 pt-2">
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
              onClick={handleAccept}
              className="text-xs h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Aceitar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
