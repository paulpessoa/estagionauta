
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { UserX, LogIn, UserPlus } from 'lucide-react'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
}

export function AuthModal({ 
  open, 
  onOpenChange, 
  title = "Login necessário",
  description = "Você precisa estar logado para acessar esta funcionalidade." 
}: AuthModalProps) {
  const navigate = useNavigate()

  const handleLogin = () => {
    onOpenChange(false)
    navigate('/login')
  }

  const handleSignup = () => {
    onOpenChange(false)
    navigate('/cadastro')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full">
            <UserX className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-3 mt-6">
          <Button onClick={handleLogin} className="w-full">
            <LogIn className="w-4 h-4 mr-2" />
            Fazer Login
          </Button>
          <Button onClick={handleSignup} variant="outline" className="w-full">
            <UserPlus className="w-4 h-4 mr-2" />
            Criar Conta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
