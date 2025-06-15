
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { Agency } from '@/types/agency'

interface EditAgencyModalProps {
  isOpen: boolean
  onClose: () => void
  agency: Agency | null
  onSave: (updatedAgency: Agency) => void
}

export function EditAgencyModal({ isOpen, onClose, agency, onSave }: EditAgencyModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    cep: '',
    website: '',
    instagram: '',
    agency_type: '',
    areas: [] as string[],
    latitude: null as number | null,
    longitude: null as number | null,
  })

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name || '',
        description: agency.description || '',
        email: agency.email || '',
        phone: agency.phone || '',
        address: agency.address || '',
        city: agency.city || '',
        state: agency.state || '',
        cep: agency.cep || '',
        website: agency.website || '',
        instagram: agency.instagram || '',
        agency_type: agency.agency_type || '',
        areas: agency.areas || [],
        latitude: agency.latitude || null,
        longitude: agency.longitude || null,
      })
    }
  }, [agency])

  const handleChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAreasChange = (value: string) => {
    const areasArray = value.split(',').map(area => area.trim()).filter(area => area.length > 0)
    setFormData(prev => ({
      ...prev,
      areas: areasArray,
    }))
  }

  const handleSubmit = async () => {
    if (!agency) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('agencies')
        .update({
          name: formData.name,
          description: formData.description,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          cep: formData.cep,
          website: formData.website,
          instagram: formData.instagram,
          agency_type: formData.agency_type,
          areas: formData.areas,
          latitude: formData.latitude,
          longitude: formData.longitude,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agency.id)

      if (error) throw error

      const updatedAgency = { ...agency, ...formData }
      onSave(updatedAgency)
      onClose()
      
      toast.success('Agência atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar agência:', error)
      toast.error('Erro ao atualizar agência. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!agency) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Agência</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="agency_type">Tipo de Agência</Label>
              <Select
                value={formData.agency_type}
                onValueChange={value => handleChange('agency_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
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

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={e => handleChange('city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={e => handleChange('state', e.target.value)}
                maxLength={2}
                className="uppercase"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={formData.cep}
              onChange={e => handleChange('cep', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude (opcional)</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude ?? ''}
                onChange={e => {
                  const val = e.target.value
                  handleChange('latitude', val === '' ? null : parseFloat(val))
                }}
                placeholder="Ex: -8.0476"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude (opcional)</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude ?? ''}
                onChange={e => {
                  const val = e.target.value
                  handleChange('longitude', val === '' ? null : parseFloat(val))
                }}
                placeholder="Ex: -34.877"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={e => handleChange('website', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={e => handleChange('instagram', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="areas">Áreas (separadas por vírgula)</Label>
            <Input
              id="areas"
              value={formData.areas.join(', ')}
              onChange={e => handleAreasChange(e.target.value)}
              placeholder="Ex: Tecnologia, Marketing, Administração"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
