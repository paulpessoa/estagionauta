
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Settings, 
  Mail, 
  Download,
  Eye,
  MessageSquare,
  Calendar
} from 'lucide-react'

export default function AdminPage() {
  // Mock data for demo
  const stats = {
    totalUsers: 1247,
    resumesAnalyzed: 89,
    mentorshipRequests: 34,
    activeUsers: 156
  }

  const recentSubmissions = [
    {
      id: 1,
      name: "Maria Silva",
      email: "maria@email.com",
      course: "Engenharia de Software",
      university: "UPE",
      submittedAt: "2025-01-15T10:30:00Z",
      status: "pending"
    },
    {
      id: 2,
      name: "João Santos",
      email: "joao@email.com",
      course: "Administração",
      university: "UFPE",
      submittedAt: "2025-01-15T09:15:00Z",
      status: "processed"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Painel Administrativo 📊
          </h1>
          <p className="text-xl text-muted-foreground">
            Gerencie usuários, análises de currículo e configurações da plataforma
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-muted-foreground">Usuários totais</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resumesAnalyzed}</p>
                <p className="text-muted-foreground">Currículos analisados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.mentorshipRequests}</p>
                <p className="text-muted-foreground">Solicitações de mentoria</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
                <p className="text-muted-foreground">Usuários ativos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="submissions">Submissões</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Análises de Currículo Recentes</CardTitle>
                <CardDescription>
                  Gerencie e monitore as submissões de currículos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSubmissions.map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{submission.name}</p>
                          <Badge variant={submission.status === 'processed' ? 'default' : 'secondary'}>
                            {submission.status === 'processed' ? 'Processado' : 'Pendente'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{submission.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {submission.course} - {submission.university}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-1" />
                          Enviar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>
                  Visualize e gerencie todos os usuários da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Área em desenvolvimento</h3>
                  <p className="text-muted-foreground">
                    As funcionalidades de gerenciamento de usuários serão implementadas em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics e Relatórios</CardTitle>
                <CardDescription>
                  Acompanhe métricas e tendências da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Área em desenvolvimento</h3>
                  <p className="text-muted-foreground">
                    Dashboards detalhados com métricas e relatórios serão implementados em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>
                  Gerencie configurações globais da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-4">Configurações de Email</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Mail className="h-4 w-4 mr-2" />
                        Configurar SMTP
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Templates de Email
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Integrações</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar OpenAI API
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Webhook Settings
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Backups</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Dados
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar Backups
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
