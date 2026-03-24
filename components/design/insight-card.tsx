import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { type Insight } from '@/lib/carrier-types'

interface InsightCardProps {
  insight: Insight
  view: 'private' | 'shared'
}

export function InsightCard({ insight, view }: InsightCardProps) {
  const typeLabel = insight.type.charAt(0).toUpperCase() + insight.type.slice(1)
  const isExpandable = view === 'private' && !!insight.detail

  const content = (
    <div className="flex items-start gap-3 py-4">
      <span
        className="shrink-0 rounded px-2 py-0.5 text-xs font-medium mt-0.5"
        aria-label={`${typeLabel} insight`}
        style={{
          background: `var(--color-insight-${insight.type}-bg)`,
          color:      `var(--color-insight-${insight.type}-text)`,
        }}
      >
        {typeLabel}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{insight.text}</p>
        <p className="text-xs text-muted-foreground mt-1">{insight.source}</p>
      </div>
    </div>
  )

  if (!isExpandable) {
    return (
      <Card>
        <CardContent className="p-0 px-4">{content}</CardContent>
      </Card>
    )
  }

  return (
    <Collapsible>
      <Card>
        <CollapsibleTrigger className="w-full text-left px-4 hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-lg">
          {content}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator />
          <CardContent className="py-3 text-sm text-muted-foreground">
            {insight.detail}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
