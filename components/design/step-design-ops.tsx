import { Card } from '@/components/ui/card'
import { DesignOpsModule } from './design-ops-module'
import { type DesignOpsModuleRecord } from '@/lib/design-ops-types'

interface StepDesignOpsProps {
  view: 'private' | 'shared'
  modules: DesignOpsModuleRecord[]
  onUpdateModule: (id: string, updates: Partial<Omit<DesignOpsModuleRecord, 'id' | 'createdAt'>>) => Promise<DesignOpsModuleRecord | null>
}

export function StepDesignOps({ view, modules, onUpdateModule }: StepDesignOpsProps) {
  if (modules.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Design Ops
        </p>
        <p className="text-sm text-muted-foreground">No modules yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Design Ops
      </p>
      <Card className="divide-y overflow-hidden">
        {modules.map(mod => (
          <DesignOpsModule key={mod.id} module={mod} view={view} onUpdate={onUpdateModule} />
        ))}
      </Card>
    </div>
  )
}
