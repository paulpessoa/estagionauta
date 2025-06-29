import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon, Bell, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Reminder } from '@/types/kanban'

interface AddReminderModalProps {
  isOpen: boolean
  onClose: () => void
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'completed'>) => void
}

const reminderTypes = [
  { value: 'call', label: 'Ligação', description: 'Ligar para empresa/recrutador' },
  { value: 'email', label: 'Email', description: 'Enviar email de follow-up' },
  { value: 'test', label: 'Teste', description: 'Realizar teste técnico' },
  { value: 'interview', label: 'Entrevista', description: 'Preparar para entrevista' },
  { value: 'follow-up', label: 'Follow-up', description: 'Acompanhamento geral' },
  { value: 'deadline', label: 'Prazo', description: 'Data limite importante' }
]

export function AddReminderModal({ isOpen, onClose, onAddReminder }: AddReminderModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date(),
    type: 'follow-up' as Reminder['type']
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório')
      return
    }

    onAddReminder({
      title: formData.title,
      description: formData.description,
      date: formData.date,
      type: formData.type
    })

    // Reset form
    setFormData({
      title: '',
      description: '',
      date: new Date(),
      type: 'follow-up'
    })

    onClose()
    toast.success('Lembrete adicionado com sucesso!')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Adicionar Lembrete
          </DialogTitle>
          <DialogDescription>
            Configure um lembrete para acompanhar suas candidaturas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Ligar para recrutador"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes do lembrete"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo de Lembrete</Label>
            <Select value={formData.type} onValueChange={(value: Reminder['type']) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reminderTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data e Hora</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                  initialFocus
                />
                <div className="p-3 border-t">
                  <Input
                    type="time"
                    value={format(formData.date, 'HH:mm')}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':')
                      const newDate = new Date(formData.date)
                      newDate.setHours(parseInt(hours), parseInt(minutes))
                      setFormData(prev => ({ ...prev, date: newDate }))
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Lembrete
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 