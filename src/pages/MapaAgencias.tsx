
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MapPin, Star, Search, Filter, Users, Building, Phone, Globe } from 'lucide-react'

export default function MapaAgenciasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Mock data for agencies
  const agencies = [
    {
      id: 1,
      name: "Agência UPE Carreiras",
      description: "Especializada em conectar estudantes da UPE com oportunidades de estágio",
      location: "Recife, PE",
      rating: 4.8,
      reviews: 156,
      areas: ["Tecnologia", "Engenharia", "Administração"],
      contact: {
        phone: "(81) 3123-4567",
        website: "www.upecarreiras.com.br"
      },
      verified: true
    },
    {
      id: 2,
      name: "Conecta Estágios",
      description: "Mais de 10 anos conectando universitários às melhores empresas",
      location: "Recife, PE",
      rating: 4.5,
      reviews: 89,
      areas: ["Marketing", "Vendas", "RH"],
      contact: {
        phone: "(81) 2134-5678",
        website: "www.conectaestagios.com"
      },
      verified: true
    },
    {
      id: 3,
      name: "TechStart Recife",
      description: "Foco em startups e empresas de tecnologia",
      location: "Recife, PE",
      rating: 4.7,
      reviews: 73,
      areas: ["Desenvolvimento", "UI/UX", "Data Science"],
      contact: {
        phone: "(81) 3456-7890",
        website: "www.techstartrecife.com"
      },
      verified: false
    }
  ]

  const filteredAgencies = agencies.filter(agency =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.areas.some(area => area.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Mapa de Agências de Estágio 🗺️
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubra e avalie agências de estágio na sua região. Veja avaliações reais de outros estudantes.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, área ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-muted-foreground">Agências cadastradas</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">318</p>
                  <p className="text-muted-foreground">Avaliações</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">4.6</p>
                  <p className="text-muted-foreground">Média geral</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Agencies List */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {filteredAgencies.map((agency) => (
              <Card key={agency.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{agency.name}</span>
                        {agency.verified && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ✓ Verificada
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {agency.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 mb-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{agency.rating}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {agency.reviews} avaliações
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Location */}
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{agency.location}</span>
                    </div>

                    {/* Areas */}
                    <div>
                      <p className="text-sm font-medium mb-2">Áreas de atuação:</p>
                      <div className="flex flex-wrap gap-2">
                        {agency.areas.map((area, index) => (
                          <Badge key={index} variant="outline">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-0">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{agency.contact.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Globe className="h-4 w-4" />
                          <span>{agency.contact.website}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Ver Perfil
                        </Button>
                        <Button size="sm">
                          Avaliar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAgencies.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma agência encontrada</h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros ou termos de busca.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Add Agency CTA */}
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">
                Conhece uma agência que não está listada?
              </h3>
              <p className="text-muted-foreground mb-4">
                Ajude outros estudantes adicionando agências que você conhece
              </p>
              <Button>
                Adicionar Agência
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
