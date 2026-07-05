import { useState, useEffect, useRef } from 'react';
import { BrainCircuit, X, Send, Trash2, Loader2, Sparkles, User, AudioLines, Paperclip, Square, Globe, Phone, ArrowUpRight, CheckCircle } from 'lucide-react';
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
  const accumulatedTranscriptRef = useRef('');
  const currentTranscriptRef = useRef('');
  const shouldBeListeningRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const renderRichCard = (type: string, data: any, index: number) => {
    switch (type) {
      case 'agency':
        return (
          <div key={index} className="bg-card text-card-foreground border border-muted/70 rounded-xl p-4 shadow-sm flex flex-col gap-3 hover:border-violet-300 dark:hover:border-violet-900 transition-colors w-full">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h4 className="font-semibold text-sm text-foreground">{data.name}</h4>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  {data.city} - {data.state}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-1">
              {data.website && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(data.website, '_blank')}
                  className="text-[10px] h-7 bg-muted/20 hover:bg-muted text-foreground flex items-center gap-1 flex-1"
                >
                  <Globe className="w-3 h-3" />
                  Acessar Website
                </Button>
              )}
              {data.phone && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(`tel:${data.phone.replace(/\D/g, '')}`)}
                  className="text-[10px] h-7 bg-muted/20 hover:bg-muted text-foreground flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  Ligar
                </Button>
              )}
            </div>
          </div>
        );

      case 'candidatura':
        const statusColors: Record<string, string> = {
          interested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          test: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
          group_dynamics: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
          interview: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
          cultural_fit: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
          resource: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
          offer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-semibold border border-green-300 dark:border-green-800',
          hired: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
        const statusLabels: Record<string, string> = {
          interested: 'Interessado',
          applied: 'Candidatado',
          test: 'Teste Técnico',
          group_dynamics: 'Dinâmica de Grupo',
          interview: 'Entrevista',
          cultural_fit: 'Fit Cultural',
          resource: 'Recurso',
          offer: 'Proposta Recebida 🎉',
          hired: 'Contratado 🚀',
          rejected: 'Recusado',
        };
        return (
          <div key={index} className="bg-card text-card-foreground border border-muted/70 rounded-xl p-4 shadow-sm flex flex-col gap-2 hover:border-violet-300 dark:hover:border-violet-900 transition-colors w-full">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h4 className="font-semibold text-sm text-foreground">{data.position}</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">{data.company}</p>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full ${statusColors[data.status] || 'bg-muted text-muted-foreground'} shrink-0`}>
                {statusLabels[data.status] || data.status}
              </span>
            </div>

            <div className="mt-1 flex flex-col gap-1">
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>Progresso do Processo</span>
                <span>{data.progress}%</span>
              </div>
              <div className="w-full bg-muted dark:bg-muted/50 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500`}
                  style={{ width: `${data.progress}%` }}
                ></div>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                handleToggle();
                window.location.href = '/candidaturas';
              }}
              className="text-[10px] h-7 bg-muted/20 hover:bg-muted text-foreground flex items-center justify-center gap-1 mt-2"
            >
              <ArrowUpRight className="w-3 h-3" />
              Ver no Kanban
            </Button>
          </div>
        );

      case 'reminder':
        return (
          <div key={index} className="bg-card text-card-foreground border border-muted/70 rounded-xl p-4 shadow-sm flex flex-col gap-2 hover:border-violet-300 dark:hover:border-violet-900 transition-colors w-full">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5">
                <CheckCircle className={`w-4 h-4 ${data.completed ? 'text-green-500 fill-green-100 dark:fill-green-900/20' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-xs text-foreground leading-snug ${data.completed ? 'line-through text-muted-foreground' : ''}`}>{data.title}</h4>
                {data.description && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{data.description}</p>
                )}
                <p className="text-[9px] text-violet-600 dark:text-violet-400 font-semibold mt-1">
                  📅 {new Date(data.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                handleToggle();
                window.location.href = '/candidaturas';
              }}
              className="text-[10px] h-7 bg-muted/20 hover:bg-muted text-foreground flex items-center justify-center gap-1 mt-1"
            >
              Gerenciar Lembretes
            </Button>
          </div>
        );

      case 'task':
        return (
          <div key={index} className="bg-card text-card-foreground border border-muted/70 rounded-xl p-4 shadow-sm flex flex-col gap-2.5 hover:border-violet-300 dark:hover:border-violet-900 transition-colors w-full">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-foreground">{data.title}</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{data.description}</p>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 shrink-0`}>
                +{data.reward} créditos
              </span>
            </div>

            <div className="flex justify-between items-center gap-2 mt-1">
              <span className={`text-[9px] ${data.completed ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-muted-foreground'}`}>
                {data.completed ? (data.claimed ? 'Recompensa resgatada' : 'Pendente de resgate') : 'Em andamento'}
              </span>
              
              <Button 
                variant={data.completed && !data.claimed ? 'default' : 'outline'}
                size="sm" 
                onClick={async () => {
                  if (data.completed && !data.claimed) {
                    try {
                      await apiClient.post(`/api/rover/tasks/${data.key}/claim`);
                      toast.success(`Parabéns! Você resgatou +${data.reward} créditos!`);
                      loadHistory();
                    } catch (e) {
                      toast.error('Erro ao resgatar recompensa.');
                    }
                  } else {
                    handleToggle();
                    window.location.href = '/convide-amigos';
                  }
                }}
                disabled={data.claimed}
                className={`text-[10px] h-7 px-3 ${data.completed && !data.claimed ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-muted/20 hover:bg-muted text-foreground'}`}
              >
                {data.completed ? (data.claimed ? 'Concluído' : 'Resgatar') : 'Ir para Missão'}
              </Button>
            </div>
          </div>
        );

      case 'credits':
        return (
          <div key={index} className="bg-card text-card-foreground border border-muted/70 rounded-xl p-4 shadow-sm flex flex-col gap-3 hover:border-violet-300 dark:hover:border-violet-900 transition-colors w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                <Sparkles className="w-4 h-4 fill-violet-400 dark:fill-violet-800" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-muted-foreground block">Seu saldo atual de créditos</span>
                <span className="text-lg font-bold text-foreground leading-none">{data.balance} créditos</span>
              </div>
            </div>

            <Button 
              variant="default"
              size="sm" 
              onClick={() => {
                handleToggle();
                window.location.href = '/precos';
              }}
              className="text-[10px] h-7 bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-1 w-full"
            >
              Comprar Mais Créditos
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderMessageContent = (content: string) => {
    if (!content) return null;

    // Regex to split content by `<rover-card type="..." data="..." />` tags
    const regex = /<rover-card\s+type="([^"]+)"\s+data='([^']+)'\s*\/>/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    // Reset regex index
    regex.lastIndex = 0;

    while ((match = regex.exec(content)) !== null) {
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push({ type: 'text', content: textBefore });
      }

      const cardType = match[1];
      const cardDataRaw = match[2];
      try {
        const cardData = JSON.parse(cardDataRaw);
        parts.push({ type: 'card', cardType, data: cardData });
      } catch (err) {
        console.error('Failed to parse card data:', err, cardDataRaw);
        parts.push({ type: 'text', content: match[0] }); // Render raw tag if parse fails
      }

      lastIndex = regex.lastIndex;
    }

    const textAfter = content.substring(lastIndex);
    if (textAfter.trim()) {
      parts.push({ type: 'text', content: textAfter });
    }

    if (parts.length === 0) {
      return <div className="whitespace-pre-wrap bg-muted/60 dark:bg-muted/30 border border-muted/50 p-3 rounded-xl rounded-tl-none leading-relaxed text-foreground">{content}</div>;
    }

    return parts.map((part, index) => {
      if (part.type === 'text') {
        return (
          <div key={index} className="whitespace-pre-wrap bg-muted/60 dark:bg-muted/30 border border-muted/50 p-3 rounded-xl rounded-tl-none text-foreground leading-relaxed">
            {part.content.trim()}
          </div>
        );
      }

      // Render custom cards
      const { cardType, data } = part;
      return renderRichCard(cardType, data, index);
    });
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
      shouldBeListeningRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
      if (currentTranscriptRef.current.trim()) {
        handleSendMessage(currentTranscriptRef.current);
      }
      return;
    }

    // Auto-open drawer when starting to speak so the user sees the chat history
    if (!isWidgetOpen) {
      handleToggle();
    }

    shouldBeListeningRef.current = true;
    accumulatedTranscriptRef.current = '';
    currentTranscriptRef.current = '';
    setInputValue('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      const currentText = accumulatedTranscriptRef.current + transcript;
      setInputValue(currentText);
      currentTranscriptRef.current = currentText;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        toast.error("Acesso ao microfone negado. Por favor, ative a permissão de microfone nas configurações do seu navegador.");
        setIsListening(false);
        shouldBeListeningRef.current = false;
      } else if (event.error === 'network') {
        toast.error("Erro de rede no reconhecimento de voz. Certifique-se de estar conectado à internet ou tente utilizar o teclado caso seu navegador/bloqueador de anúncios impeça a conexão com os servidores de voz do Google.");
        setIsListening(false);
        shouldBeListeningRef.current = false;
      } else {
        console.warn(`Erro no reconhecimento de voz (não crítico): ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (shouldBeListeningRef.current) {
        try {
          accumulatedTranscriptRef.current = currentTranscriptRef.current;
          recognition.start();
        } catch (err) {
          console.warn("Erro ao reiniciar SpeechRecognition automaticamente:", err);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleInterrupt = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      toast.info("Geração do Rover interrompida.");
      // Add a small hint message to the chat indicating it was interrupted
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Geração interrompida pelo usuário.' }
      ]);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await apiClient.post<{ response?: string; error?: string; reason?: string; invalidates?: string[] }>(
        '/api/rover/message',
        { message: textToSend },
        { signal: controller.signal }
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
      if (err.name === 'AbortError') {
        // Request was aborted by user, ignore default error display
        return;
      }
      console.error('Error sending message to rover:', err);
      toast.error(err.message || 'Erro de conexão com o assistente.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erro de conexão com o assistente. Verifique sua conexão e tente novamente.' }
      ]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
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
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Agente Inteligente do Estagionauta</p>
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
                          className={`text-xs leading-relaxed ${msg.role === 'user'
                            ? 'p-3 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/10 rounded-tr-none whitespace-pre-wrap'
                            : 'bg-transparent border-0 text-foreground flex flex-col gap-2 rounded-tl-none p-0 w-full'
                            }`}
                        >
                          {msg.role === 'user' ? msg.content : renderMessageContent(msg.content)}
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
              disabled={isLoading}
              title="Anexar Arquivo"
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 hover:text-primary shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
              {isLoading ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInterrupt();
                  }}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-full px-4 py-2 text-xs font-bold shadow-md shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  Interromper
                </button>
              ) : isListening ? (
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
