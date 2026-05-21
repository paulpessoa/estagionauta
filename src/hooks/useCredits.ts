import { useState, useEffect } from 'react'
import { apiClient } from '../lib/apiClient'
import { useAuth } from './useAuth'

export interface CreditTransaction {
  id: string
  type: 'purchase' | 'usage' | 'refund' | 'bonus'
  amount: number
  description: string
  stripe_payment_intent_id?: string
  created_at: string
}

export interface UserCredits {
  credits: number
  total_credits_used: number
  total_credits_purchased: number
}

export const useCredits = () => {
  const { user } = useAuth()
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar créditos do usuário
  const fetchCredits = async () => {
    if (!user) {
      setCredits(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await apiClient.get<UserCredits>('/api/credits')
      setCredits(data)
    } catch (err: any) {
      console.error('Erro ao buscar créditos:', err)
      setError(err.message || 'Erro ao carregar créditos')
    } finally {
      setLoading(false)
    }
  }

  // Buscar histórico de transações
  const fetchTransactions = async () => {
    if (!user) {
      setTransactions([])
      return
    }

    try {
      const data = await apiClient.get<CreditTransaction[]>('/api/credits/transactions')
      setTransactions(data || [])
    } catch (err) {
      console.error('Erro ao buscar transações:', err)
    }
  }

  // Verificar se tem créditos suficientes
  const hasEnoughCredits = (required: number = 3) => {
    return credits ? credits.credits >= required : false
  }

  // Recarregar dados
  const refresh = async () => {
    await Promise.all([fetchCredits(), fetchTransactions()])
  }

  // Efeitos
  useEffect(() => {
    fetchCredits()
  }, [user])

  useEffect(() => {
    fetchTransactions()
  }, [user])

  return {
    credits,
    transactions,
    loading,
    error,
    hasEnoughCredits,
    refresh
  }
}
 