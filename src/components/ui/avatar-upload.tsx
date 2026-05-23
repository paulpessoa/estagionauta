import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Upload, 
  Camera, 
  X, 
  Loader2, 
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  onAvatarUpdate: (url: string) => void
  userId: string
  userName?: string | null
  compact?: boolean
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  onAvatarUpdate, 
  userId, 
  userName,
  compact = false
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem')
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB')
      return
    }

    setError(null)
    
    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !userId) return

    try {
      setUploading(true)
      setError(null)

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName)

      // Atualizar perfil no banco
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      // Limpar preview e input
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Notificar componente pai
      onAvatarUpdate(publicUrl)

      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      })

    } catch (error) {
      console.error('Error uploading avatar:', error)
      setError('Erro ao fazer upload da imagem. Tente novamente.')
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da imagem. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!userId) return

    try {
      setUploading(true)

      // Remover do banco
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Limpar preview
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Notificar componente pai
      onAvatarUpdate('')

      toast({
        title: "Foto removida",
        description: "Sua foto de perfil foi removida.",
      })

    } catch (error) {
      console.error('Error removing avatar:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover foto. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = previewUrl || currentAvatarUrl

  const content = (
    <div className={`flex ${compact ? 'flex-row items-center gap-4 space-y-0' : 'flex-col items-center space-y-4'}`}>
      {/* Avatar Preview */}
      <div className="relative shrink-0">
        <Avatar className={compact ? "h-16 w-16" : "h-24 w-24"}>
          <AvatarImage src={displayUrl || undefined} />
          <AvatarFallback className={compact ? "text-sm" : "text-lg"}>
            {userName ? getInitials(userName) : 'U'}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload Progress Indicator */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div className={`flex flex-col ${compact ? 'items-start space-y-2' : 'items-center space-y-3'} w-full`}>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Escolher Foto
          </Button>
          
          {displayUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveAvatar}
              disabled={uploading}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              Remover
            </Button>
          )}
        </div>

        {/* Hidden File Input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload Button */}
        {previewUrl && !uploading && (
          <Button
            onClick={handleUpload}
            size="sm"
            className="w-full flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Fazer Upload
          </Button>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Success Message */}
        {!error && !uploading && previewUrl && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            Imagem selecionada
          </div>
        )}
      </div>

      {/* Instructions */}
      {!compact && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Formatos aceitos: JPG, PNG, GIF</p>
          <p>Tamanho máximo: 5MB</p>
        </div>
      )}
    </div>
  )

  if (compact) {
    return content
  }

  return (
    <Card>
      <CardContent className="p-6">
        {content}
      </CardContent>
    </Card>
  )
} 