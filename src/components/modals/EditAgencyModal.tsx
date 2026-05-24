
import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { Agency } from '@/types/agency'
import { Upload, Camera, X, Loader2 } from 'lucide-react'

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
    logo_url: '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        logo_url: agency.logo_url || '',
      })
      setLogoPreview(agency.logo_url || '')
      setLogoFile(null)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview('')
    setFormData(prev => ({
      ...prev,
      logo_url: ''
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!agency) return
    
    setLoading(true)
    try {
      let uploadedLogoUrl = formData.logo_url

      if (logoFile) {
        setUploadingLogo(true)
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${agency.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('agency-logos')
          .upload(fileName, logoFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('agency-logos')
          .getPublicUrl(fileName)

        uploadedLogoUrl = publicUrl
      }

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
          logo_url: uploadedLogoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agency.id)

      if (error) throw error

      const updatedAgency: Agency = { 
        ...agency, 
        ...formData, 
        logo_url: uploadedLogoUrl 
      }
      onSave(updatedAgency)
      onClose()
      
      toast.success('Agência atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar agência:', error)
      toast.error('Erro ao atualizar agência. Tente novamente.')
    } finally {
      setLoading(false)
      setUploadingLogo(false)
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
          {/* Logo Upload Section */}
          <div className="flex items-center gap-4 border-b pb-4 mb-2">
            <div className="relative h-16 w-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" />
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-1.5">
              <Label>Logo da Agência</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="h-8 text-xs flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Escolher Logo
                </Button>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={loading}
                    className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900 flex items-center gap-1.5"
                  >
                    <X className="h-3.5 w-3.5 text-red-600" />
                    Remover
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="text-[10px] text-muted-foreground">
                Formatos suportados: PNG, JPG, JPEG. Máx 5MB.
              </span>
            </div>
          </div>

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
