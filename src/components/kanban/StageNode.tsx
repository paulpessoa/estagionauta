import React from 'react'
import { Handle, Position } from 'reactflow'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StageNodeData {
  label: string
  count: number
  icon: LucideIcon
  isSelected: boolean
  color: string
}

interface StageNodeProps {
  data: StageNodeData
}

export const StageNode = React.memo(({ data }: StageNodeProps) => {
  const Icon = data.icon

  return (
    <div 
      className={cn(
        "px-5 py-4 rounded-xl border transition-all duration-300 shadow-lg min-w-[200px]",
        "bg-white/80 dark:bg-gray-950/80 backdrop-blur-md cursor-pointer",
        data.isSelected 
          ? "border-primary ring-2 ring-primary/20 scale-105" 
          : "border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600"
      )}
    >
      {/* Alça de Entrada (onde a linha chega) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-primary border-2 border-background !left-[-6px]" 
      />
      
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", data.color)}>
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 text-left">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Fase
          </p>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            {data.label}
          </h4>
        </div>
        
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
          {data.count}
        </div>
      </div>

      {/* Alça de Saída (de onde a linha parte) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-primary border-2 border-background !right-[-6px]" 
      />
    </div>
  )
})

StageNode.displayName = 'StageNode'
