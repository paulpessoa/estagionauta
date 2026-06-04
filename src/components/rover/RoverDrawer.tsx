import { useState, useEffect, useRef } from 'react';
import { BrainCircuit, X, Send, Trash2, Loader2, Sparkles, User, AudioLines, Paperclip, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, type QueryDomain } from '@/lib/queryKeys';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface RoverDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function RoverDrawer({ isOpen, onClose }: RoverDrawerProps) {
  const queryClient = useQueryClient();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewportOffset, setViewportOffset] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isWidgetOpen = isOpen !== undefined ? isOpen : internalIsOpen;

  const expandCapsule = () => {
    setIsExpanded(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startCollapseTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (!isListening) {
        setIsExpanded(false);
      }
    }, 5000);
  };

  const handleCapsuleClick = (e: React.MouseEvent) => {
    if (!isWidgetOpen) {
      if (!isExpanded) {
        e.stopPropagation();
        setIsExpanded(true);
        startCollapseTimer();
      } else {
        handleToggle();
      }
    }
  };

  useEffect(() => {
    const handleOpenRover = () => {
      if (isOpen === undefined) {
        setInternalIsOpen(true);
      }
    };
    window.addEventListener('open-rover', handleOpenRover);
    return () => {
      window.removeEventListener('open-rover', handleOpenRover);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      const offset = window.innerHeight - vv.height;
      setViewportOffset(offset > 0 ? offset : 0);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  const handleAttachmentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fileInput = document.getElementById('rover-file-input');
    if (fileInput) {
      (fileInput as HTMLInputElement).click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`Arquivo "${file.name}" anexado! Envie a mensagem para o Rover analisá-lo.`);
      setInputValue((prev) => `${prev} [Arquivo: ${file.name}]`.trim());
      e.target.value = ''; // Reset file input value to allow selecting same file again
    }
  };

  useEffect(() => {
    if (isWidgetOpen) {
      loadHistory();
    }
  }, [isWidgetOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await apiClient.get<{ messages: Message[] }>('/api/rover/history');
      // Filter out tool-call messages that have null/empty content
      const visibleMessages = (data.messages || []).filter(
        (msg) => msg.content && msg.content.trim() !== ''
      );
      setMessages(visibleMessages);
    } catch (err) {
      console.error('Error loading rover history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggle = () => {
    if (isOpen !== undefined) {
      if (isWidgetOpen) {
        onClose?.();
      }
    } else {
      setInternalIsOpen((prev) => {
        const next = !prev;
        if (!next) {
          setIsExpanded(false);
        }
        return next;
      });
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    // Auto-open drawer when starting to speak so the user sees the chat history
    if (!isWidgetOpen) {
      handleToggle();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      if (speechResult.trim()) {
        handleSendMessage(speechResult);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      toast.error("Erro ao reconhecer voz. Tente novamente.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const data = await apiClient.post<{ response?: string; error?: string; reason?: string; invalidates?: string[] }>(
        '/api/rover/message',
        { message: textToSend }
      );

      if (data.error) {
        toast.error(data.error);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error! }
        ]);
        return;
      }

      if (data.response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response! }]);
      }

      if (data.invalidates && data.invalidates.length > 0) {
        data.invalidates.forEach((domain) => {
          const key = domain as QueryDomain;
          if (queryKeys[key]) {
            queryClient.invalidateQueries({ queryKey: queryKeys[key].all });
          }
        });
      }
    } catch (err: any) {
      console.error('Error sending message to rover:', err);
      toast.error(err.message || 'Erro de conexão com o assistente.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erro de conexão com o assistente. Verifique sua conexão e tente novamente.' }
      ]);
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
    <div
      className="fixed z-50 flex flex-col items-end right-4 left-4 sm:left-auto sm:right-6 transition-all duration-300"
      style={{ bottom: `calc(1.5rem + ${viewportOffset}px)` }}
    >
      <AnimatePresence>
        {/* Floating Chat Widget Popup */}
        {isWidgetOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-[calc(100vw-32px)] sm:w-[360px] h-[520px] sm:h-[580px] max-h-[70vh] bg-background border border-muted shadow-2xl rounded-xl overflow-hidden flex flex-col mb-4 z-50"
          >
            {/* Widget Header */}
            <div className="bg-gradient-to-br from-violet-600/10 via-purple-500/5 to-orange-500/5 dark:from-violet-950/20 dark:via-purple-950/10 dark:to-orange-950/10 border-b border-muted/50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Rover"
                  className="w-8 h-8 rounded-full border border-violet-200/50 object-contain"
                />
                <div>
                  <h3 className="font-bold text-sm leading-none flex items-center gap-1.5 text-foreground">
                    Rover AI
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
                  onClick={handleToggle}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Widget Body */}
            <div className="flex-grow overflow-hidden relative flex flex-col bg-background/50">
              <ScrollArea className="flex-grow p-4">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-20">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Carregando histórico...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col gap-6 text-center max-w-sm mx-auto h-full min-h-[400px] justify-between">
                    <div className="flex flex-col items-center gap-2 mt-6">
                      <h4 className="font-bold text-md text-foreground">Olá! Como posso ajudar?</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed px-4">
                        Sou o Rover, seu assistente pessoal. Posso te ajudar a preencher seu perfil, simular entrevistas, tirar dúvidas sobre recesso, ou analisar seu currículo.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 text-left bg-muted/40 p-4 rounded-xl border border-muted/50 my-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide px-1">Ações Rápidas</span>
                      <button
                        onClick={() => handleQuickAction('profile')}
                        className="text-xs font-semibold text-left p-2 rounded-lg bg-card hover:bg-muted border border-muted/30 transition-colors flex items-center justify-between group"
                      >
                        <span>Verificar integridade do perfil</span>
                        <Sparkles className="h-3.5 w-3.5 text-violet-500 group-hover:animate-pulse" />
                      </button>
                      <button
                        onClick={() => handleQuickAction('resume')}
                        className="text-xs font-semibold text-left p-2 rounded-lg bg-card hover:bg-muted border border-muted/30 transition-colors flex items-center justify-between group"
                      >
                        <span>Analisar meu currículo (Custo: 3 créditos)</span>
                        <Sparkles className="h-3.5 w-3.5 text-violet-500 group-hover:animate-pulse" />
                      </button>
                      <button
                        onClick={() => handleQuickAction('recess')}
                        className="text-xs font-semibold text-left p-2 rounded-lg bg-card hover:bg-muted border border-muted/30 transition-colors flex items-center justify-between group"
                      >
                        <span>Calcular recesso de estágio</span>
                        <Sparkles className="h-3.5 w-3.5 text-violet-500 group-hover:animate-pulse" />
                      </button>
                      <button
                        onClick={() => handleQuickAction('credits')}
                        className="text-xs font-semibold text-left p-2 rounded-lg bg-card hover:bg-muted border border-muted/30 transition-colors flex items-center justify-between group"
                      >
                        <span>Consultar saldo de créditos</span>
                        <Sparkles className="h-3.5 w-3.5 text-violet-500 group-hover:animate-pulse" />
                      </button>
                    </div>

                    {/* Cute Peeking Mascot at bottom */}
                    <div className="relative flex justify-center w-full overflow-hidden mt-auto -mb-4">
                      <img
                        src="/logo.png"
                        alt="Mascot Peeking"
                        className="w-20 h-20 object-contain translate-y-6 opacity-90 transition-transform duration-300 hover:translate-y-3"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 py-2">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold overflow-hidden ${msg.role === 'user'
                            ? 'bg-violet-600 text-white'
                            : 'bg-muted border border-muted/80 text-muted-foreground'
                            }`}
                        >
                          {msg.role === 'user' ? (
                            <User className="h-3.5 w-3.5" />
                          ) : (
                            <img src="/logo.png" className="h-full w-full object-contain rounded-full" />
                          )}
                        </div>
                        <div
                          className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                            ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/10 rounded-tr-none'
                            : 'bg-muted/60 dark:bg-muted/30 border border-muted/50 rounded-tl-none text-foreground'
                            }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-2.5 max-w-[80%] mr-auto">
                        <div className="h-7 w-7 rounded-full bg-muted border border-muted/80 flex items-center justify-center shrink-0 overflow-hidden">
                          <img src="/logo.png" className="h-full w-full object-contain rounded-full" />
                        </div>
                        <div className="p-3 bg-muted/60 border border-muted/50 rounded-xl rounded-tl-none flex items-center gap-1.5 h-9">
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
              <div className="px-4 py-2 border-t border-muted/40 overflow-x-auto flex gap-2 whitespace-nowrap bg-background/50 scrollbar-none shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('profile')}
                  className="text-[10px] h-6 bg-muted/30 hover:bg-muted border-muted/60 rounded-full px-3"
                >
                  Verificar Perfil
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('resume')}
                  className="text-[10px] h-6 bg-muted/30 hover:bg-muted border-muted/60 rounded-full px-3"
                >
                  Analisar Currículo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('recess')}
                  className="text-[10px] h-6 bg-muted/30 hover:bg-muted border-muted/60 rounded-full px-3"
                >
                  Calcular Recesso
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('credits')}
                  className="text-[10px] h-6 bg-muted/30 hover:bg-muted border-muted/60 rounded-full px-3"
                >
                  Consultar Saldo
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Capsule (Acts as Trigger when closed, and as Input when open) */}
      <div
        onMouseEnter={expandCapsule}
        onMouseLeave={startCollapseTimer}
        onClick={handleCapsuleClick}
        className={`h-14 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 shadow-xl rounded-full p-2 flex items-center transition-all duration-300 relative before:absolute before:-inset-0.5 before:bg-gradient-to-r before:from-violet-500/20 before:via-purple-500/20 before:to-orange-500/20 before:rounded-full before:blur-md before:opacity-75 before:-z-10 ${isWidgetOpen
          ? 'w-[calc(100vw-32px)] sm:w-[360px] pl-3 pr-2 gap-2'
          : (isExpanded || isListening)
            ? 'w-[calc(100vw-32px)] sm:w-[360px] pl-3 pr-2 gap-2 cursor-pointer shadow-2xl scale-[1.02]'
            : 'w-14 justify-center cursor-pointer hover:shadow-2xl hover:scale-[1.05]'
          }`}
      >
        {isWidgetOpen ? (
          <>
            {/* Circular paperclip attachment button on the left of input */}
            <button
              type="button"
              onClick={handleAttachmentClick}
              title="Anexar Arquivo"
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 hover:text-primary shrink-0 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex-grow flex items-center gap-2 h-full"
            >
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Pergunte ao Rover..."
                className="bg-transparent border-0 outline-none ring-0 focus:ring-0 text-sm flex-grow px-1 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                disabled={isLoading}
                autoFocus
              />
              {isListening ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startListening();
                  }}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full px-4 py-2 text-xs font-bold shadow-md shadow-red-500/20 transition-all hover:scale-105 active:scale-95 shrink-0 animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  STOP
                </button>
              ) : inputValue.trim() === '' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startListening();
                  }}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-full px-4 py-2 text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <AudioLines className="w-3.5 h-3.5" />
                  Falar
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-full px-4 py-2 text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
                  disabled={isLoading}
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar
                </button>
              )}
            </form>
          </>
        ) : (
          <>
            {/* Radar Pulse Effect */}
            {!isExpanded && !isListening && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 opacity-30 blur-sm animate-ping -z-10" />
            )}

            {/* Capsule Closed Trigger */}
            <motion.img
              src="/logo.png"
              alt="Rover Mascot"
              className="w-10 h-10 rounded-full object-contain shrink-0 border border-violet-100/50"
              animate={(!isExpanded && !isListening) ? {
                rotate: [0, -8, 8, -8, 8, 0],
                scale: [1, 1.05, 1.05, 1.05, 1.05, 1],
              } : {}}
              transition={(!isExpanded && !isListening) ? {
                duration: 1.2,
                repeat: Infinity,
                repeatDelay: 5,
                ease: "easeInOut",
              } : {}}
            />
            <AnimatePresence>
              {(isExpanded || isListening) && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between overflow-hidden flex-grow pl-1"
                >
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium select-none whitespace-nowrap">
                    Pergunte ao Rover
                  </span>
                  {isListening ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startListening();
                      }}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full px-4 py-2 text-xs font-bold shadow-md shadow-red-500/20 transition-all hover:scale-105 active:scale-95 shrink-0 animate-pulse"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      STOP
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startListening();
                      }}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-full px-4 py-2 text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
                    >
                      <AudioLines className="w-3.5 h-3.5" />
                      Falar
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <input
        type="file"
        id="rover-file-input"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
      />
    </div>
  );
}
