import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { useCredits } from './useCredits'
import { apiClient } from '@/lib/apiClient'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'system'
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
      const data = await apiClient.get<Notification[]>('/api/notifications')
      
      const displayNotifications = [...(data || [])]
      if (credits && credits.credits <= 5) {
        // Evitar duplicados
        if (!displayNotifications.some(n => n.id === 'low-credits')) {
          displayNotifications.unshift({
            id: 'low-credits',
            title: 'Créditos Baixos',
            message: `Você tem apenas ${credits.credits} créditos restantes. Compre mais para continuar analisando!`,
            type: 'warning',
            read: false,
            created_at: new Date().toISOString(),
            action_url: '/precos'
          })
        }
      }

      setNotifications(displayNotifications)
      setUnreadCount(displayNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    if (notificationId === 'low-credits') {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      return
    }

    try {
      await apiClient.put(`/api/notifications/${notificationId}/read`, {})
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erro ao ler notificação:', error)
    }
  }

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      await apiClient.put('/api/notifications/read-all', {})
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Erro ao ler todas as notificações:', error)
    }
  }

  // Excluir notificação
  const deleteNotification = async (notificationId: string) => {
    if (notificationId === 'low-credits') {
      setNotifications(prev => prev.filter(n => n.id !== 'low-credits'))
      return
    }

    try {
      await apiClient.delete(`/api/notifications/${notificationId}`)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setUnreadCount(prev => {
        const deletedNotif = notifications.find(n => n.id === notificationId)
        return deletedNotif && !deletedNotif.read ? Math.max(0, prev - 1) : prev
      })
    } catch (error) {
      console.error('Erro ao excluir notificação:', error)
    }
  }

  // Adicionar notificação (para fins de disparo local se necessário)
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
  }, [user, credits?.credits])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    refresh: fetchNotifications
  }
} 