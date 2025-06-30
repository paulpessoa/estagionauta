import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { CheckCircle, AlertCircle, Clock, Mail, ExternalLink } from 'lucide-react'
import { supabase } from '../integrations/supabase/client'
import { Link } from 'react-router-dom'

interface EmailStatusNotificationProps {
  emailId?: string
  onClose?: () => void
}

interface EmailLog {
  id: string
  to_email: string
  subject: string
  status: 'pending' | 'sent' | 'failed'
  provider_id?: string
  error_message?: string
  created_at: string
  sent_at?: string
}

export function EmailStatusNotification({ emailId, onClose }: EmailStatusNotificationProps) {
  const [emailLog, setEmailLog] = useState<EmailLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    if (emailId) {
      loadEmailLog()
      startPolling()
    }
  }, [emailId])

  const loadEmailLog = async () => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('id', emailId)
        .single()

      if (error) {
        console.error('Error loading email log:', error)
        return
      }

      setEmailLog(data)
      
      // Se o email ainda está pendente, continuar polling
      if (data.status === 'pending') {
        setPolling(true)
      } else {
        setPolling(false)
      }
    } catch (error) {
      console.error('Error loading email log:', error)
    } finally {
      setLoading(false)
    }
  }

  const startPolling = () => {
    const interval = setInterval(async () => {
      if (!polling) {
        clearInterval(interval)
        return
      }

      await loadEmailLog()
    }, 5000) // Poll a cada 5 segundos

    return () => clearInterval(interval)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />
      default:
        return <Mail className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Enviado</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Falhou</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Enviando...</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm">Verificando status do email...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!emailLog) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Email não encontrado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon(emailLog.status)}
            <span className="font-medium text-sm">Status do Email</span>
          </div>
          {getStatusBadge(emailLog.status)}
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Para:</span> {emailLog.to_email}
          </div>
          <div>
            <span className="font-medium">Assunto:</span> {emailLog.subject}
          </div>
          {emailLog.provider_id && (
            <div>
              <span className="font-medium">ID do Provedor:</span> {emailLog.provider_id}
            </div>
          )}
          {emailLog.sent_at && (
            <div>
              <span className="font-medium">Enviado em:</span> {new Date(emailLog.sent_at).toLocaleString('pt-BR')}
            </div>
          )}
          {emailLog.error_message && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-800">
              <span className="font-medium">Erro:</span> {emailLog.error_message}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t">
          <Link 
            to="/email-logs" 
            className="flex-1"
            onClick={onClose}
          >
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Histórico
            </Button>
          </Link>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>

        {polling && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            Atualizando automaticamente...
          </div>
        )}
      </CardContent>
    </Card>
  )
} 