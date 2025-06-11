import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Agency } from '@/types/agency'

interface EditAgencyModalProps {
  isOpen: boolean
  onClose: () => void
  agency: Agency | null
  onSave: (updatedAgency: Agency) => void
}

export function EditAgencyModal({ isOpen, onClose, agency, onSave }: EditAgencyModalProps) {
  const { toast } = useToast()

  const [formData, setFormData] = useState<Agency>({
    id: '',
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
    areas: [],
    status: 'pending',
    created_at: '',
    verified_by: null,
    verified_at: null,
    latitude: null,
    longitude: null,
    rating: null,
    total_reviews: null,
    logo_url: '',
    agency_type: '',
    updated_at: '',
  })

  useEffect(() => {
    if (agency) {
      setFormData(agency)
    }
  }, [agency])

  const handleChange = (field: keyof Agency, value: string | string[] | null) => {
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
          areas: formData.areas,
          status: formData.status,
        })
        .eq('id', formData.id)

      if (error) throw error

      toast({
        title: 'Agência atualizada',
        description: 'As informações da agência foram atualizadas com sucesso.',
        variant: 'default',
      })

      onSave(formData)
      onClose()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar a agência.',
        variant: 'destructive',
      })
    }
  }

  if (!agency) return null

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Agência</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={e => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={e => handleChange('email', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={e => handleChange('phone', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={e => handleChange('address', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={formData.city || ''}
              onChange={e => handleChange('city', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              value={formData.state || ''}
              onChange={e => handleChange('state', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={formData.cep || ''}
              onChange={e => handleChange('cep', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website || ''}
              onChange={e => handleChange('website', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={formData.instagram || ''}
              onChange={e => handleChange('instagram', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="areas">Áreas (separadas por vírgula)</Label>
            <Input
              id="areas"
              value={formData.areas.join(', ')}
              onChange={e => handleAreasChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}