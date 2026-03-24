import { Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface NewRunCardProps { onNewRun: () => void }

export function NewRunCard({ onNewRun }: NewRunCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onNewRun}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNewRun() } }}
      aria-label="Start a new analysis run"
    >
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background" aria-hidden>
          <Plus className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">New run</p>
          <p className="text-sm text-muted-foreground">
            Run a new analysis against the active objective
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
