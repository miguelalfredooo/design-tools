import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { DesignOpsTimeline } from './design-ops-timeline'
import { DesignOpsFindingsSummary } from './design-ops-findings-summary'
import { type DesignOpsArchive } from '@/lib/design-ops-types'

const MODE_LABELS: Record<string, string> = {
  quick_read:    'Quick read',
  decision_memo: 'Decision memo',
  deep_dive:     'Deep dive',
}

const confidenceStyle = (c: string) => ({
  background: `var(--color-status-${c === 'high' ? 'complete' : c === 'medium' ? 'progress' : 'blocked'}-bg)`,
  color:      `var(--color-status-${c === 'high' ? 'complete' : c === 'medium' ? 'progress' : 'blocked'})`,
  border:     'none',
})

interface RunCardProps {
  archive: DesignOpsArchive
  view: 'private' | 'shared'
  onDelete: (id: string) => void
}

export function RunCard({ archive, view, onDelete }: RunCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const confidence = archive.messages
    .find(m => m.from === 'research_insights' && m.confidence !== 'n/a')
    ?.confidence ?? 'n/a'

  const modeLabel = MODE_LABELS[archive.mode] ?? archive.mode
  const formattedDate = new Date(archive.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
  const objectiveTitle = archive.objectives?.[0]?.title ?? ''

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="py-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              className="flex-1 text-left hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded transition-opacity"
              onClick={() => setSheetOpen(true)}
              aria-label={`Open run: ${archive.prompt}`}
            >
              <p className="text-sm font-medium leading-snug">{archive.prompt}</p>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={e => { e.stopPropagation(); onDelete(archive.id) }}
              aria-label="Delete this run"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {confidence !== 'n/a' && (
              <Badge style={confidenceStyle(confidence)}>
                {confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence
              </Badge>
            )}
            <Badge variant="secondary">{modeLabel}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {formattedDate}{objectiveTitle ? ` · ${objectiveTitle}` : ''}
          </p>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{archive.prompt}</SheetTitle>
            <SheetDescription>{modeLabel} · {formattedDate}</SheetDescription>
          </SheetHeader>
          <Separator className="my-4" />
          {view === 'private'
            ? <DesignOpsTimeline messages={archive.messages} mode={archive.mode} showProcess={false} />
            : <DesignOpsFindingsSummary messages={archive.messages} />
          }
        </SheetContent>
      </Sheet>
    </>
  )
}
