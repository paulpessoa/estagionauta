import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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

      const { data, error: creditsError } = await supabase
        .from('user_profiles')
        .select('credits, total_credits_used, total_credits_purchased')
        .eq('id', user.id)
        .single()

      if (creditsError) {
        console.error('Erro ao buscar créditos:', creditsError)
        setError('Erro ao carregar créditos')
        return
      }

      setCredits(data)
    } catch (err) {
      console.error('Erro ao buscar créditos:', err)
      setError('Erro ao carregar créditos')
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
      const { data, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (transactionsError) {
        console.error('Erro ao buscar transações:', transactionsError)
        return
      }

      setTransactions(data || [])
    } catch (err) {
      console.error('Erro ao buscar transações:', err)
    }
  }

  // Verificar se tem créditos suficientes
  const hasEnoughCredits = (required: number = 3) => {
    return credits ? credits.credits >= required : false
  }

  // Consumir créditos (chamado após análise bem-sucedida)
  const consumeCredits = async (amount: number = 3, description: string = 'Análise de currículo') => {
    if (!user || !credits) return false

    try {
      const { data, error: consumeError } = await supabase
        .rpc('consume_credits', {
          user_uuid: user.id,
          amount,
          description
        })

      if (consumeError) {
        console.error('Erro ao consumir créditos:', consumeError)
        return false
      }

      // Atualizar estado local
      setCredits(prev => prev ? {
        ...prev,
        credits: prev.credits - amount,
        total_credits_used: prev.total_credits_used + amount
      } : null)

      // Recarregar transações
      await fetchTransactions()

      return true
    } catch (err) {
      console.error('Erro ao consumir créditos:', err)
      return false
    }
  }

  // Adicionar créditos (após compra)
  const addCredits = async (amount: number, stripePaymentIntentId?: string, description: string = 'Compra de créditos') => {
    if (!user || !credits) return false

    try {
      const { error: addError } = await supabase
        .rpc('add_credits', {
          user_uuid: user.id,
          amount,
          stripe_payment_intent_id: stripePaymentIntentId,
          description
        })

      if (addError) {
        console.error('Erro ao adicionar créditos:', addError)
        return false
      }

      // Atualizar estado local
      setCredits(prev => prev ? {
        ...prev,
        credits: prev.credits + amount,
        total_credits_purchased: prev.total_credits_purchased + amount
      } : null)

      // Recarregar transações
      await fetchTransactions()

      return true
    } catch (err) {
      console.error('Erro ao adicionar créditos:', err)
      return false
    }
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
    consumeCredits,
    addCredits,
    refresh
  }
} 