
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { X, Plus, MapPin } from 'lucide-react'

const agencySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  cep: z.string().optional(),
  agency_type: z.string().optional(),
  is_whatsapp: z.boolean().default(false),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
})

type AgencyFormData = z.infer<typeof agencySchema>

interface Agency extends AgencyFormData {
  id: string
  areas: string[] | null
  latitude: number | null
  longitude: number | null
  is_verified: boolean
  status: string
  rating: number | null
  total_reviews: number | null
  created_at: string
  updated_at: string
  created_by: string
  verified_by: string | null
  verified_at: string | null
  logo_url: string | null
}

interface AgencyFormProps {
  agency?: Agency
  onSubmit: (data: AgencyFormData & { areas: string[] }) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function AgencyForm({ agency, onSubmit, onCancel, loading = false }: AgencyFormProps) {
  const [areas, setAreas] = useState<string[]>(agency?.areas || [])
  const [currentArea, setCurrentArea] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<AgencyFormData>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      name: agency?.name || '',
      description: agency?.description || '',
      email: agency?.email || '',
      phone: agency?.phone || '',
      website: agency?.website || '',
      instagram: agency?.instagram || '',
      address: agency?.address || '',
      city: agency?.city || '',
      state: agency?.state || '',
      cep: agency?.cep || '',
      agency_type: agency?.agency_type || '',
      is_whatsapp: agency?.is_whatsapp || false,
      latitude: agency?.latitude || null,
      longitude: agency?.longitude || null,
    }
  })

  const handleAddArea = () => {
    if (currentArea.trim() && !areas.includes(currentArea.trim())) {
      setAreas(prev => [...prev, currentArea.trim()])
      setCurrentArea('')
    }
  }

  const handleRemoveArea = (area: string) => {
    setAreas(prev => prev.filter(a => a !== area))
  }

  const handleGeocodeAddress = async () => {
    const address = form.getValues('address')
    const city = form.getValues('city')
    const state = form.getValues('state')
    
    if (!address && !city) {
      toast({
        title: "Endereço necessário",
        description: "Preencha pelo menos o endereço ou cidade para obter coordenadas",
        variant: "destructive"
      })
      return
    }

    setGeoLoading(true)
    try {
      const fullAddress = [address, city, state].filter(Boolean).join(', ')
      
      // Using a free geocoding service (you should replace with Google Maps Geocoding API)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`)
      const data = await response.json()
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        
        form.setValue('latitude', lat)
        form.setValue('longitude', lng)
        
        toast({
          title: "Coordenadas obtidas",
          description: `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`
        })
      } else {
        toast({
          title: "Endereço não encontrado",
          description: "Não foi possível obter as coordenadas do endereço informado",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao obter coordenadas",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      })
    } finally {
      setGeoLoading(false)
    }
  }

  const handleFormSubmit = async (data: AgencyFormData) => {
    await onSubmit({ ...data, areas })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Agência *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agency_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Agência</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Estágio, Emprego, Trainee..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_whatsapp"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Telefone é WhatsApp</FormLabel>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram</FormLabel>
                <FormControl>
                  <Input placeholder="@usuario ou link completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <div className="flex space-x-2">
                  <Input {...field} />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeocodeAddress}
                    disabled={geoLoading}
                    className="whitespace-nowrap"
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    {geoLoading ? "..." : "Coordenadas"}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input placeholder="SP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <Input placeholder="00000-000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Ex: -8.0476"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      field.onChange(val === '' ? null : parseFloat(val))
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Ex: -34.877"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      field.onChange(val === '' ? null : parseFloat(val))
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Áreas de Atuação</FormLabel>
          <div className="flex space-x-2 mt-2 mb-3">
            <Input
              placeholder="Ex: Tecnologia, Marketing..."
              value={currentArea}
              onChange={(e) => setCurrentArea(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArea())}
            />
            <Button type="button" onClick={handleAddArea} size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {areas.map((area, index) => (
              <Badge key={index} variant="secondary">
                {area}
                <button
                  type="button"
                  onClick={() => handleRemoveArea(area)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : agency ? "Atualizar" : "Criar"} Agência
          </Button>
        </div>
      </form>
    </Form>
  )
}
