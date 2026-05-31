import { Link } from "react-router-dom"
import { Linkedin, Youtube, Github, Instagram } from "lucide-react"
import { toast } from "sonner"

export function Footer() {
  return (
    <footer className="border-t  bg-navy-950 text-slate-900 dark:text-white py-12 px-4">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row md:justify-between md:items-start gap-8">
        {/* Logo, descrição e redes sociais */}
        <div className="flex-1 min-w-[220px] flex flex-col items-center md:items-start mb-8 md:mb-0">
          <div className="flex items-center space-x-3 mb-4">
            <img
              src="/logo.png"
              alt="Estagionauta"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              Estagionauta
            </span>
          </div>
          <p className="text-slate-700 dark:text-white text-sm mb-4 text-center md:text-left max-w-xs">
            A plataforma completa para estudantes e estagiários decolarem suas
            carreiras.
          </p>
          <div className="flex space-x-4 mt-2 justify-center md:justify-start">
            <a
              href="https://www.linkedin.com/company/menvo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-6 w-6 hover:text-blue-400 transition-colors" />
            </a>
            {/* <a href="https://www.youtube.com/@estagionauta" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <Youtube className="h-6 w-6 hover:text-red-500 transition-colors" />
            </a> */}
            {/* <a href="https://github.com/paulpessoa/estagionauta" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="h-6 w-6 hover:text-gray-400 transition-colors" />
            </a> */}
            <a
              href="https://www.instagram.com/estagionauta"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <Instagram className="h-6 w-6 hover:text-pink-500 transition-colors" />
            </a>
          </div>
        </div>
        {/* Links */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">
              Produto
            </h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-white">
              <li>
                <Link to="/" className="hover:text-blue-400 transition-colors">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link
                  to="/precos"
                  className="hover:text-blue-400 transition-colors"
                >
                  Preços
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">
              Legal
            </h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-white">
              <li>
                <Link to="/termos-de-uso" className="hover:text-blue-400 transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-blue-400 transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">
              Suporte
            </h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-white">
              <li>
                <a href="https://wa.me/558199509777" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                  Contato (WhatsApp)
                </a>
              </li>
              <li>
                <Link to="/status" className="hover:text-blue-400 transition-colors">
                  Status do Sistema
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-navy-800 mt-8 pt-8 text-center text-sm text-slate-700 dark:text-white">
        <p>&copy; 2026 Estagionauta. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}
