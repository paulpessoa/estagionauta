import { useState, useEffect, useRef } from 'react';
import { BrainCircuit, X, Send, Trash2, Loader2, Sparkles, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface RoverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RoverDrawer({ isOpen, onClose }: RoverDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await apiClient.get<{ messages: Message[] }>('/api/rover/history');
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error loading rover history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const data = await apiClient.post<{ response?: string; error?: string; reason?: string }>(
        '/api/rover/message',
        { message: textToSend }
      );

      if (data.error) {
        toast.error(data.error);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      if (data.response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response! }]);
      }
    } catch (err: any) {
      console.error('Error sending message to rover:', err);
      toast.error(err.message || 'Erro de conexão com o assistente.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Tem certeza que deseja apagar todo o histórico de conversas com o Rover?')) {
      return;
    }

    try {
      await apiClient.delete('/api/rover/clear');
      setMessages([]);
      toast.success('Histórico do Rover limpo com sucesso.');
    } catch (err) {
      console.error('Error clearing chat:', err);
      toast.error('Erro ao limpar histórico de conversa.');
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'profile':
        handleSendMessage('Por favor, verifique meu perfil.');
        break;
      case 'credits':
        handleSendMessage('Quantos créditos eu tenho?');
        break;
      case 'recess':
        handleSendMessage('Como faço para calcular meu recesso de estágio?');
        break;
      case 'resume':
        handleSendMessage('Pode analisar meu currículo por favor?');
        break;
      default:
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-background/90 backdrop-blur-lg border-l border-muted z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-muted/80 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-none flex items-center gap-1.5 text-foreground">
                    Rover
                    <span className="text-[10px] bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold px-1.5 py-0.5 rounded-full">BETA</span>
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Assistente Inteligente do Estagionauta</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button
                    onClick={handleClearChat}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                    title="Limpar histórico de conversa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-grow overflow-hidden relative flex flex-col bg-background/50">
              <ScrollArea className="flex-grow p-4">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Carregando histórico...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-6 flex flex-col gap-6 text-center max-w-sm mx-auto">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
                        <BrainCircuit className="h-7 w-7" />
                      </div>
                      <h4 className="font-bold text-md text-foreground">Olá, Estagionauta! 🚀</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Sou o Rover, seu assistente pessoal. Posso te ajudar a preencher seu perfil, simular entrevistas, tirar dúvidas sobre recesso, ou analisar seu currículo. O que deseja fazer hoje?
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5 text-left bg-muted/40 p-4 rounded-xl border border-muted/50">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Ações Rápidas</span>
                      <button
                        onClick={() => handleQuickAction('profile')}
                        className="text-xs font-semibold text-left p-2 rounded-lg bg-card hover:bg-muted border border-muted/30 transition-colors flex items-center justify-between"
                      >
                        <span>📋 Verificar integridade do perfil</span>
                        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                      </button>
                      <button
                        onClick={() => handleQuickAction('resume')}
                        className="text-xs font-semibold text-left p-2 rounded-lg bg-card hover:bg-muted border border-muted/30 transition-colors flex items-center justify-between"
                      >
                        <span>📊 Analisar meu currículo (Custo: 3 ⭐)</span>
                        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                      </button>
                      <button
                        onClick={() => handleQuickAction('recess')}
                        className="text-xs font-semibold text-left p-2 rounded-lg bg-card hover:bg-muted border border-muted/30 transition-colors flex items-center justify-between"
                      >
                        <span>📅 Calcular recesso de estágio</span>
                        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                      </button>
                      <button
                        onClick={() => handleQuickAction('credits')}
                        className="text-xs font-semibold text-left p-2 rounded-lg bg-card hover:bg-muted border border-muted/30 transition-colors flex items-center justify-between"
                      >
                        <span>💰 Consultar saldo de créditos</span>
                        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 py-2">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                          }`}
                      >
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${msg.role === 'user'
                            ? 'bg-violet-600 text-white'
                            : 'bg-muted border border-muted/80 text-muted-foreground'
                            }`}
                        >
                          {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <BrainCircuit className="h-3.5 w-3.5" />}
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                            ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/10 rounded-tr-none'
                            : 'bg-muted/60 dark:bg-muted/30 border border-muted/50 rounded-tl-none text-foreground'
                            }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-3 max-w-[80%] mr-auto">
                        <div className="h-7 w-7 rounded-full bg-muted border border-muted/80 flex items-center justify-center text-muted-foreground shrink-0">
                          <BrainCircuit className="h-3.5 w-3.5 animate-pulse" />
                        </div>
                        <div className="p-3 bg-muted/60 border border-muted/50 rounded-2xl rounded-tl-none flex items-center gap-1.5 h-9">
                          <div className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Quick buttons bar above input */}
            {messages.length > 0 && !isLoading && (
              <div className="px-4 py-2 border-t border-muted/40 overflow-x-auto flex gap-2 whitespace-nowrap bg-background/50 scrollbar-none">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('profile')}
                  className="text-[11px] h-7 bg-muted/30 hover:bg-muted border-muted/60"
                >
                  📋 Verificar Perfil
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('resume')}
                  className="text-[11px] h-7 bg-muted/30 hover:bg-muted border-muted/60"
                >
                  📊 Analisar Currículo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('recess')}
                  className="text-[11px] h-7 bg-muted/30 hover:bg-muted border-muted/60"
                >
                  📅 Calcular Recesso
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('credits')}
                  className="text-[11px] h-7 bg-muted/30 hover:bg-muted border-muted/60"
                >
                  💰 Consultar Saldo
                </Button>
              </div>
            )}

            {/* Chat Footer Input */}
            <div className="p-4 border-t border-muted/80 bg-muted/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Converse com o Rover..."
                  className="flex-grow bg-background/80 focus-visible:ring-violet-600"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shrink-0"
                  disabled={!inputValue.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
