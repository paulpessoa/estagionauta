import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { FileScan, LogIn, UserPlus } from "lucide-react"

interface AuthRequiredModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthRequiredModal({ isOpen, onClose }: AuthRequiredModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Autenticação Necessária
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Para acessar a análise de currículo com IA, você precisa estar autenticado.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex items-center justify-center space-x-4">
            <Button asChild className="w-full">
              <Link to="/login" onClick={onClose}>
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/cadastro" onClick={onClose}>
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 