import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useCep } from '@/hooks/useCep'
import { Loader2 } from 'lucide-react'

export default function CadastroAgenciaPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { searchCep, loading: loadingCep, error: cepError } = useCep()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    instagram: '',
    address: '',
    city: '',
    state: '',
    cep: '',
    areas: [] as string[],
    agency_type: '',
    latitude: null as number | null,
    longitude: null as number | null
  })

  const handleCepBlur = async () => {
    if (formData.cep.length === 8 || formData.cep.length === 9) {
      const cepData = await searchCep(formData.cep)
      if (cepData) {
        setFormData(prev => ({
          ...prev,
          address: cepData.logradouro,
          city: cepData.localidade,
          state: cepData.uf,
          cep: cepData.cep,
          latitude: null,
          longitude: null,
        }))
        toast.success("Endereço encontrado e preenchido!")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // if (formData) {
    //   console.log('Dados do formulário:', formData)
    //   return
    // }
    setLoading(true)
    try {
      // Remover lat/lon se não forem válidos, para não enviar strings vazias
      const submissionData = { ...formData }
      if (submissionData.latitude === null || submissionData.longitude === null) {
        delete (submissionData as Partial<typeof submissionData>).latitude
        delete (submissionData as Partial<typeof submissionData>).longitude
      }

      const { error } = await supabase
        .from('agencies')
        .insert([
          {
            ...submissionData,
            created_by: user.id,
            status: 'pending'
          }
        ])

      if (error) throw error

      toast.success('Agência cadastrada com sucesso! Aguardando aprovação.')
      navigate('/agencias')
    } catch (error) {
      console.error('Erro ao cadastrar agência:', error)
      toast.error('Erro ao cadastrar agência. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, agency_type: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Nova Agência</CardTitle>
            <CardDescription>
              Preencha os dados da agência de estágio para adicionar à nossa plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Agência *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ex: CIEE Pernambuco"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Descreva brevemente a agência e seus serviços"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="contato@agencia.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="(81) 99999-9999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.agencia.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      placeholder="@agencia"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cep">CEP *</Label>
                    <div className="relative">
                      <Input
                        id="cep"
                        name="cep"
                        value={formData.cep}
                        onChange={handleChange}
                        onBlur={handleCepBlur}
                        required
                        placeholder="00000-000"
                      />
                      {loadingCep && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                    </div>
                    {cepError && <p className="text-sm text-red-500 mt-1">{cepError}</p>}
                    <p className="text-sm text-muted-foreground mt-1">O endereço será preenchido automaticamente.</p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Endereço *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      placeholder="Recife"
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      placeholder="PE"
                      maxLength={2}
                      className="uppercase"
                    />
                  </div>
                </div>

                {process.env.NODE_ENV === 'development' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">Latitude (opcional)</Label>
                      <Input
                        id="latitude"
                        name="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude ?? ''}
                        onChange={e => {
                          const val = e.target.value
                          setFormData(prev => ({ ...prev, latitude: val === '' ? null : parseFloat(val) }))
                        }}
                        placeholder="Ex: -8.0476"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude">Longitude (opcional)</Label>
                      <Input
                        id="longitude"
                        name="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude ?? ''}
                        onChange={e => {
                          const val = e.target.value
                          setFormData(prev => ({ ...prev, longitude: val === '' ? null : parseFloat(val) }))
                        }}
                        placeholder="Ex: -34.877"
                      />
                    </div>
                  </div>
                )}

                 <div>
                  <Label htmlFor="agency_type">Tipo de Agência *</Label>
                  <Select
                    value={formData.agency_type}
                    onValueChange={handleSelectChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de agência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faculdade">Faculdade/Universidade</SelectItem>
                      <SelectItem value="consultoria">Consultoria</SelectItem>
                      <SelectItem value="agencia_privada">Agência Privada</SelectItem>
                      <SelectItem value="orgao_publico">Órgão Público</SelectItem>
                      <SelectItem value="instituto">Instituto</SelectItem>
                      <SelectItem value="fundacao">Fundação</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/agencias')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Cadastrando...' : 'Cadastrar Agência'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 