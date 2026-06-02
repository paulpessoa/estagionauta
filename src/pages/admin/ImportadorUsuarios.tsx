import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  Users, 
  FileText, 
  AlertCircle,
  Database,
  RefreshCw,
  Info,
  UserPlus,
  Loader2,
  Mail
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/apiClient'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface JotformForm {
  id: string
  title: string
  count: number
  status: string
  created_at: string
}

interface ExternalUser {
  id: string
  email: string
  phone: string
  full_name: string
  avatar_url?: string
  course?: string
  university?: string
  created_at: string
  has_resume: boolean
  resume_url: string
  profile_data: any
}

export default function ImportadorUsuarios() {
  const [forms, setForms] = useState<JotformForm[]>([])
  const [selectedFormId, setSelectedFormId] = useState<string>('')
  const [externalUsers, setExternalUsers] = useState<ExternalUser[]>([])
  const [localUsers, setLocalUsers] = useState<any[]>([])
  
  const [loadingForms, setLoadingForms] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [resumeFilter, setResumeFilter] = useState<'all' | 'with_resume' | 'without_resume'>('all')
  const [localFilter, setLocalFilter] = useState<'all' | 'new_only' | 'local_only'>('all')
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copiedEmails, setCopiedEmails] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [importingRowId, setImportingRowId] = useState<string | null>(null)

  // Recommended Forms from User
  const recommendedForms = [
    { id: '92985548715676', label: 'Formulário 92985548715676' },
    { id: '200697163523354', label: 'Formulário 200697163523354' }
  ]

  // Load active forms from Jotform
  const loadForms = async () => {
    setLoadingForms(true)
    setError(null)
    try {
      const data = await apiClient.get<{ forms: JotformForm[] }>('/api/admin/jotform/forms')
      setForms(data.forms || [])
      
      // Select the first form by default if available
      if (data.forms && data.forms.length > 0 && !selectedFormId) {
        setSelectedFormId(data.forms[0].id)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Erro ao carregar os formulários do Jotform. Verifique a chave MENVO_JOTFORM_API_KEY no arquivo api/.env.')
    } finally {
      setLoadingForms(false)
    }
  }

  // Load local users for mapping
  const loadLocalUsers = async () => {
    try {
      const localData = await apiClient.get<any[]>('/api/admin/users')
      setLocalUsers(localData || [])
    } catch (err) {
      console.error('Erro ao carregar usuários locais:', err)
    }
  }

  // Load submissions for selected Form ID
  const loadSubmissions = async (formId: string) => {
    if (!formId) return
    setLoadingUsers(true)
    setError(null)
    setSelectedIds(new Set())
    try {
      await loadLocalUsers()
      const data = await apiClient.get<{ users: ExternalUser[] }>(`/api/admin/jotform/submissions/${formId}`)
      setExternalUsers(data.users || [])
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Erro ao buscar submissões do formulário selecionado.')
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    loadLocalUsers()
    loadForms()
  }, [])

  useEffect(() => {
    if (selectedFormId) {
      loadSubmissions(selectedFormId)
    }
  }, [selectedFormId])

  // Check if user already exists locally
  const checkIsLocal = (email: string) => {
    return localUsers.some(lu => lu.email?.toLowerCase() === email?.toLowerCase())
  }

  // Filter external users list
  const filteredUsers = useMemo(() => {
    return externalUsers.filter(user => {
      const term = searchTerm.toLowerCase()
      const matchesSearch = (
        (user.full_name || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term) ||
        (user.phone || '').includes(term)
      )

      const matchesResume = 
        resumeFilter === 'all' || 
        (resumeFilter === 'with_resume' && user.has_resume) || 
        (resumeFilter === 'without_resume' && !user.has_resume)

      const isLocal = checkIsLocal(user.email)
      const matchesLocal = 
        localFilter === 'all' ||
        (localFilter === 'new_only' && !isLocal) ||
        (localFilter === 'local_only' && isLocal)

      return matchesSearch && matchesResume && matchesLocal
    })
  }, [externalUsers, localUsers, searchTerm, resumeFilter, localFilter])

  // Selection toggle handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFilteredIds = filteredUsers.map(u => u.id)
      setSelectedIds(new Set(allFilteredIds))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectUser = (id: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) {
      next.add(id)
    } else {
      next.delete(id)
    }
    setSelectedIds(next)
  }

  const selectedUsers = useMemo(() => {
    return externalUsers.filter(u => selectedIds.has(u.id))
  }, [externalUsers, selectedIds])

  // Bulk actions - Copy
  const handleCopyEmails = () => {
    if (selectedUsers.length === 0) {
      toast.warning('Nenhum usuário selecionado')
      return
    }
    const emails = selectedUsers.map(u => u.email).join(', ')
    navigator.clipboard.writeText(emails)
    setCopiedEmails(true)
    toast.success(`${selectedUsers.length} e-mails copiados para a área de transferência!`)
    setTimeout(() => setCopiedEmails(false), 2000)
  }

  const handleCopyJson = () => {
    if (selectedUsers.length === 0) {
      toast.warning('Nenhum usuário selecionado')
      return
    }
    const simpleData = selectedUsers.map(u => ({
      email: u.email,
      name: u.full_name,
      phone: u.phone,
      resume_url: u.resume_url,
      created_at: u.created_at
    }))
    navigator.clipboard.writeText(JSON.stringify(simpleData, null, 2))
    setCopiedJson(true)
    toast.success('Estrutura JSON copiada para a área de transferência!')
    setTimeout(() => setCopiedJson(false), 2000)
  }

  // Individual user import action
  const handleImportSingle = async (user: ExternalUser) => {
    setImportingRowId(user.id)
    try {
      const payload = {
        users: [{
          email: user.email,
          full_name: user.full_name,
          phone: user.phone || '',
          resume_url: user.resume_url || '',
          course: user.course || '',
          university: user.university || '',
          profile_data: user.profile_data || null
        }]
      }

      const res = await apiClient.post<{ imported: string[]; skipped: string[]; failed: any[] }>('/api/admin/jotform/import', payload)
      
      if (res.imported.length > 0) {
        toast.success(`Estudante ${user.full_name} migrado e convidado com sucesso!`)
      } else if (res.skipped.length > 0) {
        toast.info(`O estudante ${user.full_name} já estava cadastrado.`)
      } else {
        toast.error(`Falha ao migrar ${user.full_name}: ${res.failed[0]?.error || 'Erro desconhecido'}`)
      }

      // Refresh data
      await loadLocalUsers()
      if (selectedFormId) {
        await loadSubmissions(selectedFormId)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao migrar estudante.')
    } finally {
      setImportingRowId(null)
    }
  }

  // Import Action
  const handleImportSelected = async () => {
    if (selectedUsers.length === 0) {
      toast.warning('Nenhum usuário selecionado para importação')
      return
    }

    // Filter out users that are already local
    const usersToImport = selectedUsers.filter(u => !checkIsLocal(u.email))
    
    if (usersToImport.length === 0) {
      toast.info('Todos os usuários selecionados já estão cadastrados localmente.')
      return
    }

    setImporting(true)
    try {
      const payload = {
        users: usersToImport.map(u => ({
          email: u.email,
          full_name: u.full_name,
          phone: u.phone || '',
          resume_url: u.resume_url || '',
          course: u.course || '',
          university: u.university || '',
          profile_data: u.profile_data || null
        }))
      }

      const res = await apiClient.post<{ imported: string[]; skipped: string[]; failed: any[] }>('/api/admin/jotform/import', payload)
      
      const successCount = res.imported.length
      const failCount = res.failed.length
      
      if (successCount > 0) {
        toast.success(`${successCount} estudantes importados e convidados com sucesso (+10 créditos concedidos)!`)
      }
      if (failCount > 0) {
        toast.error(`Falha ao importar ${failCount} estudantes. Verifique os logs de email.`)
      }

      // Refresh data
      await loadLocalUsers()
      if (selectedFormId) {
        await loadSubmissions(selectedFormId)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao importar usuários.')
    } finally {
      setImporting(false)
    }
  }

  // Stats computation
  const stats = useMemo(() => {
    const total = externalUsers.length
    const withResume = externalUsers.filter(u => u.has_resume).length
    const alreadyLocal = externalUsers.filter(u => checkIsLocal(u.email)).length
    return {
      total,
      withResume,
      alreadyLocal,
      availableToImport: total - alreadyLocal
    }
  }, [externalUsers, localUsers])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Importador Jotform
          </h2>
          <p className="text-muted-foreground text-sm">
            Busque submissões diretamente do Jotform, analise o cadastro dos estudantes e envie convites de acesso com 10 créditos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {recommendedForms.map(f => (
            <Button
              key={f.id}
              variant={selectedFormId === f.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFormId(f.id)}
              disabled={loadingForms || loadingUsers || importing}
            >
              {f.label}
            </Button>
          ))}
          <Button 
            onClick={loadForms} 
            disabled={loadingForms || loadingUsers || importing} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingForms ? 'animate-spin' : ''}`} />
            Carregar Formulários
          </Button>
        </div>
      </div>

      {/* Select Jotform Form */}
      <Card className="border border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Selecione o Formulário do Jotform</label>
            <select
              value={selectedFormId}
              onChange={(e) => setSelectedFormId(e.target.value)}
              disabled={loadingForms || loadingUsers || importing}
              className="w-full bg-background text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">-- Escolha um Formulário --</option>
              {forms.map(form => (
                <option key={form.id} value={form.id}>
                  {form.title} ({form.count} submissões)
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/40 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loadingUsers ? '...' : stats.total}</p>
              <p className="text-xs text-muted-foreground">Inscritos no Formulário</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="p-3 bg-green-50 dark:bg-green-950/40 rounded-xl text-green-600 dark:text-green-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loadingUsers ? '...' : stats.withResume}</p>
              <p className="text-xs text-muted-foreground">Anexaram Currículo</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loadingUsers ? '...' : stats.alreadyLocal}</p>
              <p className="text-xs text-muted-foreground">Já Cadastrados Local</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
              <Info className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loadingUsers ? '...' : stats.availableToImport}</p>
              <p className="text-xs text-muted-foreground">Disponíveis p/ Importar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50/20 dark:bg-red-950/10">
          <CardContent className="p-6 flex items-start space-x-3 text-red-800 dark:text-red-300">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">Configuração pendente ou erro de API</h4>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border/60">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Submissões no Formulário</CardTitle>
                <CardDescription>
                  Selecione os estudantes que você deseja cadastrar e enviar convite por e-mail.
                </CardDescription>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar por nome, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                    disabled={loadingUsers || importing}
                  />
                </div>
                <select
                  value={resumeFilter}
                  onChange={(e) => setResumeFilter(e.target.value as any)}
                  className="bg-background text-xs border rounded-lg p-2 h-9 focus:ring-2 focus:ring-primary focus:outline-none"
                  disabled={loadingUsers || importing}
                >
                  <option value="all">Currículos: Todos</option>
                  <option value="with_resume">Com Currículo Anexado</option>
                  <option value="without_resume">Sem Currículo Anexado</option>
                </select>
                <select
                  value={localFilter}
                  onChange={(e) => setLocalFilter(e.target.value as any)}
                  className="bg-background text-xs border rounded-lg p-2 h-9 focus:ring-2 focus:ring-primary focus:outline-none"
                  disabled={loadingUsers || importing}
                >
                  <option value="all">Status local: Todos</option>
                  <option value="new_only">Apenas Novos (Não cadastrados)</option>
                  <option value="local_only">Já Cadastrados Localmente</option>
                </select>
              </div>
            </div>

            {/* Selection Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between p-3 mt-3 bg-muted/60 dark:bg-muted/30 border rounded-lg text-sm transition-all">
                <span className="font-medium text-xs text-muted-foreground">
                  {selectedIds.size} estudante{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
                </span>
                <div className="space-x-2 flex items-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 h-8 text-xs"
                    onClick={handleCopyEmails}
                    disabled={importing}
                  >
                    {copiedEmails ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    Copiar E-mails
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 h-8 text-xs"
                    onClick={handleCopyJson}
                    disabled={importing}
                  >
                    {copiedJson ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    Copiar JSON
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleImportSelected}
                    disabled={importing}
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Processando Importação...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" />
                        Cadastrar & Enviar Convites
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Carregando submissões do Jotform...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">Nenhuma submissão correspondente aos filtros.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 text-muted-foreground whitespace-nowrap border-b border-border/40">
                    <tr>
                      <th className="px-4 py-3 w-[50px] text-center">
                        <Checkbox 
                          checked={filteredUsers.length > 0 && selectedIds.size === filteredUsers.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3">Estudante</th>
                      <th className="px-4 py-3">Contato</th>
                      <th className="px-4 py-3">Currículo</th>
                      <th className="px-4 py-3">Status Local</th>
                      <th className="px-4 py-3">Data Envio (Jotform)</th>
                      <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredUsers.map((user) => {
                      const isLocal = checkIsLocal(user.email)
                      return (
                        <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-center">
                            <Checkbox 
                              checked={selectedIds.has(user.id)}
                              onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                            />
                          </td>
                          <td className="px-4 py-3 min-w-[200px]">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-xs text-foreground">{user.full_name || 'Sem nome'}</div>
                                <div className="text-[10px] text-muted-foreground select-all">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {user.phone || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {user.has_resume ? (
                              <a 
                                href={user.resume_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Ver Currículo
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground/60">Não anexou</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isLocal ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-[10px]">
                                Cadastrado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">
                                Disponível
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {isLocal ? (
                              <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400 font-semibold gap-1">
                                <Check className="h-4 w-4" /> Concluído
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] gap-1 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                                onClick={() => handleImportSingle(user)}
                                disabled={importing || importingRowId !== null}
                              >
                                {importingRowId === user.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Migrando...
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-3 w-3" />
                                    Migrar & Convidar
                                  </>
                                )}
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
