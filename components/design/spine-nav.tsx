import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, type SpineStep, type StepId, type StatusId } from '@/lib/carrier-types'

const dotColor: Record<StatusId, string> = {
  complete:    'var(--color-status-complete)',
  in_progress: 'var(--color-status-progress)',
  blocked:     'var(--color-status-blocked)',
  not_started: 'var(--color-status-idle)',
}

interface SpineNavProps {
  steps: SpineStep[]
  activeStepId: StepId
  onStepChange: (id: StepId) => void
}

export function SpineNav({ steps, activeStepId, onStepChange }: SpineNavProps) {
  return (
    <nav aria-label="Session steps">
      <ul role="list" className="flex flex-col py-2">
        {steps.map((step, i) => {
          const isActive = step.id === activeStepId
          const isLast = i === steps.length - 1
          const isMuted = step.status === 'not_started' && !isActive
          return (
            <li key={step.id}>
              <button
                type="button"
                className={cn(
                  'relative w-full flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  isActive && 'bg-muted'
                )}
                onClick={() => onStepChange(step.id)}
                aria-current={isActive ? 'step' : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-foreground" aria-hidden />
                )}
                {/* Connector column */}
                <div className="flex flex-col items-center pt-1 shrink-0" style={{ width: '10px' }}>
                  <div
                    className="size-[7px] rounded-full shrink-0"
                    style={{ background: dotColor[step.status] }}
                    aria-label={STATUS_LABELS[step.status]}
                    role="img"
                  />
                  {!isLast && <div className="w-px flex-1 bg-border mt-1" style={{ minHeight: '24px' }} />}
                </div>
                {/* Content column */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-sm font-medium', isMuted && 'text-muted-foreground')}>
                      {step.label}
                    </p>
                    {(step.status === 'in_progress' || step.status === 'blocked') && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-auto shrink-0"
                        style={{
                          color:           `var(--color-status-${step.status === 'in_progress' ? 'progress' : 'blocked'})`,
                          borderColor:     `var(--color-status-${step.status === 'in_progress' ? 'progress' : 'blocked'})`,
                          backgroundColor: `var(--color-status-${step.status === 'in_progress' ? 'progress' : 'blocked'}-bg)`,
                        }}
                      >
                        {STATUS_LABELS[step.status]}
                      </Badge>
                    )}
                  </div>
                  {step.status === 'blocked' && step.blockedReason && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-status-blocked)' }}>
                      {step.blockedReason}
                    </p>
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
