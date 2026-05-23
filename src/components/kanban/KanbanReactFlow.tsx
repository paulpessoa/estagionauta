import React, { useMemo } from 'react'
import ReactFlow, { 
  Background, 
  Controls, 
  MarkerType, 
  Node, 
  Edge,
  NodeMouseHandler
} from 'reactflow'
import 'reactflow/dist/style.css'
import { StageNode } from './StageNode'
import { JobApplication } from '@/types/kanban'

const nodeTypes = {
  stage: StageNode
}

interface KanbanReactFlowProps {
  applications: JobApplication[]
  statusConfig: Record<string, any>
  selectedStage: string | null
  onSelectStage: (stage: string | null) => void
}

export function KanbanReactFlow({ applications, statusConfig, selectedStage, onSelectStage }: KanbanReactFlowProps) {
  
  // Memoizamos os nós e arestas para que só recalculem se as candidaturas mudarem
  const { nodes, edges } = useMemo(() => {
    // 1. Contar candidaturas por status
    const counts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 2. Definir posições estáticas para o pipeline
    // No futuro, isso pode vir do banco de dados para layouts customizados
    const layout = [
      { id: 'interested', x: 50, y: 150 },
      { id: 'applied', x: 300, y: 150 },
      { id: 'test', x: 550, y: 150 },
      { id: 'interview', x: 800, y: 150 },
      { id: 'offer', x: 1050, y: 50 },
      { id: 'rejected', x: 1050, y: 250 },
    ]

    // 3. Criar a lista de Nodes (Nós) do React Flow
    const generatedNodes: Node[] = layout.map(pos => {
      const config = statusConfig[pos.id]
      return {
        id: pos.id,
        type: 'stage', // Usa o nosso componente StageNode customizado
        position: { x: pos.x, y: pos.y },
        data: {
          label: config.label,
          icon: config.icon,
          color: config.color,
          count: counts[pos.id] || 0,
          isSelected: selectedStage === pos.id
        }
      }
    })

    // 4. Criar as Edges (Linhas de conexão)
    const generatedEdges: Edge[] = [
      { id: 'e1', source: 'interested', target: 'applied', animated: true, style: { strokeWidth: 2 } },
      { id: 'e2', source: 'applied', target: 'test', animated: true, style: { strokeWidth: 2 } },
      { id: 'e3', source: 'test', target: 'interview', animated: true, style: { strokeWidth: 2 } },
      { 
        id: 'e4-offer', 
        source: 'interview', 
        target: 'offer', 
        animated: true, 
        style: { stroke: '#22c55e', strokeWidth: 2 }, // Cor verde para sucesso
        markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' }
      },
      { 
        id: 'e4-rejected', 
        source: 'interview', 
        target: 'rejected', 
        animated: false, // Menos dinâmico para indicar fim de fluxo
        style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5 5' }, // Tracejado e vermelho
        markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }
      },
    ]

    return { nodes: generatedNodes, edges: generatedEdges }
  }, [applications, statusConfig, selectedStage])

  // Lidar com o clique no nó
  const handleNodeClick: NodeMouseHandler = (_, node) => {
    // Se clicar no mesmo nó, fecha. Se não, abre o nó selecionado.
    onSelectStage(selectedStage === node.id ? null : node.id)
  }

  return (
    <div className="w-full h-[500px] border rounded-xl bg-gray-50/50 dark:bg-gray-900/50 overflow-hidden shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView // Ajusta o zoom automaticamente para caber todos os nós
        minZoom={0.5}
        maxZoom={1.5}
        className="react-flow-custom"
      >
        <Background gap={16} size={1} color="#e5e7eb" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
