import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { STATUS_LABELS, type StatusId } from '@/lib/carrier-types'
import { type DesignOpsModuleRecord } from '@/lib/design-ops-types'

const dotToken: Record<StatusId, string> = {
  complete:    'complete',
  in_progress: 'progress',
  blocked:     'blocked',
  not_started: 'idle',
}

interface DesignOpsModuleProps {
  module: DesignOpsModuleRecord
  view: 'private' | 'shared'
  onUpdate: (id: string, updates: Partial<Omit<DesignOpsModuleRecord, 'id' | 'createdAt'>>) => Promise<DesignOpsModuleRecord | null>
}

export function DesignOpsModule({ module, view, onUpdate: _onUpdate }: DesignOpsModuleProps) {
  const subtitleText =
    module.status === 'complete'    ? `Completed ${module.completedAt ?? ''}`
    : module.status === 'in_progress' ? (module.nextAction ?? 'In progress')
    : module.status === 'blocked'     ? (module.blockedReason ?? 'Blocked')
    : 'Not started'

  const row = (
    <div className="flex items-center gap-3 px-4 py-4">
      <div
        className="size-[7px] rounded-full shrink-0"
        style={{ background: `var(--color-status-${dotToken[module.status]})` }}
        role="img"
        aria-label={STATUS_LABELS[module.status]}
      />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium">{module.name}</p>
        <p
          className={cn('text-xs mt-0.5', module.status !== 'blocked' && 'text-muted-foreground')}
          style={module.status === 'blocked' ? { color: 'var(--color-status-blocked)' } : undefined}
        >
          {subtitleText}
        </p>
      </div>
      {view === 'private' && (
        <ChevronRight className="size-4 text-muted-foreground shrink-0" aria-hidden />
      )}
    </div>
  )

  if (view === 'shared') {
    return <div>{row}</div>
  }

  return (
    <Collapsible>
      <CollapsibleTrigger className={cn(
        'w-full transition-colors hover:bg-muted/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
      )}>
        {row}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Separator />
        <div className="px-4 py-4 text-sm text-muted-foreground">
          {module.detail ?? <span className="italic">No detail added yet.</span>}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
