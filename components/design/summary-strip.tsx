import { Card } from '@/components/ui/card'
import { type SummaryData } from '@/lib/carrier-types'

const confidenceColor = (c: SummaryData['confidence']) => {
  if (c === 'high')   return 'var(--color-status-complete)'
  if (c === 'medium') return 'var(--color-status-progress)'
  if (c === 'low')    return 'var(--color-status-blocked)'
  return undefined
}

interface SummaryStripProps { summary: SummaryData }

export function SummaryStrip({ summary }: SummaryStripProps) {
  const tiles = [
    {
      label: 'Confidence',
      value: summary.confidence
        ? summary.confidence.charAt(0).toUpperCase() + summary.confidence.slice(1)
        : '—',
      color: confidenceColor(summary.confidence),
    },
    {
      label: 'Participants',
      value: summary.participants !== null ? String(summary.participants) : '—',
    },
    {
      label: 'Insights',
      value: summary.insights > 0 ? String(summary.insights) : '—',
    },
    {
      label: 'Recommendation',
      value: summary.recommendation || '—',
    },
    {
      label: 'Next steps',
      value: summary.nextSteps || '—',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {tiles.map(tile => (
        <Card key={tile.label} className="p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">{tile.label}</p>
          <p
            className="text-base font-medium"
            style={tile.color ? { color: tile.color } : undefined}
            aria-label={tile.label === 'Confidence' && tile.color ? `${tile.value} confidence` : undefined}
          >
            {tile.value}
          </p>
        </Card>
      ))}
    </div>
  )
}
