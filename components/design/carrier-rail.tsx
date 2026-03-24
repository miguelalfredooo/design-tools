import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SpineNav } from './spine-nav'
import { SessionHistory } from './session-history'
import { type StepId, type StatusId, type SpineStep } from '@/lib/carrier-types'
import { type Objective } from '@/lib/design-ops-types'

interface CarrierRailProps {
  activeStep: StepId
  steps: SpineStep[]
  onStepChange: (id: StepId) => void
  onNewSession: () => void
  onSessionSelect: (id: string) => void
  activeObjective: Objective | null
  sessions: Array<{ id: string; title: string; status: StatusId }>
}

export function CarrierRail({
  activeStep, steps, onStepChange, onNewSession, onSessionSelect, activeObjective, sessions,
}: CarrierRailProps) {
  return (
    <div className="w-[220px] shrink-0 flex flex-col border-r h-full">
      {/* Session context */}
      <div className="p-4 border-b">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
          Session
        </p>
        <p className="text-sm font-medium truncate">
          {activeObjective?.title ?? 'No active session'}
        </p>
      </div>

      {/* New session */}
      <div className="px-4 py-3 border-b">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onNewSession}
        >
          <Plus className="size-4" />
          New session
        </Button>
      </div>

      {/* Spine nav */}
      <div className="flex-1 overflow-y-auto">
        <SpineNav steps={steps} activeStepId={activeStep} onStepChange={onStepChange} />
      </div>

      {/* History */}
      <div className="mt-auto border-t p-4">
        <SessionHistory sessions={sessions} onSelect={onSessionSelect} />
      </div>
    </div>
  )
}
