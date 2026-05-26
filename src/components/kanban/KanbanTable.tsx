import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit, Trash2, Calendar, MapPin, Globe, Award } from 'lucide-react'
import { JobApplication } from '@/types/kanban'
import { cn } from '@/lib/utils'

interface KanbanTableProps {
  applications: JobApplication[]
  onStatusChange: (id: string, newStatus: JobApplication['status']) => void
  onDelete: (id: string) => void
  onEdit: (app: JobApplication) => void
  onAddReminder: (id: string) => void
  onToggleReminder: (appId: string, reminderId: string) => void
  statusConfig: Record<
    JobApplication['status'],
    { label: string; color: string; icon: any }
  >
}

export function KanbanTable({
  applications,
  onStatusChange,
  onDelete,
  onEdit,
  onAddReminder,
  statusConfig
}: KanbanTableProps) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-card">
        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma candidatura encontrada</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Use a busca ou os filtros para encontrar itens ou adicione uma nova candidatura.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden shadow-md">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="py-4">Vaga & Empresa</TableHead>
            <TableHead>Fase / Status</TableHead>
            <TableHead>Salário</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead>Próximo Lembrete</TableHead>
            <TableHead className="text-right pr-6">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => {
            const config = statusConfig[app.status]
            const activeReminders = app.reminders?.filter((r) => !r.completed) || []

            return (
              <TableRow key={app.id} className="hover:bg-muted/30 transition-colors">
                {/* Vaga e Empresa */}
                <TableCell className="font-medium max-w-[250px]">
                  <div>
                    <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                      {app.company}
                      {app.website && (
                        <a
                          href={app.website.startsWith('http') ? app.website : `https://${app.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Visitar Site"
                        >
                          <Globe className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{app.position}</div>
                    {app.tags && app.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                        {app.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{app.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Fase / Status (Interactive badge dropdown) */}
                <TableCell>
                  <Select
                    value={app.status}
                    onValueChange={(val) => onStatusChange(app.id, val as JobApplication['status'])}
                  >
                    <SelectTrigger
                      className={cn(
                        'w-[135px] h-8 text-xs font-semibold rounded-full border-none shadow-none focus:ring-0 cursor-pointer justify-center gap-1.5 px-3',
                        config?.color || 'bg-gray-100 text-gray-800'
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, item]) => (
                        <SelectItem key={key} value={key} className="text-xs font-medium cursor-pointer">
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Salário */}
                <TableCell className="font-semibold text-sm text-foreground/80">
                  {app.salary || '—'}
                </TableCell>

                {/* Localização */}
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    <span className="truncate max-w-[150px]">{app.location || 'Não informado'}</span>
                  </div>
                </TableCell>

                {/* Progresso */}
                <TableCell className="w-[130px]">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                      <span>Progresso</span>
                      <span>{app.progress}%</span>
                    </div>
                    <Progress value={app.progress} className="h-1.5 bg-muted" />
                  </div>
                </TableCell>

                {/* Próximo Lembrete */}
                <TableCell>
                  {activeReminders.length === 0 ? (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  ) : (
                    (() => {
                      const nextReminder = activeReminders.reduce((earliest, current) => {
                        return new Date(current.date) < new Date(earliest.date) ? current : earliest
                      }, activeReminders[0])

                      return (
                        <div
                          className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium"
                          title={`${nextReminder.title}: ${nextReminder.description}`}
                        >
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{new Date(nextReminder.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )
                    })()
                  )}
                </TableCell>

                {/* Ações */}
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={() => onEdit(app)}
                      title="Editar Vaga"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                      onClick={() => onAddReminder(app.id)}
                      title="Adicionar Lembrete"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => onDelete(app.id)}
                      title="Excluir Vaga"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
