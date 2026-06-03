import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiClient } from "@/lib/apiClient"
import {
  GeneratedResume,
  ResumeProfileData,
  ResumeExperience,
  ResumeEducation,
  ResumeProject,
  ResumeExtracurricular
} from "@/../shared/types/generator"
import {
  FileText,
  Download,
  Plus,
  Trash2,
  ArrowLeft,
  Sparkles,
  Briefcase,
  GraduationCap,
  Wand2,
  Copy,
  Check,
  Loader2,
  Eye,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Link as LinkIcon,
  PlusCircle,
  User,
  Edit,
  Printer,
  Bold,
  Italic,
  List
} from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { motion, AnimatePresence } from "framer-motion"

export default function GeradorCurriculos() {
  const { profile } = useAuth()
  const hasPrefilled = useRef(false)

  const [currentView, setCurrentView] = useState<"history" | "form" | "view">(
    "history"
  )
  const [resumes, setResumes] = useState<
    { id: string; title: string; created_at: string }[]
  >([])
  const [selectedResume, setSelectedResume] = useState<GeneratedResume | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const resumeRef = useRef<HTMLDivElement>(null)
  const [template, setTemplate] = useState<"modern" | "minimalist">("minimalist")
  const [isEditingText, setIsEditingText] = useState(false)
  const [editContent, setEditContent] = useState("")
  const [previewHtml, setPreviewHtml] = useState("")
  const editorRef = useRef<HTMLDivElement>(null)

  const executeCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setPreviewHtml(editorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    if (isEditingText && editorRef.current && selectedResume) {
      const initialHtml = parseMarkdownToHtml(selectedResume.content);
      editorRef.current.innerHTML = initialHtml;
      setPreviewHtml(initialHtml);
    }
  }, [isEditingText, selectedResume]);

  // Form State
  const [formData, setFormData] = useState<ResumeProfileData>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
    summary: "",
    experiences: [
      {
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        current: false,
        description: ""
      }
    ],
    education: [],
    projects: [],
    extracurriculars: [],
    skills: [],
    languages: [],
    jobTitle: "",
    jobDescription: ""
  })

  const [skillInput, setSkillInput] = useState("")
  const [languageInput, setLanguageInput] = useState("")
  const [activeTab, setActiveTab] = useState("personal")

  useEffect(() => {
    loadHistory()
    loadCredits()
  }, [])

  useEffect(() => {
    if (profile && !hasPrefilled.current) {
      hasPrefilled.current = true

      const experiencesMapped = (profile.experiences && profile.experiences.length > 0)
        ? profile.experiences.map((exp: any) => ({
            company: exp.company || "",
            position: exp.position || "",
            startDate: exp.startDate || "",
            endDate: exp.endDate || "",
            current: !!exp.current,
            description: exp.description || ""
          }))
        : [
            {
              company: "",
              position: "",
              startDate: "",
              endDate: "",
              current: false,
              description: ""
            }
          ];

      const educationMapped = (profile.education && profile.education.length > 0)
        ? profile.education.map((edu: any) => ({
            institution: edu.institution || "",
            degree: edu.degree || "",
            fieldOfStudy: edu.fieldOfStudy || "",
            startDate: edu.startDate || "",
            endDate: edu.endDate || "",
            current: !!edu.current
          }))
        : (profile.course || profile.university)
          ? [
              {
                institution: profile.university || "",
                degree: "",
                fieldOfStudy: profile.course || "",
                startDate: "",
                endDate: "",
                current: false
              }
            ]
          : [];

      setFormData((prev) => ({
        ...prev,
        fullName: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.city_state || "",
        website: profile.portfolio_url || "",
        linkedin: profile.linkedin_url || "",
        github: profile.github_url || "",
        summary: profile.bio || "",
        experiences: experiencesMapped,
        education: educationMapped,
        projects: [],
        extracurriculars: [],
        skills: profile.skills || [],
        languages: profile.languages || []
      }))
    }
  }, [profile])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<any[]>("/api/generator")
      setResumes(data)
    } catch (err) {
      console.error("Erro ao buscar histórico de currículos:", err)
      toast.error("Não foi possível carregar o histórico de currículos.")
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

  const handleFetchDetail = async (id: string) => {
    setLoading(true)
    try {
      const data = await apiClient.get<GeneratedResume>(`/api/generator/${id}`)
      setSelectedResume(data)
      setEditContent(data.content)
      setIsEditingText(false)
      setCurrentView("view")
    } catch (err) {
      console.error("Erro ao carregar detalhes do currículo:", err)
      toast.error("Não foi possível carregar o currículo selecionado.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Deseja realmente excluir este currículo do seu histórico?"))
      return

    try {
      await apiClient.delete(`/api/generator/${id}`)
      setResumes((prev) => prev.filter((r) => r.id !== id))
      toast.success("Currículo excluído com sucesso.")
    } catch (err) {
      console.error("Erro ao excluir currículo:", err)
      toast.error("Não foi possível excluir o currículo.")
    }
  }

  const handleAddExperience = () => {
    const newExp: ResumeExperience = {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      description: ""
    }
    setFormData((prev) => ({
      ...prev,
      experiences: [...prev.experiences, newExp]
    }))
  }

  const handleRemoveExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }))
  }

  const handleExperienceChange = (
    index: number,
    field: keyof ResumeExperience,
    value: any
  ) => {
    setFormData((prev) => {
      const newExps = [...prev.experiences]
      newExps[index] = { ...newExps[index], [field]: value }
      return { ...prev, experiences: newExps }
    })
  }

  const handleAddEducation = () => {
    const newEdu: ResumeEducation = {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      current: false
    }
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu]
    }))
  }

  const handleRemoveEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const handleEducationChange = (
    index: number,
    field: keyof ResumeEducation,
    value: any
  ) => {
    setFormData((prev) => {
      const newEdus = [...prev.education]
      newEdus[index] = { ...newEdus[index], [field]: value }
      return { ...prev, education: newEdus }
    })
  }

  const handleAddProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        { name: "", description: "", url: "" }
      ]
    }))
  }

  const handleRemoveProject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((_, i) => i !== index)
    }))
  }

  const handleProjectChange = (
    index: number,
    field: keyof ResumeProject,
    value: any
  ) => {
    setFormData((prev) => {
      const newProjs = [...(prev.projects || [])]
      newProjs[index] = { ...newProjs[index], [field]: value }
      return { ...prev, projects: newProjs }
    })
  }

  const handleAddExtracurricular = () => {
    setFormData((prev) => ({
      ...prev,
      extracurriculars: [
        ...(prev.extracurriculars || []),
        { name: "", institution: "", startDate: "", endDate: "", description: "" }
      ]
    }))
  }

  const handleRemoveExtracurricular = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      extracurriculars: (prev.extracurriculars || []).filter((_, i) => i !== index)
    }))
  }

  const handleExtracurricularChange = (
    index: number,
    field: keyof ResumeExtracurricular,
    value: any
  ) => {
    setFormData((prev) => {
      const newExtras = [...(prev.extracurriculars || [])]
      newExtras[index] = { ...newExtras[index], [field]: value }
      return { ...prev, extracurriculars: newExtras }
    })
  }

  const handleAddSkill = () => {
    if (!skillInput.trim()) return
    const skillsList = skillInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !formData.skills.includes(s))
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, ...skillsList]
    }))
    setSkillInput("")
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill)
    }))
  }

  const handleAddLanguage = () => {
    if (!languageInput.trim()) return
    const langList = languageInput
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l && !formData.languages?.includes(l))
    setFormData((prev) => ({
      ...prev,
      languages: [...(prev.languages || []), ...langList]
    }))
    setLanguageInput("")
  }

  const handleRemoveLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: (prev.languages || []).filter((l) => l !== lang)
    }))
  }

  const handleGenerate = async () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.location ||
      !formData.summary
    ) {
      toast.error("Preencha os campos obrigatórios na aba Informações Básicas.")
      setActiveTab("personal")
      return
    }

    if (formData.skills.length === 0) {
      toast.error("Adicione pelo menos uma habilidade técnica/comportamental.")
      setActiveTab("skills")
      return
    }

    if (userCredits !== null && userCredits < 1) {
      toast.error(
        "Créditos insuficientes. Compre mais créditos para utilizar a IA.",
        {
          action: {
            label: "Ver Planos",
            onClick: () => (window.location.href = "/comprar-creditos")
          }
        }
      )
      return
    }

    setGenerating(true)
    try {
      const result = await apiClient.post<GeneratedResume>(
        "/api/generator",
        formData
      )
      setSelectedResume(result)
      setEditContent(result.content)
      setIsEditingText(false)
      setResumes((prev) => [
        { id: result.id, title: result.title, created_at: result.createdAt },
        ...prev
      ])
      toast.success("Currículo criado e otimizado com sucesso!")
      setCurrentView("view")
      loadCredits()
    } catch (err: any) {
      console.error("Erro ao gerar currículo:", err)
      toast.error(err.message || "Ocorreu um erro ao gerar o currículo com IA.")
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveEditText = async () => {
    if (!selectedResume || !editorRef.current) return;
    setLoading(true);
    try {
      const htmlContent = editorRef.current.innerHTML;
      const markdownContent = parseHtmlToMarkdown(htmlContent);
      const updated = await apiClient.put<GeneratedResume>(
        `/api/generator/${selectedResume.id}`,
        { content: markdownContent }
      );
      setSelectedResume(updated);
      setIsEditingText(false);
      toast.success("Alterações salvas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar currículo:", err);
      toast.error(err.message || "Não foi possível salvar as alterações.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!selectedResume) return
    navigator.clipboard.writeText(selectedResume.content)
    setCopied(true)
    toast.success("Markdown copiado para a área de transferência!")
    setTimeout(() => setCopied(false), 2000)
  }

  const exportPDF = async () => {
    if (!resumeRef.current || !selectedResume) return
    setIsExporting(true)
    try {
      const element = resumeRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      })
      const imgData = canvas.toDataURL("image/jpeg", 0.85)
      const pdf = new jsPDF("p", "mm", "a4")

      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      if (template === "minimalist") {
        // Force exactly one page for minimalist template to match single-page A4
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, 297)
      } else {
        // Multi-page export logic for other templates
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
      }

      const formattedName = selectedResume.title
        .replace(/\s+/g, "_")
        .toLowerCase()
      pdf.save(`${formattedName}.pdf`)
      toast.success("PDF baixado com sucesso!")
    } catch (err) {
      console.error("Erro ao exportar PDF:", err)
      toast.error("Não foi possível gerar o PDF.")
    } finally {
      setIsExporting(false)
    }
  }

  const parseMarkdownToHtml = (md: string) => {
    if (template === "modern") {
      const html = md
        .replace(
          /^# (.*$)/gim,
          '<h1 class="text-3xl font-extrabold text-gray-900 border-b pb-2 mb-4 mt-6 uppercase tracking-wide">$1</h1>'
        )
        .replace(
          /^## (.*$)/gim,
          '<h2 class="text-xl font-bold text-indigo-700 border-b border-gray-200 pb-1 mb-3 mt-6 uppercase">$1</h2>'
        )
        .replace(
          /^### (.*$)/gim,
          '<h3 class="text-lg font-bold text-gray-800 mb-2 mt-4">$1</h3>'
        )
        .replace(
          /^\* (.*$)/gim,
          '<li class="ml-5 list-disc text-gray-700 leading-relaxed mb-1">$1</li>'
        )
        .replace(
          /^- (.*$)/gim,
          '<li class="ml-5 list-disc text-gray-700 leading-relaxed mb-1">$1</li>'
        )
        .replace(
          /\*\*(.*)\*\*/gim,
          '<strong class="font-semibold text-gray-900">$1</strong>'
        )
        .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
        .replace(
          /`(.*)`/gim,
          '<code class="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono text-red-600">$1</code>'
        )
        .split("\n")
        .map((line) => {
          if (!line.trim()) return '<div class="h-2"></div>'
          if (
            line.startsWith("<h") ||
            line.startsWith("<li") ||
            line.startsWith("<div")
          )
            return line
          return `<p class="text-gray-700 leading-relaxed mb-2 text-justify">${line}</p>`
        })
        .join("\n")

      return html
    }

    // MINIMALIST TEMPLATE PARSER
    const lines = md.split("\n")
    let name = ""
    let contactLines: string[] = []
    let processedLines: string[] = []
    let state: "header" | "body" = "header"

    // Regex to match flex headers (experience, education)
    const flexHeaderRegex = /^([\s\S]*?\*\*[\s\S]*?\*\*[^*]*?)\s*(?:[|•]|\s-\s)\s*([^*]*?(?:meses|ano|\d{4}|Atual|Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|conclusão|previsão).*)$/i

    const parseInline = (txt: string) => {
      return txt
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-black">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip empty lines
      if (!line) {
        processedLines.push('<div class="h-1"></div>')
        continue
      }

      // Candidate Name (# header)
      if (line.startsWith("# ")) {
        name = line.substring(2).trim()
        continue
      }

      // If we are in the header state, and we haven't seen a section title (##), 
      // then any text line is part of the header (location, email, phone, links).
      if (state === "header" && !line.startsWith("##")) {
        contactLines.push(line)
        continue
      }

      // Section Header (## header)
      if (line.startsWith("## ")) {
        state = "body"
        const sectionTitle = line.substring(3).trim()
        processedLines.push(
          `<h2 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mt-3.5 mb-2">${sectionTitle}</h2>`
        )
        continue
      }

      // Subheadings (### header)
      if (line.startsWith("### ")) {
        const subTitle = line.substring(4).trim()
        processedLines.push(
          `<h3 class="text-[12px] font-semibold text-gray-900 mb-0.5 mt-1.5">${parseInline(subTitle)}</h3>`
        )
        continue
      }

      // Flex headers for experience/education
      const flexMatch = line.match(flexHeaderRegex)
      if (flexMatch) {
        const leftSide = parseInline(flexMatch[1].trim())
        const rightSide = parseInline(flexMatch[2].trim())
        processedLines.push(
          `<div class="flex justify-between items-baseline mb-0.5 text-[12px]"><span class="font-semibold text-black">${leftSide}</span><span class="text-gray-600 text-[11px] shrink-0 ml-4">${rightSide}</span></div>`
        )
        continue
      }

      // Bullet points (* or -)
      if (line.startsWith("* ") || line.startsWith("- ")) {
        const bulletText = line.substring(2).trim()
        processedLines.push(
          `<li class="ml-4 list-disc text-gray-700 text-[11.5px] leading-relaxed mb-0.5 text-justify">${parseInline(bulletText)}</li>`
        )
        continue
      }

      // Regular paragraph
      processedLines.push(
        `<p class="text-gray-700 text-[11.5px] leading-relaxed mb-1.5 text-justify">${parseInline(line)}</p>`
      )
    }

    // Build the header
    let headerHtml = ""
    if (name) {
      headerHtml += `<div class="text-center mb-4">`
      headerHtml += `<h1 class="text-[24px] font-extrabold text-black tracking-wide uppercase mb-0.5">${name}</h1>`
      
      if (contactLines.length > 0) {
        const rawContact = contactLines.join(" • ")
        const cleanedContact = rawContact
          .replace(/\\•/g, "•")
          .replace(/•+/g, "•")
          .replace(/\|+/g, "•")
          .split("•")
          .map((item) => item.trim().replace(/^[-*\s]+/, ""))
          .filter((item) => item && item !== "Não informado" && !item.toLowerCase().includes("dados de contato"))
          .join(" • ")

        headerHtml += `<div class="text-[11.5px] text-gray-600 font-normal">${cleanedContact}</div>`
      }
      headerHtml += `</div>`
    }

    return headerHtml + processedLines.join("\n")
  }

  const parseHtmlToMarkdown = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    
    const walk = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue || "";
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return "";
      }
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      let childrenContent = "";
      for (let i = 0; i < el.childNodes.length; i++) {
        childrenContent += walk(el.childNodes[i]);
      }
      
      switch (tagName) {
        case "h1":
          return `# ${childrenContent.trim()}\n\n`;
        case "h2":
          return `## ${childrenContent.trim()}\n\n`;
        case "h3":
          return `### ${childrenContent.trim()}\n\n`;
        case "strong":
        case "b":
          return `**${childrenContent}**`;
        case "em":
        case "i":
          return `*${childrenContent}*`;
        case "li":
          return `* ${childrenContent.trim()}\n`;
        case "ul":
          return `\n${childrenContent}\n`;
        case "p":
          return `${childrenContent.trim()}\n\n`;
        case "br":
          return "\n";
        case "div":
          return `${childrenContent}\n`;
        default:
          return childrenContent;
      }
    };
    
    let markdown = walk(doc.body);
    
    markdown = markdown
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\*\* \*\*/g, "")
      .replace(/\* \*/g, "")
      .trim();
      
    return markdown;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
              Criador de Currículos com IA
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Crie, otimize e personalize currículos de alto impacto adaptados
              para a vaga desejada.
            </p>
          </div>

          {currentView !== "history" ? (
            <Button
              variant="outline"
              onClick={() => setCurrentView("history")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao Histórico
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentView("form")}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Currículo
            </Button>
          )}
        </div>

        {/* Loading Overlay for details */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-500">Carregando informações...</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!loading && (
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* VIEW 1: HISTORY */}
              {currentView === "history" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                      Seus Currículos Salvos
                    </h2>
                  </div>

                  {resumes.length === 0 ? (
                    <Card className="border-dashed border-2 py-14 text-center">
                      <CardContent className="flex flex-col items-center justify-center">
                        <div className="h-16 w-16 bg-purple-50 dark:bg-purple-950/20 rounded-full flex items-center justify-center mb-4">
                          <FileText className="h-8 w-8 text-purple-500" />
                        </div>
                        <h3 className="text-lg font-bold mb-1">
                          Nenhum currículo gerado
                        </h3>
                        <p className="text-gray-500 max-w-sm mb-6 text-sm">
                          Use o poder da IA para compilar suas experiências e
                          otimizá-las para sua vaga dos sonhos. Custa apenas 1
                          crédito.
                        </p>
                        <Button
                          onClick={() => setCurrentView("form")}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          Criar Currículo Agora
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {resumes.map((r) => (
                        <Card
                          key={r.id}
                          onClick={() => handleFetchDetail(r.id)}
                          className="cursor-pointer hover:shadow-lg hover:border-indigo-300 transition-all border group relative"
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base line-clamp-1 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                              <FileText className="h-4 w-4 text-purple-500 shrink-0" />
                              {r.title}
                            </CardTitle>
                            <CardDescription className="text-xs flex items-center gap-1.5 mt-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(r.created_at).toLocaleDateString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                }
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-4 flex justify-between items-center text-xs text-gray-500">
                            <span className="flex items-center gap-1 text-indigo-500 font-medium">
                              <Eye className="h-3.5 w-3.5" /> Visualizar
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteResume(r.id, e)}
                              className="h-8 w-8 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: FORM / MULTI-STEP */}
              {currentView === "form" && (
                <Card className="border shadow-md overflow-hidden">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <div className="bg-gray-100/60 dark:bg-gray-900/60 p-2 border-b border-gray-200 dark:border-gray-800">
                      <TabsList className="grid grid-cols-5 w-full h-auto bg-transparent gap-1">
                        <TabsTrigger
                          value="personal"
                          className="py-2.5 text-xs sm:text-sm flex gap-1.5 items-center"
                        >
                          <User className="h-4 w-4 shrink-0" />{" "}
                          <span className="hidden sm:inline">Pessoais</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="education"
                          className="py-2.5 text-xs sm:text-sm flex gap-1.5 items-center"
                        >
                          <GraduationCap className="h-4 w-4 shrink-0" />{" "}
                          <span className="hidden sm:inline">Formação</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="experiences"
                          className="py-2.5 text-xs sm:text-sm flex gap-1.5 items-center"
                        >
                          <Briefcase className="h-4 w-4 shrink-0" />{" "}
                          <span className="hidden sm:inline">Experiências</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="projects_activities"
                          className="py-2.5 text-xs sm:text-sm flex gap-1.5 items-center"
                        >
                          <FileText className="h-4 w-4 shrink-0" />{" "}
                          <span className="hidden sm:inline">Projetos & Cursos</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="skills"
                          className="py-2.5 text-xs sm:text-sm flex gap-1.5 items-center"
                        >
                          <Wand2 className="h-4 w-4 shrink-0" />{" "}
                          <span className="hidden sm:inline">
                            Vaga & Habilidades
                          </span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <ScrollArea className="h-[70vh] p-6">
                      {/* TAB 1: PERSONAL INFO */}
                      <TabsContent value="personal" className="space-y-4 mt-0">
                        <h3 className="text-lg font-bold border-b pb-2 mb-4">
                          Informações Pessoais
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Nome Completo *</Label>
                            <Input
                              id="fullName"
                              value={formData.fullName}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  fullName: e.target.value
                                }))
                              }
                              placeholder="ex: João da Silva"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">E-mail *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  email: e.target.value
                                }))
                              }
                              placeholder="ex: joao@email.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Telefone *</Label>
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  phone: e.target.value
                                }))
                              }
                              placeholder="ex: (11) 99999-9999"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Cidade/Estado *</Label>
                            <Input
                              id="location"
                              value={formData.location}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  location: e.target.value
                                }))
                              }
                              placeholder="ex: São Paulo - SP"
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="website">Website / Portfólio</Label>
                            <Input
                              id="website"
                              value={formData.website || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  website: e.target.value
                                }))
                              }
                              placeholder="ex: www.meusite.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="linkedin">LinkedIn</Label>
                            <Input
                              id="linkedin"
                              value={formData.linkedin || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  linkedin: e.target.value
                                }))
                              }
                              placeholder="ex: linkedin.com/in/joao"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="github">GitHub</Label>
                            <Input
                              id="github"
                              value={formData.github || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  github: e.target.value
                                }))
                              }
                              placeholder="ex: github.com/joao"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <Label htmlFor="summary">
                            Resumo Profissional / Apresentação *
                          </Label>
                          <Textarea
                            id="summary"
                            rows={4}
                            maxLength={1000}
                            value={formData.summary}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                summary: e.target.value
                              }))
                            }
                            placeholder="Escreva um breve resumo destacando quem você é, seus principais focos profissionais e o que busca."
                          />
                          <p className="text-xs text-gray-500">
                            Mínimo de 10 caracteres. Dica: descreva sua bagagem
                            técnica e soft skills.
                          </p>
                        </div>

                        <div className="flex justify-end pt-4">
                          <Button
                            onClick={() => setActiveTab("education")}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            Próximo Passo
                          </Button>
                        </div>
                      </TabsContent>

                      {/* TAB 2: EXPERIENCES */}
                      <TabsContent
                        value="experiences"
                        className="space-y-6 mt-0"
                      >
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                          <h3 className="text-lg font-bold">
                            Experiências Profissionais
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddExperience}
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1"
                          >
                            <Plus className="h-4 w-4" /> Adicionar
                          </Button>
                        </div>

                        {formData.experiences.length === 0 ? (
                          <div className="text-center py-10 border rounded bg-gray-50/50 dark:bg-gray-900/20 text-gray-500">
                            <Briefcase className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">
                              Nenhuma experiência profissional cadastrada.
                            </p>
                            <p className="text-xs mt-1 text-gray-400">
                              Clique em adicionar para inserir empregos ou
                              estágios anteriores.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {formData.experiences.map((exp, index) => (
                              <Card
                                key={index}
                                className="relative border p-4 bg-gray-50/30 dark:bg-gray-900/10"
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveExperience(index)}
                                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </Button>

                                <div className="grid sm:grid-cols-2 gap-4 mt-2">
                                  <div className="space-y-2">
                                    <Label>Empresa / Organização *</Label>
                                    <Input
                                      value={exp.company}
                                      onChange={(e) =>
                                        handleExperienceChange(
                                          index,
                                          "company",
                                          e.target.value
                                        )
                                      }
                                      placeholder="ex: Tech Solutions Inc"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Cargo / Posição *</Label>
                                    <Input
                                      value={exp.position}
                                      onChange={(e) =>
                                        handleExperienceChange(
                                          index,
                                          "position",
                                          e.target.value
                                        )
                                      }
                                      placeholder="ex: Desenvolvedor Front-end"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Data de Início *</Label>
                                    <Input
                                      type="month"
                                      value={exp.startDate}
                                      onChange={(e) =>
                                        handleExperienceChange(
                                          index,
                                          "startDate",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Data de Fim (ou "Atual")</Label>
                                    <Input
                                      type="month"
                                      disabled={exp.current}
                                      value={
                                        exp.current ? "" : exp.endDate
                                      }
                                      onChange={(e) =>
                                        handleExperienceChange(
                                          index,
                                          "endDate",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 mt-4">
                                  <Switch
                                    id={`exp-current-${index}`}
                                    checked={exp.current}
                                    onCheckedChange={(checked) =>
                                      handleExperienceChange(
                                        index,
                                        "current",
                                        checked
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`exp-current-${index}`}
                                    className="cursor-pointer"
                                  >
                                    Ainda trabalho nesta empresa
                                  </Label>
                                </div>

                                <div className="space-y-2 mt-4">
                                  <Label>
                                    Principais Atividades e Conquistas *
                                  </Label>
                                  <Textarea
                                    rows={3}
                                    maxLength={1000}
                                    value={exp.description}
                                    onChange={(e) =>
                                      handleExperienceChange(
                                        index,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Descreva suas conquistas, projetos em que trabalhou e tecnologias que utilizou diariamente."
                                  />
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab("education")}
                          >
                            Voltar
                          </Button>
                          <Button
                            onClick={() => setActiveTab("projects_activities")}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            Próximo Passo
                          </Button>
                        </div>
                      </TabsContent>

                      {/* TAB 3: EDUCATION */}
                      <TabsContent value="education" className="space-y-6 mt-0">
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                          <h3 className="text-lg font-bold">
                            Histórico Acadêmico
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddEducation}
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1"
                          >
                            <Plus className="h-4 w-4" /> Adicionar
                          </Button>
                        </div>

                        {formData.education.length === 0 ? (
                          <div className="text-center py-10 border rounded bg-gray-50/50 dark:bg-gray-900/20 text-gray-500">
                            <GraduationCap className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">
                              Nenhuma formação acadêmica cadastrada.
                            </p>
                            <p className="text-xs mt-1 text-gray-400">
                              Clique em adicionar para inserir cursos,
                              faculdades ou certificações.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {formData.education.map((edu, index) => (
                              <Card
                                key={index}
                                className="relative border p-4 bg-gray-50/30 dark:bg-gray-900/10"
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveEducation(index)}
                                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </Button>

                                <div className="grid sm:grid-cols-2 gap-4 mt-2">
                                  <div className="space-y-2">
                                    <Label>Instituição *</Label>
                                    <Input
                                      value={edu.institution}
                                      onChange={(e) =>
                                        handleEducationChange(
                                          index,
                                          "institution",
                                          e.target.value
                                        )
                                      }
                                      placeholder="ex: USP - Universidade de São Paulo"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Nível (Grau) *</Label>
                                    <Input
                                      value={edu.degree}
                                      onChange={(e) =>
                                        handleEducationChange(
                                          index,
                                          "degree",
                                          e.target.value
                                        )
                                      }
                                      placeholder="ex: Bacharelado, Tecnólogo, Técnico"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Área / Curso *</Label>
                                    <Input
                                      value={edu.fieldOfStudy}
                                      onChange={(e) =>
                                        handleEducationChange(
                                          index,
                                          "fieldOfStudy",
                                          e.target.value
                                        )
                                      }
                                      placeholder="ex: Análise e Desenvolvimento de Sistemas"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                      <Label>Data de Início *</Label>
                                      <Input
                                        type="month"
                                        value={edu.startDate}
                                        onChange={(e) =>
                                          handleEducationChange(
                                            index,
                                            "startDate",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Conclusão</Label>
                                      <Input
                                        type="month"
                                        disabled={edu.current}
                                        value={
                                          edu.current ? "" : edu.endDate
                                        }
                                        onChange={(e) =>
                                          handleEducationChange(
                                            index,
                                            "endDate",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 mt-4">
                                  <Switch
                                    id={`edu-current-${index}`}
                                    checked={edu.current}
                                    onCheckedChange={(checked) =>
                                      handleEducationChange(
                                        index,
                                        "current",
                                        checked
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`edu-current-${index}`}
                                    className="cursor-pointer"
                                  >
                                    Ainda estou cursando
                                  </Label>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab("personal")}
                          >
                            Voltar
                          </Button>
                          <Button
                            onClick={() => setActiveTab("experiences")}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            Próximo Passo
                          </Button>
                        </div>
                      </TabsContent>

                      {/* TAB 4: PROJECTS & EXTRACURRICULAR ACTIVITIES */}
                      <TabsContent value="projects_activities" className="space-y-6 mt-0">
                        {/* PROJECTS SECTION */}
                        <div className="space-y-6">
                          <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h3 className="text-lg font-bold">Projetos de Destaque</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddProject}
                              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1"
                            >
                              <Plus className="h-4 w-4" /> Adicionar Projeto
                            </Button>
                          </div>

                          {(formData.projects || []).length === 0 ? (
                            <div className="text-center py-8 border rounded bg-gray-50/50 dark:bg-gray-900/20 text-gray-500 text-sm">
                              Nenhum projeto de destaque cadastrado. Adicione projetos acadêmicos, pessoais ou TCC.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {(formData.projects || []).map((proj, index) => (
                                <Card key={index} className="relative border p-4 bg-gray-50/30 dark:bg-gray-900/10">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveProject(index)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/20"
                                  >
                                    <Trash2 className="h-4.5 w-4.5" />
                                  </Button>

                                  <div className="grid sm:grid-cols-2 gap-4 mt-2">
                                    <div className="space-y-2">
                                      <Label>Nome do Projeto *</Label>
                                      <Input
                                        value={proj.name}
                                        onChange={(e) => handleProjectChange(index, "name", e.target.value)}
                                        placeholder="ex: Sistema de Agendamento, App de Finanças"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Link / URL (opcional)</Label>
                                      <Input
                                        value={proj.url || ""}
                                        onChange={(e) => handleProjectChange(index, "url", e.target.value)}
                                        placeholder="ex: github.com/usuario/projeto"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2 mt-4">
                                    <Label>Descrição e Tecnologias *</Label>
                                    <Textarea
                                      rows={2}
                                      value={proj.description}
                                      onChange={(e) => handleProjectChange(index, "description", e.target.value)}
                                      placeholder="Descreva o objetivo do projeto e as ferramentas utilizadas (ex: Desenvolvido com React e Firebase para gerenciar...)"
                                    />
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* EXTRACURRICULARS SECTION */}
                        <div className="space-y-6 pt-4 border-t">
                          <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h3 className="text-lg font-bold">Cursos & Atividades Extracurriculares</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddExtracurricular}
                              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1"
                            >
                              <Plus className="h-4 w-4" /> Adicionar Atividade
                            </Button>
                          </div>

                          {(formData.extracurriculars || []).length === 0 ? (
                            <div className="text-center py-8 border rounded bg-gray-50/50 dark:bg-gray-900/20 text-gray-500 text-sm">
                              Nenhum curso complementar ou voluntariado cadastrado.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {(formData.extracurriculars || []).map((extra, index) => (
                                <Card key={index} className="relative border p-4 bg-gray-50/30 dark:bg-gray-900/10">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveExtracurricular(index)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/20"
                                  >
                                    <Trash2 className="h-4.5 w-4.5" />
                                  </Button>

                                  <div className="grid sm:grid-cols-2 gap-4 mt-2">
                                    <div className="space-y-2">
                                      <Label>Nome do Curso / Atividade *</Label>
                                      <Input
                                        value={extra.name}
                                        onChange={(e) => handleExtracurricularChange(index, "name", e.target.value)}
                                        placeholder="ex: Curso de Web Design, Trabalho Voluntário de Apoio Escolar"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Instituição / Organização</Label>
                                      <Input
                                        value={extra.institution || ""}
                                        onChange={(e) => handleExtracurricularChange(index, "institution", e.target.value)}
                                        placeholder="ex: Alura, Udemy, Cruz Vermelha"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Data de Início</Label>
                                      <Input
                                        type="month"
                                        value={extra.startDate || ""}
                                        onChange={(e) => handleExtracurricularChange(index, "startDate", e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Data de Conclusão</Label>
                                      <Input
                                        type="month"
                                        value={extra.endDate || ""}
                                        onChange={(e) => handleExtracurricularChange(index, "endDate", e.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2 mt-4">
                                    <Label>Descrição (opcional)</Label>
                                    <Textarea
                                      rows={2}
                                      value={extra.description || ""}
                                      onChange={(e) => handleExtracurricularChange(index, "description", e.target.value)}
                                      placeholder="Descreva brevemente o que aprendeu ou realizou nesta atividade."
                                    />
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* NAV BUTTONS */}
                        <div className="flex justify-between pt-6 border-t">
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab("experiences")}
                          >
                            Voltar
                          </Button>
                          <Button
                            onClick={() => setActiveTab("skills")}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            Próximo Passo
                          </Button>
                        </div>
                      </TabsContent>

                      {/* TAB 5: SKILLS & TARGET JOB */}
                      <TabsContent value="skills" className="space-y-6 mt-0">
                        <div>
                          <h3 className="text-lg font-bold border-b pb-2 mb-4">
                            Competências & Idiomas
                          </h3>

                          {/* SKILLS TAGS INPUT */}
                          <div className="space-y-2 mb-6">
                            <Label>
                              Habilidades Técnicas e Interpessoais *
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleAddSkill()
                                  }
                                }}
                                placeholder="ex: React, Node.js, TypeScript, Kanban (separe por vírgulas)"
                              />
                              <Button
                                type="button"
                                onClick={handleAddSkill}
                                variant="outline"
                                className="text-indigo-600 border-indigo-200"
                              >
                                <Plus className="h-4 w-4" /> Adicionar
                              </Button>
                            </div>

                            {formData.skills.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border">
                                {formData.skills.map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="flex items-center gap-1 pr-1 bg-white dark:bg-gray-800 border"
                                  >
                                    {skill}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveSkill(skill)}
                                      className="h-4 w-4 text-gray-400 hover:text-red-500 rounded-full hover:bg-transparent"
                                    >
                                      &times;
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* LANGUAGES TAGS INPUT */}
                          <div className="space-y-2">
                            <Label>Idiomas</Label>
                            <div className="flex gap-2">
                              <Input
                                value={languageInput}
                                onChange={(e) =>
                                  setLanguageInput(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleAddLanguage()
                                  }
                                }}
                                placeholder="ex: Inglês Avançado, Espanhol Básico"
                              />
                              <Button
                                type="button"
                                onClick={handleAddLanguage}
                                variant="outline"
                                className="text-indigo-600 border-indigo-200"
                              >
                                <Plus className="h-4 w-4" /> Adicionar
                              </Button>
                            </div>

                            {(formData.languages || []).length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border">
                                {(formData.languages || []).map((lang) => (
                                  <Badge
                                    key={lang}
                                    variant="secondary"
                                    className="flex items-center gap-1 pr-1 bg-white dark:bg-gray-800 border"
                                  >
                                    {lang}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveLanguage(lang)}
                                      className="h-4 w-4 text-gray-400 hover:text-red-500 rounded-full hover:bg-transparent"
                                    >
                                      &times;
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* TARGET JOB INFO */}
                        <div className="space-y-4 pt-4 border-t">
                          <p className="text-sm text-gray-500">
                            Ao fornecer o cargo e a descrição da vaga de
                            interesse, a Inteligência Artificial irá reescrever
                            seu currículo de forma cirúrgica, ressaltando os
                            termos e conquistas mais adequados para prender a
                            atenção do recrutador.
                          </p>

                          <div className="space-y-2">
                            <Label htmlFor="jobTitle">
                              Cargo Desejado / Título da Vaga
                            </Label>
                            <Input
                              id="jobTitle"
                              value={formData.jobTitle || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  jobTitle: e.target.value
                                }))
                              }
                              placeholder="ex: Estagiário em Desenvolvimento Web"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="jobDescription">
                              Requisitos / Descrição da Vaga
                            </Label>
                            <Textarea
                              id="jobDescription"
                              rows={5}
                              value={formData.jobDescription || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  jobDescription: e.target.value
                                }))
                              }
                              placeholder="Cole aqui a descrição completa da vaga publicada ou a lista de requisitos exigidos."
                            />
                          </div>
                        </div>

                        <div className="flex justify-between pt-6 border-t">
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab("projects_activities")}
                          >
                            Voltar
                          </Button>
                          <Button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold px-6 shadow-md flex items-center gap-2"
                          >
                            {generating ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Otimizando Currículo...
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-4 w-4" />
                                Gerar Currículo Otimizado
                              </>
                            )}
                          </Button>
                        </div>
                      </TabsContent>
                    </ScrollArea>
                  </Tabs>
                </Card>
              )}

              {/* VIEW 3: RENDERED VIEW */}
              {currentView === "view" && selectedResume && (
                <div className="space-y-6">
                  {isEditingText ? (
                    <>
                      {/* Actions bar for editing */}
                      <div className="flex flex-wrap justify-between items-center bg-white dark:bg-gray-900 border p-4 rounded-xl gap-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Edit className="h-5 w-5 text-indigo-500" />
                          <h2 className="font-bold text-sm sm:text-base">
                            Modo de Edição — {selectedResume.title}
                          </h2>
                        </div>

                        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end items-center">
                          <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-xs text-gray-500 font-medium">Modelo:</span>
                            <select
                              value={template}
                              onChange={(e) => setTemplate(e.target.value as any)}
                              className="text-xs bg-gray-50 dark:bg-gray-800 border rounded p-1 text-gray-700 dark:text-gray-200 cursor-pointer"
                            >
                              <option value="minimalist">ATS Minimalista (Uma Página)</option>
                              <option value="modern">Moderno (Colorido)</option>
                            </select>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingText(false)}
                            className="flex items-center gap-1.5 text-xs sm:text-sm border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            Cancelar
                          </Button>

                          <Button
                            onClick={handleSaveEditText}
                            disabled={loading}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs sm:text-sm shadow"
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Salvar Alterações
                          </Button>
                        </div>
                      </div>

                      {/* Dual Pane Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        {/* Left: WYSIWYG Visual Editor */}
                        <Card className="border shadow-sm flex flex-col h-[700px] overflow-hidden">
                          <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Editor Visual (WYSIWYG)
                            </CardTitle>
                          </CardHeader>
                          {/* Formatting Toolbar */}
                          <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-900 border-b">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => executeCommand('bold')}
                              className="h-8 w-8 p-0"
                              title="Negrito (Ctrl+B)"
                            >
                              <Bold className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => executeCommand('italic')}
                              className="h-8 w-8 p-0"
                              title="Itálico (Ctrl+I)"
                            >
                              <Italic className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => executeCommand('insertUnorderedList')}
                              className="h-8 w-8 p-0"
                              title="Lista com Marcadores"
                            >
                              <List className="h-4 w-4" />
                            </Button>
                            <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-800 mx-1" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => executeCommand('formatBlock', 'h2')}
                              className="h-8 px-2 text-xs font-semibold"
                              title="Título da Seção (H2)"
                            >
                              Título 1
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => executeCommand('formatBlock', 'h3')}
                              className="h-8 px-2 text-xs font-semibold"
                              title="Subtítulo (H3)"
                            >
                              Título 2
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => executeCommand('formatBlock', 'p')}
                              className="h-8 px-2 text-xs font-semibold"
                              title="Texto Normal"
                            >
                              Parágrafo
                            </Button>
                          </div>
                          <CardContent className="p-3 flex-1 overflow-hidden bg-white dark:bg-gray-950">
                            <div
                              ref={editorRef}
                              contentEditable
                              onInput={(e) => {
                                setPreviewHtml(e.currentTarget.innerHTML);
                              }}
                              className="w-full h-full p-4 overflow-y-auto outline-none focus:ring-1 focus:ring-indigo-500 text-sm text-gray-800 dark:text-gray-200 prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 leading-relaxed"
                              style={{ minHeight: "100%" }}
                            />
                          </CardContent>
                        </Card>

                        {/* Right: Rendered live preview */}
                        <Card className="border shadow-sm flex flex-col h-[700px] overflow-hidden">
                          <CardHeader className="pb-3 border-b bg-gray-50/50 dark:bg-gray-950/20">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Visualização A4
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 flex-1 overflow-auto bg-gray-100 dark:bg-gray-800/40 flex justify-center">
                            <div
                              ref={resumeRef}
                              id="resume-print-area"
                              className={
                                template === "minimalist"
                                  ? "bg-white text-black p-8 w-[210mm] h-[297mm] max-h-[297mm] overflow-hidden shadow-md rounded-sm font-sans my-4 flex flex-col"
                                  : "bg-white text-gray-900 p-8 sm:p-12 w-[210mm] min-h-[297mm] shadow-md rounded-sm my-4"
                              }
                              style={{ contentVisibility: "auto" }}
                            >
                              <div
                                className={
                                  template === "minimalist"
                                    ? "text-black"
                                    : "prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700"
                                }
                                dangerouslySetInnerHTML={{
                                  __html: previewHtml
                                }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Actions bar */}
                      <div className="flex flex-wrap justify-between items-center bg-white dark:bg-gray-900 border p-4 rounded-xl gap-3 shadow-sm">
                        <h2 className="font-bold text-sm sm:text-base hidden sm:inline-block max-w-xs truncate">
                          {selectedResume.title}
                        </h2>

                        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end items-center">
                          <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-xs text-gray-500 font-medium">Modelo:</span>
                            <select
                              value={template}
                              onChange={(e) => setTemplate(e.target.value as any)}
                              className="text-xs bg-gray-50 dark:bg-gray-800 border rounded p-1 text-gray-700 dark:text-gray-200 cursor-pointer"
                            >
                              <option value="minimalist">ATS Minimalista (Uma Página)</option>
                              <option value="modern">Moderno (Colorido)</option>
                            </select>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditContent(selectedResume.content);
                              setIsEditingText(true);
                            }}
                            className="flex items-center gap-1.5 text-xs sm:text-sm border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                          >
                            <Edit className="h-4 w-4" />
                            Editar Texto
                          </Button>

                          <Button
                            onClick={() => window.print()}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs sm:text-sm shadow"
                          >
                            <Printer className="h-4 w-4" />
                            Imprimir PDF
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyMarkdown}
                            className="flex items-center gap-1.5 text-xs sm:text-sm border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                          >
                            {copied ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            Copiar Markdown
                          </Button>
                        </div>
                      </div>

                      {/* Rendered Resume sheet */}
                      <div className="overflow-x-auto p-1 bg-gray-200 dark:bg-gray-800/50 rounded-xl border flex justify-center shadow-inner">
                        <div
                          ref={resumeRef}
                          id="resume-print-area"
                          className={
                            template === "minimalist"
                              ? "bg-white text-black p-8 w-[210mm] h-[297mm] max-h-[297mm] overflow-hidden shadow-2xl rounded-sm print:shadow-none print:p-0 my-4 flex flex-col font-sans"
                              : "bg-white text-gray-900 p-8 sm:p-12 w-[210mm] min-h-[297mm] shadow-2xl rounded-sm print:shadow-none print:p-0 my-4"
                          }
                          style={{ contentVisibility: "auto" }}
                        >
                          <div
                            className={
                              template === "minimalist"
                                ? "text-black"
                                : "prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700"
                            }
                            dangerouslySetInnerHTML={{
                              __html: parseMarkdownToHtml(selectedResume.content)
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
