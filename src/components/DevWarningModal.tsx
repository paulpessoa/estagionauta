import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export function DevWarningModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('dev-warning-dismissed')
      setOpen(!dismissed)
    }
  }, [])

  function handleClose() {
    setOpen(false)
    sessionStorage.setItem('dev-warning-dismissed', 'true')
  }

  if (!open) return null

  return (
    <div className="fixed inset-x-0 bottom-8 z-[100] flex justify-center items-end pointer-events-none">
      <div className="bg-yellow-50 dark:bg-yellow-950/80 border border-yellow-300 dark:border-yellow-800 rounded-xl shadow-xl px-6 py-4 flex items-center gap-4 max-w-lg w-full pointer-events-auto animate-in fade-in slide-in-from-bottom-8">
        <span className="text-yellow-900 dark:text-yellow-100 font-medium">
          ⚠️ Plataforma Estagionauta em desenvolvimento. Ainda estamos na fase beta! Algumas funcionalidades são apenas demonstrações para teste. Pode interagir, explorar e nos dar sugestões — sua participação é muito importante para nós. 💙
        </span>
        <button onClick={handleClose} className="ml-2 rounded-full p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900 transition-colors" aria-label="Fechar aviso">
          <X className="h-5 w-5 text-yellow-900 dark:text-yellow-100" />
        </button>
      </div>
    </div>
  )
} 