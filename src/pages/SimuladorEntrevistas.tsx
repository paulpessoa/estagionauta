import { useState, useEffect, useRef } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiClient } from "@/lib/apiClient"
import type {
  InterviewSimulation,
  SimulatorMessage
} from "@/../shared/types/simulator"
import {
  MessageSquare,
  Video,
  Clock,
  Target,
  Users,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Send,
  Loader2,
  Award,
  BrainCircuit,
  Compass,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  History,
  Coins,
  PlusCircle,
  Trash2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Keyboard
} from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate, useParams } from "react-router-dom"
import { TypewriterText } from "@/components/simulator/TypewriterText"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
// supabase client removed – auth token handled by apiClient internally

export default function SimuladorEntrevistas() {
  const [currentView, setCurrentView] = useState<
    "history" | "setup" | "chat" | "feedback"
  >("history")
  const [simulations, setSimulations] = useState<InterviewSimulation[]>([])
  const [selectedSimulation, setSelectedSimulation] =
    useState<InterviewSimulation | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const navigate = useNavigate()
  const { id } = useParams()

  // Dialog State
  const [simulationToDelete, setSimulationToDelete] = useState<string | null>(
    null
  )

  // Setup Form
  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [interviewerType, setInterviewerType] = useState("behavioral")
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female')

  // Chat input
  const [answerInput, setAnswerInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Voice States
  const [isListening, setIsListening] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [preferredInputMode, setPreferredInputMode] = useState<"voice" | "text">("voice")
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice")
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "pt-BR"

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("")
          setAnswerInput(transcript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  const toggleListening = (e?: React.MouseEvent) => {
    e?.preventDefault()
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      
      // Auto-send if in voice mode and there's text
      if (inputMode === "voice" && answerInput.trim()) {
        handleSendAnswer(undefined, answerInput)
      }
    } else {
      if (recognitionRef.current) {
        // Stop speech synthesis and our custom audio if it's talking so we can listen clearly
        window.speechSynthesis?.cancel()
        if (audioRef.current) {
          audioRef.current.pause()
          setIsPlayingAudio(false)
        }
        setAnswerInput("")
        try {
          recognitionRef.current.start()
          setIsListening(true)
        } catch (e) {
          console.error("Erro ao iniciar gravação", e)
        }
      } else {
        toast.error("Reconhecimento de voz não suportado neste navegador.")
      }
    }
  }

  // voice: male = onyx, female = nova (default). Resolved from voiceGender state.
  const resolveVoice = (gender: 'male' | 'female') =>
    gender === 'male' ? 'onyx' : 'nova'

  const speakText = async (text: string, _isOnDemand = false) => {
    if (!isAudioEnabled) return

    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause()
      setIsPlayingAudio(false)
      return
    }

    window.speechSynthesis?.cancel()
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      // apiClient handles auth header internally
      const headers = await (apiClient as any).getHeaders(true) as Record<string, string>
      const response = await fetch(`${API_URL}/api/simulator/tts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, voice: resolveVoice(voiceGender) })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const audioUrl = URL.createObjectURL(blob)

      if (audioRef.current) audioRef.current.pause()

      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.onplay = () => setIsPlayingAudio(true)
      audio.onended = () => setIsPlayingAudio(false)
      audio.onpause = () => setIsPlayingAudio(false)

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          toast.error('O navegador bloqueou a reprodução. Clique na tela e tente novamente.')
        })
      }
    } catch (err: any) {
      console.error('TTS error:', err)
      toast.error(`Erro ao gerar voz: ${err.message || err}`)
    }
  }

  useEffect(() => {
    // Load voices on mount so they are available
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices()
    }
  }, [])

  useEffect(() => {
    loadHistory()
    loadCredits()
  }, [])

  // Handle routing based on URL ID and loaded simulations
  useEffect(() => {
    if (!id) {
      if (currentView !== "setup") {
        setCurrentView("history")
      }
      setSelectedSimulation(null)
    } else if (simulations.length > 0) {
      const found = simulations.find((s) => s.id === id)
      if (found) {
        setSelectedSimulation(found)
        setCurrentView(found.status === "completed" ? "feedback" : "chat")
      } else {
        toast.error("Simulação não encontrada.")
        navigate("/simulador-entrevistas")
      }
    }
  }, [id, simulations])

  useEffect(() => {
    if (currentView === "chat") {
      scrollToBottom()
    }
  }, [selectedSimulation?.messages, currentView])

  // Hide footer during active chat session
  useEffect(() => {
    if (currentView === "chat") {
      document.body.classList.add("hide-footer-inside-simulator")
    } else {
      document.body.classList.remove("hide-footer-inside-simulator")
    }
    return () => {
      document.body.classList.remove("hide-footer-inside-simulator")
    }
  }, [currentView])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<{ simulations: InterviewSimulation[] }>(
        "/api/simulator/history"
      )
      setSimulations(data.simulations)
    } catch (err) {
      console.error("Erro ao carregar histórico de simulações:", err)
      toast.error("Não foi possível carregar o histórico de simulações.")
    } finally {
      setLoading(false)
    }
  }

  const loadCredits = async () => {
    try {
      const data = await apiClient.get<{ credits: number }>("/api/credits")
      setUserCredits(data.credits)
    } catch (err) {
      console.error("Erro ao buscar créditos:", err)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleStartSimulation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobTitle.trim()) {
      toast.error("Por favor, informe o cargo pretendido.")
      return
    }

    if (userCredits !== null && userCredits <= 0) {
      toast.error("Créditos insuficientes para iniciar uma nova simulação.")
      return
    }

    setActionLoading(true)
    try {
      const data = await apiClient.post<{ simulation: InterviewSimulation }>(
        "/api/simulator/start",
        {
          job_title: jobTitle,
          job_description: jobDescription || undefined,
          interviewer_type: interviewerType
        }
      )
      setSimulations((prev) => [data.simulation, ...prev])
      setSelectedSimulation(data.simulation)
      setCurrentView("chat")
      setUserCredits((prev) => (prev !== null ? prev - 1 : null))
      toast.success("Simulação iniciada! 1 crédito consumido.")

      // Update URL to match new simulation
      navigate(`/simulador-entrevistas/${data.simulation.id}`)
      
      setInputMode(preferredInputMode)

      const lastMsg =
        data.simulation.messages[data.simulation.messages.length - 1]
      if (lastMsg && lastMsg.role === "interviewer") {
        if (preferredInputMode === "voice") {
          speakText(lastMsg.content, false)
        }
      }
    } catch (err: any) {
      console.error("Erro ao iniciar simulação:", err)
      toast.error(err.message || "Erro ao iniciar simulação.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendAnswer = async (e?: React.FormEvent, overrideAnswer?: string) => {
    e?.preventDefault()
    const finalAnswer = overrideAnswer !== undefined ? overrideAnswer : answerInput
    if (!finalAnswer.trim() || !selectedSimulation) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }

    setAnswerInput("")
    setActionLoading(true)

    // Add local candidate response message immediately to user UI for responsiveness
    const optimisticMessage: SimulatorMessage = {
      role: "candidate",
      content: finalAnswer,
      timestamp: new Date().toISOString()
    }

    setSelectedSimulation((prev) => {
      if (!prev) return null
      return {
        ...prev,
        messages: [...prev.messages, optimisticMessage]
      }
    })

    try {
      const data = await apiClient.post<{ simulation: InterviewSimulation }>(
        `/api/simulator/${selectedSimulation.id}/answer`,
        { answer: finalAnswer }
      )

      setSelectedSimulation(data.simulation)
      setSimulations((prev) =>
        prev.map((s) => (s.id === data.simulation.id ? data.simulation : s))
      )

      if (data.simulation.status === "completed") {
        setCurrentView("feedback")
        toast.success("Simulação concluída! Relatório de feedback gerado.")
        loadHistory() // Refresh history table
      } else {
        const lastMsg =
          data.simulation.messages[data.simulation.messages.length - 1]
        if (lastMsg && lastMsg.role === "interviewer") {
          if (inputMode === "voice") {
            speakText(lastMsg.content, false)
          }
        }
      }
    } catch (err: any) {
      console.error("Erro ao enviar resposta:", err)
      toast.error(err.message || "Não foi possível enviar a resposta.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleEndInterviewEarly = async () => {
    if (!selectedSimulation) return
    setActionLoading(true)
    try {
      const data = await apiClient.post<{ simulation: InterviewSimulation }>(
        `/api/simulator/${selectedSimulation.id}/end`
      )
      setSelectedSimulation(data.simulation)
      setSimulations((prev) =>
        prev.map((s) => (s.id === data.simulation.id ? data.simulation : s))
      )
      setCurrentView("feedback")
      toast.success("Simulação concluída! Relatório de feedback gerado.")
      loadHistory()
    } catch (err: any) {
      console.error("Erro ao encerrar simulação:", err)
      toast.error(err.message || "Não foi possível encerrar a simulação.")
    } finally {
      setActionLoading(false)
    }
  }

  const confirmDeleteSimulation = async () => {
    if (!simulationToDelete) return
    try {
      await apiClient.delete(`/api/simulator/${simulationToDelete}`)
      toast.success("Simulação excluída com sucesso!")
      loadHistory()
    } catch (err: any) {
      console.error("Erro ao excluir simulação:", err)
      toast.error("Não foi possível excluir a simulação.")
    } finally {
      setSimulationToDelete(null)
    }
  }

  const handleDeleteSimulation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSimulationToDelete(id)
  }

  const handleViewDetails = (simulation: InterviewSimulation) => {
    navigate(`/simulador-entrevistas/${simulation.id}`)
  }

  const getInterviewerBadge = (type: string) => {
    switch (type) {
      case "tech":
        return <Badge className="bg-blue-600 hover:bg-blue-700">Técnico</Badge>
      case "behavioral":
        return (
          <Badge className="bg-purple-600 hover:bg-purple-700">
            Comportamental
          </Badge>
        )
      case "hard":
        return <Badge className="bg-red-600 hover:bg-red-700">Desafiador</Badge>
      case "friendly":
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700">
            Amigável
          </Badge>
        )
      default:
        return <Badge variant="secondary">Entrevistador</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80)
      return "text-emerald-500 border-emerald-500/20 bg-emerald-500/10"
    if (score >= 60) return "text-amber-500 border-amber-500/20 bg-amber-500/10"
    return "text-red-500 border-red-500/20 bg-red-500/10"
  }

  // Count candidate answers
  const getProgressCount = () => {
    if (!selectedSimulation) return 0
    return selectedSimulation.messages.filter((m) => m.role === "candidate")
      .length
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* VIEW 1: HISTORY DASHBOARD */}
          {currentView === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
                    Simulador de Entrevistas
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Pratique entrevistas realistas com inteligência artificial e
                    receba avaliações detalhadas para se destacar no mercado.
                  </p>
                </div>

                <Button
                  onClick={() => {
                    navigate("/simulador-entrevistas")
                    setJobTitle("")
                    setJobDescription("")
                    setInterviewerType("behavioral")
                    setCurrentView("setup")
                  }}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-md shadow-violet-500/10"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Nova Simulação
                </Button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
                  <p className="text-muted-foreground text-sm">
                    Carregando histórico de entrevistas...
                  </p>
                </div>
              ) : simulations.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-muted rounded-2xl max-w-md mx-auto space-y-4">
                  <div className="h-12 w-12 bg-violet-100 dark:bg-violet-950/30 rounded-full flex items-center justify-center mx-auto">
                    <BrainCircuit className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-lg font-medium">
                    Nenhuma entrevista realizada
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Você ainda não possui simulações ativas ou concluídas.
                    Comece uma agora mesmo para testar suas habilidades!
                  </p>
                  <Button
                    onClick={() => setCurrentView("setup")}
                    variant="outline"
                  >
                    Começar Primeira Simulação
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {simulations.map((sim) => (
                    <Card
                      key={sim.id}
                      className="group overflow-hidden border border-muted hover:border-violet-500/30 transition-all duration-300 shadow-sm hover:shadow-md bg-card/60 backdrop-blur-sm"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getInterviewerBadge(sim.interviewer_type)}
                            {sim.status === "completed" ? (
                              <Badge
                                variant="outline"
                                className={`px-2 py-0.5 border font-semibold ${getScoreColor(sim.feedback?.score || 0)}`}
                              >
                                Score: {sim.feedback?.score}%
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                Em Andamento
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-red-500 z-10"
                            onClick={(e) => handleDeleteSimulation(sim.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardTitle className="line-clamp-1 text-lg group-hover:text-violet-500 transition-colors">
                          {sim.job_title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 text-xs">
                          <Clock className="h-3 w-3" />
                          {new Date(sim.created_at).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            }
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4 text-sm text-muted-foreground">
                        <p className="line-clamp-2">
                          {sim.job_description ||
                            "Sem descrição detalhada da vaga."}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0 border-t border-muted/50 bg-muted/10 px-6 py-3 flex justify-between items-center group-hover:bg-violet-500/5 transition-colors">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {sim.messages.length} mensagens
                        </span>
                        <Button
                          onClick={() => handleViewDetails(sim)}
                          variant="ghost"
                          size="sm"
                          className="group-hover:text-violet-500 flex items-center gap-1.5 p-0 hover:bg-transparent font-medium"
                        >
                          {sim.status === "completed"
                            ? "Ver Feedback"
                            : "Continuar"}{" "}
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW 2: SETUP CONFIGURATION FORM */}
          {currentView === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <Button
                onClick={() => {
                  navigate("/simulador-entrevistas")
                  setCurrentView("history")
                }}
                variant="ghost"
                className="mb-6 hover:bg-muted"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao histórico
              </Button>

              <Card className="border border-muted bg-card/70 backdrop-blur-sm shadow-xl">
                <CardHeader className="border-b border-muted/50 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-violet-100 dark:bg-violet-950/40 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Configurar Nova Entrevista
                      </CardTitle>
                      <CardDescription>
                        Defina as informações da vaga para a IA personalizar as
                        perguntas.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <form onSubmit={handleStartSimulation}>
                  <CardContent className="space-y-6 pt-6">
                    {/* Job Title */}
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Cargo Pretendido *</Label>
                      <Input
                        id="jobTitle"
                        placeholder="Ex: Desenvolvedor Front-end React Sênior, Analista de Marketing, etc."
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        required
                        className="border-muted focus-visible:ring-violet-500"
                      />
                    </div>

                    {/* Job Description */}
                    <div className="space-y-2">
                      <Label htmlFor="jobDescription">
                        Descrição da Vaga / Requisitos (Opcional)
                      </Label>
                      <Textarea
                        id="jobDescription"
                        placeholder="Cole aqui a descrição completa da vaga para que o entrevistador faça perguntas altamente alinhadas com os requisitos técnicos."
                        rows={5}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="border-muted focus-visible:ring-violet-500 resize-y"
                      />
                    </div>

                    {/* Interviewer Type Selection */}
                    <div className="space-y-3">
                      <Label>Perfil do Entrevistador</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Behavioral */}
                        <div
                          onClick={() => setInterviewerType("behavioral")}
                          className={`flex gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            interviewerType === "behavioral"
                              ? "border-violet-500 bg-violet-500/5 dark:bg-violet-500/10"
                              : "border-muted hover:border-violet-500/20 hover:bg-muted/10"
                          }`}
                        >
                          <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              Recursos Humanos (Comportamental)
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Soft skills, inteligência emocional e valores.
                            </p>
                          </div>
                        </div>

                        {/* Technical */}
                        <div
                          onClick={() => setInterviewerType("tech")}
                          className={`flex gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            interviewerType === "tech"
                              ? "border-violet-500 bg-violet-500/5 dark:bg-violet-500/10"
                              : "border-muted hover:border-violet-500/20 hover:bg-muted/10"
                          }`}
                        >
                          <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <Compass className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              Líder Técnico (Hard Skills)
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Arquitetura de sistemas, conceitos fundamentais e
                              código.
                            </p>
                          </div>
                        </div>

                        {/* Hard/Intimidating */}
                        <div
                          onClick={() => setInterviewerType("hard")}
                          className={`flex gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            interviewerType === "hard"
                              ? "border-violet-500 bg-violet-500/5 dark:bg-violet-500/10"
                              : "border-muted hover:border-violet-500/20 hover:bg-muted/10"
                          }`}
                        >
                          <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                            <Target className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              Diretor / Desafiador
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Perguntas sob pressão, tomada de decisão e
                              raciocínio crítico.
                            </p>
                          </div>
                        </div>

                        {/* Friendly */}
                        <div
                          onClick={() => setInterviewerType("friendly")}
                          className={`flex gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            interviewerType === "friendly"
                              ? "border-violet-500 bg-violet-500/5 dark:bg-violet-500/10"
                              : "border-muted hover:border-violet-500/20 hover:bg-muted/10"
                          }`}
                        >
                          <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              Colega de Equipe (Amigável)
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Papo leve, integração de equipe e conversação
                              fluida.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interaction Mode Selection */}
                    <div className="space-y-3">
                      <Label>Modo de Interação</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => setPreferredInputMode('voice')}
                          className={`flex gap-3 items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            preferredInputMode === 'voice'
                              ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10'
                              : 'border-muted hover:border-violet-500/20 hover:bg-muted/10'
                          }`}
                        >
                          <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                            <Mic className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Voz (Ligação)</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Fale naturalmente</p>
                          </div>
                        </div>
                        <div
                          onClick={() => setPreferredInputMode('text')}
                          className={`flex gap-3 items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            preferredInputMode === 'text'
                              ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10'
                              : 'border-muted hover:border-violet-500/20 hover:bg-muted/10'
                          }`}
                        >
                          <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                            <Keyboard className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Texto (Chat)</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Digite as respostas</p>
                          </div>
                        </div>
                      </div>
                      
                      {preferredInputMode === 'voice' && (
                        <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <p>
                            <strong>Dica para Captação de Áudio:</strong> O modo voz usa o sistema nativo do seu dispositivo. Fale de forma clara, perto do microfone e em ambiente sem ruídos. Algumas palavras complexas podem ser compreendidas incorretamente, isso é normal em sistemas de ditado nativo.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Voice Gender Selection */}
                    <div className="space-y-3">
                      <Label>Voz do Entrevistador</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => setVoiceGender('female')}
                          className={`flex gap-3 items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            voiceGender === 'female'
                              ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10'
                              : 'border-muted hover:border-violet-500/20 hover:bg-muted/10'
                          }`}
                        >
                          <div className="h-9 w-9 rounded-lg bg-pink-100 dark:bg-pink-950/30 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                            <Mic className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Feminina</p>
                            <p className="text-xs text-muted-foreground">Voz Nova (OpenAI)</p>
                          </div>
                        </div>
                        <div
                          onClick={() => setVoiceGender('male')}
                          className={`flex gap-3 items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            voiceGender === 'male'
                              ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10'
                              : 'border-muted hover:border-violet-500/20 hover:bg-muted/10'
                          }`}
                        >
                          <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <Mic className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Masculina</p>
                            <p className="text-xs text-muted-foreground">Voz Onyx (OpenAI)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="border-t border-muted/50 bg-muted/10 px-6 py-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-violet-500" />
                      Custo: 1 crédito
                    </span>
                    <Button
                      type="submit"
                      disabled={actionLoading}
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Iniciando simulação...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" /> Iniciar
                          Entrevista
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </motion.div>
          )}

          {/* VIEW 3: INTERACTIVE CHAT ENVIRONMENT */}
          {currentView === "chat" && selectedSimulation && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col max-w-4xl mx-auto h-[80vh] border border-muted bg-card/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Chat Header */}
              <div className="sticky top-14 z-50 px-6 py-4 border-b border-muted/60 flex items-center justify-between bg-muted/10 backdrop-blur-md bg-background/80">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => {
                      navigate("/simulador-entrevistas")
                    }}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted rounded-full"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAudioEnabled(!isAudioEnabled)
                      if (isAudioEnabled) {
                        window.speechSynthesis?.cancel()
                        if (audioRef.current) {
                          audioRef.current.pause()
                          setIsPlayingAudio(false)
                        }
                      }
                    }}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted rounded-full text-muted-foreground"
                    title={
                      isAudioEnabled
                        ? "Desativar voz do entrevistador"
                        : "Ativar voz do entrevistador"
                    }
                  >
                    {isAudioEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-md leading-none">
                        {selectedSimulation.job_title}
                      </h2>
                      {getInterviewerBadge(selectedSimulation.interviewer_type)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Simulador de Entrevista de Emprego com IA
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    Perguntas Respondidas:
                  </span>
                  <Badge variant="secondary" className="px-2 py-0.5 font-bold">
                    {getProgressCount()} / 20
                  </Badge>
                </div>
              </div>

              {/* Chat Messages Body or Immersive Voice Call */}
              {inputMode === "text" ? (
                <ScrollArea className="flex-1 px-6 py-4 bg-muted/5">
                  <div className="space-y-6">
                  {/* Information Header card */}
                  <div className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl text-xs text-violet-600 dark:text-violet-400 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <BrainCircuit className="h-3.5 w-3.5" /> Dicas Rápidas:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                      <li>
                        Dê respostas completas e explicativas, trazendo exemplos
                        reais de suas vivências passadas.
                      </li>
                      <li>
                        A entrevista pode durar até 20 rodadas de perguntas e
                        respostas.
                      </li>
                      <li>
                        A partir da 5ª pergunta respondida, você poderá encerrar
                        a simulação a qualquer momento para gerar seu feedback.
                      </li>
                    </ul>
                  </div>

                  {/* Render Messages */}
                  {selectedSimulation.messages.map((msg, idx) => {
                    const isInterviewer = msg.role === "interviewer"
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${isInterviewer ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`flex gap-3 max-w-[85%] ${isInterviewer ? "flex-row" : "flex-row-reverse"}`}
                        >
                          {/* Avatar */}
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs shrink-0 select-none overflow-hidden ${
                              isInterviewer
                                ? "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 font-bold"
                                : "bg-indigo-600 text-white font-medium"
                            }`}
                          >
                            {isInterviewer ? (
                              <img src="/logo.png" alt="IA" className="h-5 w-auto object-contain" />
                            ) : "VC"}
                          </div>

                          {/* Text bubble */}
                          <div
                            className={`relative p-4 rounded-2xl shadow-sm text-sm border group ${
                              isInterviewer
                                ? "bg-card border-muted rounded-tl-none text-foreground"
                                : "bg-indigo-600 border-indigo-700 rounded-tr-none text-white"
                            }`}
                          >
                            {isInterviewer && (
                              <button
                                onClick={() => speakText(msg.content, true)}
                                className="absolute -right-10 top-2 p-1.5 text-muted-foreground hover:text-violet-600 hover:bg-violet-100 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                title="Ouvir reposta"
                              >
                                <Volume2 className="h-4 w-4" />
                              </button>
                            )}
                            {isInterviewer &&
                            idx === selectedSimulation.messages.length - 1 ? (
                              <TypewriterText text={msg.content} speed={20} />
                            ) : (
                              <p className="whitespace-pre-line leading-relaxed">
                                {msg.content}
                              </p>
                            )}
                            <span
                              className={`block text-[10px] mt-2 text-right ${isInterviewer ? "text-muted-foreground" : "text-indigo-200"}`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString(
                                "pt-BR",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}

                  {/* Typing status indicator */}
                  {actionLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-3 max-w-[80%]">
                        <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center text-xs overflow-hidden">
                          <img src="/logo.png" alt="IA" className="h-5 w-auto object-contain" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-card border border-muted rounded-tl-none flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Entrevistador está analisando e elaborando
                            pergunta...
                          </span>
                          <div className="flex gap-1">
                            <span
                              className="h-1.5 w-1.5 bg-violet-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <span
                              className="h-1.5 w-1.5 bg-violet-500 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <span
                              className="h-1.5 w-1.5 bg-violet-500 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-muted/5 relative overflow-hidden">
                   <div className="flex flex-col items-center gap-8 z-10">
                     <div className={`relative h-40 w-40 rounded-full flex items-center justify-center bg-violet-100 shadow-2xl transition-all duration-500 ${isPlayingAudio ? 'ring-[16px] ring-violet-500/20 scale-105' : isListening ? 'ring-[16px] ring-red-500/20 scale-105' : 'ring-8 ring-muted/50'}`}>
                       <img src="/logo.png" alt="IA" className={`h-20 w-auto object-contain transition-transform duration-700 ${isPlayingAudio ? 'scale-110' : ''}`} />
                     </div>
                     <div className="text-center max-w-sm px-4">
                       <h3 className="text-2xl font-bold text-foreground">
                         {actionLoading ? "Pensando..." : isPlayingAudio ? "Entrevistador Falando" : isListening ? "Ouvindo Você..." : "Sua Vez"}
                       </h3>
                       <p className="text-sm text-muted-foreground mt-2">
                         {actionLoading ? "Aguarde a IA formular a próxima pergunta" : isPlayingAudio ? "Ouça a pergunta com atenção" : isListening ? (answerInput || "Pode falar, estou captando seu áudio...") : "Toque no microfone abaixo para responder"}
                       </p>
                     </div>
                   </div>
                   
                   {/* Background animated rings when active */}
                   {(isPlayingAudio || isListening) && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                        <div className={`absolute h-72 w-72 rounded-full border border-current animate-ping ${isListening ? 'text-red-500/30' : 'text-violet-500/30'}`} style={{ animationDuration: '3s' }} />
                        <div className={`absolute h-96 w-96 rounded-full border border-current animate-ping ${isListening ? 'text-red-500/20' : 'text-violet-500/20'}`} style={{ animationDuration: '4s', animationDelay: '1s' }} />
                      </div>
                   )}
                </div>
              )}

              {/* Visualizer for audio recording/playback (Text Mode only) */}
              <AnimatePresence>
                {(isListening || isPlayingAudio) && inputMode === "text" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-muted/10 border-t border-muted/60 overflow-hidden"
                  >
                    <div className="flex items-center justify-center gap-1.5 py-4">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: ["8px", "24px", "8px"]
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: "easeInOut"
                          }}
                          className={`w-1.5 rounded-full ${isListening ? "bg-red-400" : "bg-violet-400"}`}
                        />
                      ))}
                      <span className="ml-3 text-xs text-muted-foreground font-medium animate-pulse">
                        {isListening
                          ? "Ouvindo você..."
                          : "Entrevistador falando..."}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Input Footer Form */}
               <div className="p-4 border-t border-muted/60 bg-muted/5 flex flex-col items-center w-full bg-background/95">
                {getProgressCount() === 19 && (
                  <div className="w-full mb-3 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Esta é a última pergunta! Responda com atenção para que a IA gere seu relatório de feedback final.</span>
                  </div>
                )}
                {getProgressCount() >= 5 && (
                  <div className="w-full mb-3 flex items-center justify-between p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl text-xs">
                    <span className="text-muted-foreground">
                      Você já respondeu a {getProgressCount()} perguntas. Já pode encerrar a entrevista e gerar seu relatório se desejar.
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={actionLoading}
                      onClick={handleEndInterviewEarly}
                      className="border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 h-8 text-xs font-semibold shrink-0"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        "Encerrar Entrevista"
                      )}
                    </Button>
                  </div>
                )}
                <form
                  onSubmit={handleSendAnswer}
                  className="w-full flex items-center justify-center gap-3"
                >
                  {inputMode === "voice" ? (
                    <div className="w-full flex flex-col items-center gap-3">
                      <div className="flex items-center gap-4">
                        {/* Keyboard switch */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-muted-foreground flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted"
                          onClick={() => setInputMode("text")}
                          title="Responder por Texto"
                        >
                          <Keyboard className="h-4 w-4" />
                          <span className="text-xs font-medium">Modo Texto</span>
                        </Button>

                        {/* Main Mic Button */}
                        <Button
                          type="button"
                          onClick={toggleListening}
                          disabled={actionLoading}
                          className={`h-16 w-16 rounded-full shadow-lg transition-all ${
                            isListening
                              ? "bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/30 text-white"
                              : "bg-violet-600 hover:bg-violet-700 text-white"
                          }`}
                          title={
                            isListening ? "Parar gravação" : "Tocar para falar"
                          }
                        >
                          {isListening ? (
                            <div className="h-4 w-4 bg-white rounded-sm" /> // Stop icon
                          ) : (
                            <Mic className="h-6 w-6" />
                          )}
                        </Button>

                        {/* Send Button (only appears if there's text captured) */}
                        <AnimatePresence>
                          {answerInput.trim() && !isListening && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <Button
                                type="submit"
                                disabled={actionLoading}
                                className="h-12 w-12 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
                                title="Enviar resposta"
                              >
                                <Send className="h-5 w-5" />
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setInputMode("voice")
                          setIsListening(false)
                        }}
                        className="px-3 text-muted-foreground flex items-center gap-1.5 hover:bg-muted"
                        title="Responder por Voz"
                      >
                        <Mic className="h-4 w-4" />
                        <span className="text-xs font-medium">Modo Voz</span>
                      </Button>
                      <Input
                        placeholder="Escreva sua resposta para o entrevistador..."
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        disabled={actionLoading}
                        className="flex-1 border-muted focus-visible:ring-violet-500 bg-card/80"
                        required
                      />
                      <Button
                        type="submit"
                        disabled={actionLoading || !answerInput.trim()}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-5 shadow-sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          )}

          {/* VIEW 4: PERFORMANCE FEEDBACK REPORT */}
          {currentView === "feedback" &&
            selectedSimulation &&
            selectedSimulation.feedback && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* Header toolbar */}
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => {
                      navigate("/simulador-entrevistas")
                    }}
                    variant="ghost"
                    className="hover:bg-muted"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao histórico
                  </Button>

                  <Badge
                    variant="outline"
                    className="px-3 py-1.5 flex items-center gap-1.5 border-violet-500/20 bg-violet-500/5"
                  >
                    <Award className="h-4 w-4 text-violet-500" />
                    <span className="font-semibold text-violet-600 dark:text-violet-400">
                      Simulação Finalizada
                    </span>
                  </Badge>
                </div>

                {/* Top Score Banner Card */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Score panel */}
                  <Card className="border border-muted bg-card/60 backdrop-blur-sm md:col-span-1 flex flex-col justify-center items-center p-6 text-center shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Resultado Geral</CardTitle>
                      <CardDescription>
                        Avaliação da performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-4">
                      {/* Score circle gauge */}
                      <div className="relative h-36 w-36 flex items-center justify-center rounded-full border-4 border-muted">
                        <div className="text-center">
                          <span className="text-4xl font-extrabold bg-gradient-to-br from-foreground to-muted-foreground">
                            {selectedSimulation.feedback.score}
                          </span>
                          <span className="text-sm font-semibold text-muted-foreground block mt-0.5">
                            / 100
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Badge
                        variant="outline"
                        className={`font-semibold ${getScoreColor(selectedSimulation.feedback.score)}`}
                      >
                        {selectedSimulation.feedback.score >= 80
                          ? "Excelente Performance"
                          : selectedSimulation.feedback.score >= 60
                            ? "Bom Desempenho"
                            : "Precisa de Foco"}
                      </Badge>
                    </CardFooter>
                  </Card>

                  {/* General details panel */}
                  <Card className="border border-muted bg-card/60 backdrop-blur-sm md:col-span-2 shadow-lg relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">
                          {selectedSimulation.job_title}
                        </CardTitle>
                        {getInterviewerBadge(
                          selectedSimulation.interviewer_type
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-1.5 text-xs mt-1">
                        <Clock className="h-3 w-3" />
                        Simulado em{" "}
                        {new Date(
                          selectedSimulation.created_at
                        ).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">
                          Vaga Alvo / Contexto:
                        </h4>
                        <p className="text-muted-foreground line-clamp-3">
                          {selectedSimulation.job_description ||
                            "Nenhum requisito adicional fornecido."}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-muted/50 bg-muted/5 py-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4 text-violet-500" /> {selectedSimulation.messages.filter((m) => m.role === "candidate").length} perguntas respondidas
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />{" "}
                        Feedback estruturado pela IA
                      </span>
                    </CardFooter>
                  </Card>
                </div>

                {/* Strengths & Improvements Lists */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Strengths Card */}
                  <Card className="border border-muted bg-card/60 backdrop-blur-sm shadow-md">
                    <CardHeader className="pb-3 border-b border-muted/50 bg-emerald-500/5">
                      <CardTitle className="text-md font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" /> Pontos Fortes
                        demonstrados
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <ul className="space-y-3.5">
                        {selectedSimulation.feedback.strengths.map(
                          (item, index) => (
                            <li
                              key={index}
                              className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed"
                            >
                              <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <p>{item}</p>
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Improvements Card */}
                  <Card className="border border-muted bg-card/60 backdrop-blur-sm shadow-md">
                    <CardHeader className="pb-3 border-b border-muted/50 bg-amber-500/5">
                      <CardTitle className="text-md font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" /> Áreas de Melhoria
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <ul className="space-y-3.5">
                        {selectedSimulation.feedback.improvements.map(
                          (item, index) => (
                            <li
                              key={index}
                              className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed"
                            >
                              <span className="h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <p>{item}</p>
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Executive Tips and Study Guide */}
                <Card className="border border-muted bg-card/60 backdrop-blur-sm shadow-md">
                  <CardHeader className="border-b border-muted/50 bg-violet-500/5">
                    <CardTitle className="text-md font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" /> Guia de Estudo e Plano de
                      Resposta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {selectedSimulation.feedback.tips}
                  </CardContent>
                </Card>

                {/* MENVO Promo Card */}
                <Card className="border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b from-indigo-500 to-violet-500" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 animate-pulse text-indigo-500" /> Prepare-se com Profissionais do Mercado
                    </CardTitle>
                    <CardDescription>
                      Agende mentorias e simulações personalizadas com especialistas reais.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 text-sm text-muted-foreground">
                    Quer levar sua preparação para o próximo nível? Encontre mentores de tecnologia, design, negócios e outras áreas no MENVO e agende sessões exclusivas de feedback e treinamento.
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button asChild className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm font-medium">
                      <a href="https://menvo.com.br" target="_blank" rel="noopener noreferrer">
                        Explorar Mentores no MENVO
                      </a>
                    </Button>
                  </CardFooter>
                </Card>

                {/* Conversation History Drawer */}
                <Card className="border border-muted bg-card/40 backdrop-blur-sm">
                  <CardHeader className="py-4 border-b border-muted/50">
                    <CardTitle className="text-md font-semibold flex items-center gap-2">
                      <History className="h-4 w-4 text-muted-foreground" /> Ver
                      Transcrição Completa da Entrevista
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ScrollArea className="h-[400px] border border-muted rounded-xl bg-card">
                      <div className="p-4 space-y-4">
                        {selectedSimulation.messages.map((msg, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {msg.role === "interviewer"
                                  ? "Entrevistador"
                                  : "Candidato"}
                              </p>
                              <button
                                onClick={() => speakText(msg.content, true)}
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="Ouvir áudio"
                              >
                                <Volume2 className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-sm bg-muted/30 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
        </AnimatePresence>

        <ConfirmDialog
          isOpen={!!simulationToDelete}
          onClose={() => setSimulationToDelete(null)}
          onConfirm={confirmDeleteSimulation}
          title="Excluir Simulação"
          description="Tem certeza que deseja excluir permanentemente o histórico desta simulação? Esta ação não pode ser desfeita."
          variant="destructive"
          confirmText="Excluir"
        />
      </div>
    </div>
  )
}
