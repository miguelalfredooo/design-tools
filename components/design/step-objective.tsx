import { DesignOpsObjectives } from './design-ops-objectives'
import { type Objective } from '@/lib/design-ops-types'

interface StepObjectiveProps {
  objectives: Objective[]
  activeObjectiveId: string | null
  onActiveObjectiveChange: (id: string | null) => void
  onAdd: (obj: Omit<Objective, 'id' | 'createdAt'>) => Promise<Objective | null>
  onUpdate: (id: string, updates: Omit<Objective, 'id' | 'createdAt'>) => Promise<Objective | null>
  onDelete: (id: string) => void
}

export function StepObjective(props: StepObjectiveProps) {
  return (
    <DesignOpsObjectives
      objectives={props.objectives}
      activeObjectiveId={props.activeObjectiveId}
      onActiveObjectiveChange={props.onActiveObjectiveChange}
      onAdd={props.onAdd}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
    />
  )
}
