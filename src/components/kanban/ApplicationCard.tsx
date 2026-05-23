import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { JobApplication } from '@/types/kanban'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Eye, 
  Edit, 
  Phone, 
  Mail, 
  Bell, 
  MapPin, 
  Users, 
  ExternalLink, 
  Trash2 
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export interface ApplicationCardProps {
  application: JobApplication
  onStatusChange: (id: string, status: JobApplication['status']) => void
  onAddReminder: (applicationId: string) => void
  onToggleReminder: (applicationId: string, reminderId: string) => void
  onDelete: (id: string) => void
  onEdit: (application: JobApplication) => void
}

export function ApplicationCard({ application, onStatusChange, onAddReminder, onToggleReminder, onDelete, onEdit }: ApplicationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('applicationId', application.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow active:cursor-grabbing hover:border-primary/50"
      draggable="true"
      onDragStart={handleDragStart}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm line-clamp-2">{application.position}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">{application.company}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progresso</span>
              <span>{application.progress}%</span>
            </div>
            <Progress value={application.progress} className="h-2" />
          </div>

          {/* Tags */}
          {application.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {application.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {application.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{application.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Next Action & Quick Status */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            {application.nextAction ? (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <Clock className="h-3 w-3 inline mr-1" />
                {application.nextAction}
              </div>
            ) : (
              <div className="text-xs text-gray-400">Sem próximas ações</div>
            )}
            
            {/* Quick Status Selector */}
            <div onClick={e => e.stopPropagation()}>
              <Select 
                value={application.status} 
                onValueChange={(val) => onStatusChange(application.id, val as JobApplication['status'])}
              >
                <SelectTrigger className="h-6 text-[10px] w-auto border-none bg-gray-50 dark:bg-gray-800 px-2 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interested">Interessado</SelectItem>
                  <SelectItem value="applied">Candidatado</SelectItem>
                  <SelectItem value="test">Teste</SelectItem>
                  <SelectItem value="interview">Entrevista</SelectItem>
                  <SelectItem value="offer">Proposta</SelectItem>
                  <SelectItem value="rejected">Recusado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDetails(true)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Detalhes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEdit(application)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="ghost" className="text-xs">
                  <Phone className="h-3 w-3 mr-1" />
                  Ligar
                </Button>
                <Button size="sm" variant="ghost" className="text-xs">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
              </div>

              {/* Reminders */}
              {application.reminders.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">Lembretes:</p>
                  {application.reminders.slice(0, 2).map(reminder => (
                    <div key={reminder.id} className="text-xs bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                      <p className="font-medium">{reminder.title}</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {format(new Date(reminder.date), 'dd/MM', { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Reminder Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAddReminder(application.id)}
                className="w-full text-xs"
              >
                <Bell className="h-3 w-3 mr-1" />
                Adicionar Lembrete
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{application.position}</DialogTitle>
            <DialogDescription>{application.company}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Localização</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {application.location}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Salário</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {application.salary || 'Não informado'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Data da Candidatura</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(new Date(application.appliedDate), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Progresso</Label>
                <div className="flex items-center gap-2">
                  <Progress value={application.progress} className="flex-1 h-2" />
                  <span className="text-sm">{application.progress}%</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            {(application.contactPerson || application.contactEmail || application.contactPhone) && (
              <div>
                <Label className="text-sm font-medium">Informações de Contato</Label>
                <div className="space-y-2 mt-2">
                  {application.contactPerson && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <Users className="h-3 w-3 inline mr-1" />
                      {application.contactPerson}
                    </p>
                  )}
                  {application.contactEmail && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-3 w-3 inline mr-1" />
                      {application.contactEmail}
                    </p>
                  )}
                  {application.contactPhone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-3 w-3 inline mr-1" />
                      {application.contactPhone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {application.description && (
              <div>
                <Label className="text-sm font-medium">Descrição</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {application.description}
                </p>
              </div>
            )}

            {/* Notes */}
            {application.notes && (
              <div>
                <Label className="text-sm font-medium">Observações</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {application.notes}
                </p>
              </div>
            )}

            {/* Tags */}
            {application.tags.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {application.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Reminders */}
            {application.reminders.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Lembretes</Label>
                <div className="space-y-2 mt-2">
                  {application.reminders.map(reminder => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{reminder.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {reminder.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(reminder.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      <Switch 
                        checked={reminder.completed} 
                        onCheckedChange={() => onToggleReminder(application.id, reminder.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Vaga
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowDetails(false)
                  onEdit(application)
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>

            {/* Add Reminder Button in Details */}
            <Button
              variant="outline"
              onClick={() => onAddReminder(application.id)}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Adicionar Lembrete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <ConfirmDialog 
        isOpen={showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(application.id)
          setShowDetails(false)
        }}
        title="Excluir Candidatura"
        description="Tem certeza que deseja excluir permanentemente esta candidatura e todo o seu histórico?"
        variant="destructive"
        confirmText="Excluir"
      />
    </Card>
  )
}
