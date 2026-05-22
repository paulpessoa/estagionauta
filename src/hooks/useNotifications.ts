import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { useCredits } from './useCredits'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
  action_url?: string
}

export const useNotifications = () => {
  const { user } = useAuth()
  const { credits } = useCredits()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Buscar notificações do usuário
  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Por enquanto, usar notificações mock
      // TODO: Implementar tabela de notificações no Supabase
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Bem-vindo ao Estagionauta!',
          message: 'Você recebeu 20 créditos gratuitos para começar suas análises.',
          type: 'success',
          read: false,
          created_at: new Date().toISOString(),
          action_url: '/precos'
        },
        {
          id: '2',
          title: 'Análise Concluída',
          message: 'Sua análise de currículo foi concluída com sucesso!',
          type: 'info',
          read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          action_url: '/minhas-analises'
        }
      ]

      // Adicionar notificação de créditos baixos se aplicável
      if (credits && credits.credits <= 5) {
        mockNotifications.unshift({
          id: 'low-credits',
          title: 'Créditos Baixos',
          message: `Você tem apenas ${credits.credits} créditos restantes. Compre mais para continuar analisando!`,
          type: 'warning',
          read: false,
          created_at: new Date().toISOString(),
          action_url: '/precos'
        })
      }

      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
  }

  // Adicionar notificação
  const addNotification = (notification: Omit<Notification, 'id' | 'created_at'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    
    setNotifications(prev => [newNotification, ...prev])
    if (!newNotification.read) {
      setUnreadCount(prev => prev + 1)
    }
  }

  // Efeito para buscar notificações quando o usuário muda
  useEffect(() => {
    fetchNotifications()
  }, [user, credits])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    addNotification,
    refresh: fetchNotifications
  }
} 