import { useState } from 'react'

interface CepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
}

export function useCep() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchCep = async (cep: string): Promise<CepResponse | null> => {
    try {
      setLoading(true)
      setError(null)

      // Remove caracteres não numéricos
      const cleanCep = cep.replace(/\D/g, '')

      if (cleanCep.length !== 8) {
        throw new Error('CEP inválido')
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        throw new Error('CEP não encontrado')
      }

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar CEP')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    searchCep,
    loading,
    error
  }
} 