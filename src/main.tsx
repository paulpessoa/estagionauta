import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Função para carregar o script do Microsoft Clarity
const loadClarity = () => {
  // Verifica se 'window' está definido para garantir que o código seja executado apenas no navegador
  if (typeof window !== 'undefined') {
    (function(c,l,a,r,i,t,y){
      // Inicializa a fila de comandos do Clarity
      c[a]=c[a]||function(...args){(c[a].q=c[a].q||[]).push(args)};
      // Cria um novo elemento script
      t=l.createElement(r);
      // Define o carregamento assíncrono para não bloquear a renderização da página
      t.async=1;
      // Define a URL do script do Clarity com o ID do seu projeto
      t.src="https://www.clarity.ms/tag/"+i;
      // Encontra o primeiro script existente no documento
      y=l.getElementsByTagName(r)[0];
      // Insere o novo script antes do primeiro script existente
      y.parentNode!.insertBefore(t,y);
      })(window, document, "clarity", "script", "rxxywp7h0j"); // Substitua "SEU_PROJECT_ID_AQUI" pelo seu ID real do Clarity
  }
};

// Carrega o script do Clarity apenas em ambiente de produção
// import.meta.env.PROD é uma variável de ambiente fornecida pelo Vite
// que é 'true' em produção e 'false' em desenvolvimento
if (import.meta.env.PROD) {
  loadClarity();
}


createRoot(document.getElementById("root")!).render(<App />);
