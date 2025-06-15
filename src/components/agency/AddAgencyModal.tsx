
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { X, Plus } from 'lucide-react'

interface AddAgencyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAgencyAdded: () => void
}

export function AddAgencyModal({ open, onOpenChange, onAgencyAdded }: AddAgencyModalProps) {
  const [loading, setLoading] = useState(false)
  const [currentArea, setCurrentArea] = useState('')
  const { toast } = useToast()
  const { user } = useAuth()

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
    is_whatsapp: false
  })

  const handleAddArea = () => {
    if (currentArea.trim() && !formData.areas.includes(currentArea.trim())) {
      setFormData(prev => ({
        ...prev,
        areas: [...prev.areas, currentArea.trim()]
      }))
      setCurrentArea('')
    }
  }

  const handleRemoveArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.filter(a => a !== area)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('agencies')
        .insert({
          ...formData,
          created_by: user.id,
          status: 'pending'
        })

      if (error) throw error

      toast({
        title: "Agência adicionada",
        description: "Agência enviada para moderação. Será analisada em breve.",
      })

      // Reset form
      setFormData({
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
        areas: [],
        is_whatsapp: false
      })

      onAgencyAdded()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar agência",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Agência</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome da Agência *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div>
            <Label>Áreas de Atuação</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                placeholder="Ex: Tecnologia, Marketing..."
                value={currentArea}
                onChange={(e) => setCurrentArea(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArea())}
              />
              <Button type="button" onClick={handleAddArea} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.areas.map((area, index) => (
                <Badge key={index} variant="secondary">
                  {area}
                  <button
                    type="button"
                    onClick={() => handleRemoveArea(area)}
                    className="ml-2 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Adicionar Agência"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
