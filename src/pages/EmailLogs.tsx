import React, { useState, useEffect } from 'react'
import { supabase } from '../integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Calendar } from '../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { CalendarIcon, Search, Filter, Download } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '../lib/utils'

interface EmailLog {
  id: string
  to_email: string
  from_email: string
  subject: string
  status: 'pending' | 'sent' | 'failed'
  provider: string
  provider_id?: string
  template_name?: string
  sent_at?: string
  error_message?: string
  profile_id?: string
  curriculum_slug?: string
  created_at: string
}

export default function EmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<Date | undefined>()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    getUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadEmailLogs()
    }
  }, [user, searchTerm, statusFilter, dateFilter])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadEmailLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })

      // Filtrar por usuário (apenas logs do usuário atual)
      if (user) {
        query = query.eq('profile_id', user.id)
      }

      // Filtro por status
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // Filtro por data
      if (dateFilter) {
        const startOfDay = new Date(dateFilter)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(dateFilter)
        endOfDay.setHours(23, 59, 59, 999)
        
        query = query
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString())
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading email logs:', error)
        return
      }

      // Filtro por termo de busca
      let filteredData = data || []
      if (searchTerm) {
        filteredData = filteredData.filter(log => 
          log.to_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.curriculum_slug?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setLogs(filteredData)
    } catch (error) {
      console.error('Error loading email logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Enviado</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Falhou</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ['Data', 'Para', 'Assunto', 'Status', 'Provedor', 'Slug do Currículo', 'Erro'],
      ...logs.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        log.to_email,
        log.subject,
        log.status,
        log.provider,
        log.curriculum_slug || '',
        log.error_message || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `email_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Logs de E-mail</h1>
          <p>Faça login para visualizar seus logs de e-mail.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Logs de E-mail</h1>
        <Button onClick={exportLogs} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Email, assunto ou slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sent">Enviados</SelectItem>
                  <SelectItem value="failed">Falharam</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFilter && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "PPP", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setDateFilter(undefined)
                }}
                variant="outline"
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Carregando logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhum log de e-mail encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{log.to_email}</span>
                      {getStatusBadge(log.status)}
                    </div>
                    <h3 className="font-semibold text-lg">{log.subject}</h3>
                    {log.curriculum_slug && (
                      <p className="text-sm text-muted-foreground">
                        Currículo: {log.curriculum_slug}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Provedor:</span> {log.provider}
                  </div>
                  <div>
                    <span className="font-medium">Template:</span> {log.template_name || '-'}
                  </div>
                  {log.provider_id && (
                    <div>
                      <span className="font-medium">ID do Provedor:</span> {log.provider_id}
                    </div>
                  )}
                  {log.sent_at && (
                    <div>
                      <span className="font-medium">Enviado em:</span> {format(new Date(log.sent_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  )}
                </div>

                {log.error_message && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      <span className="font-medium">Erro:</span> {log.error_message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estatísticas */}
      {logs.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {logs.filter(log => log.status === 'sent').length}
                </div>
                <div className="text-sm text-muted-foreground">Enviados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {logs.filter(log => log.status === 'failed').length}
                </div>
                <div className="text-sm text-muted-foreground">Falharam</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {logs.filter(log => log.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {logs.length}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 