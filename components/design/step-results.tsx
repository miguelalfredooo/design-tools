import { useMemo } from 'react'
import { SummaryStrip } from './summary-strip'
import { NewRunCard } from './new-run-card'
import { RunCard } from './run-card'
import { InsightCard } from './insight-card'
import { formatPlainTextSections, extractSection } from '@/lib/design-ops-formatting'
import { type DesignOpsArchive, type AgentMessage } from '@/lib/design-ops-types'
import { type SummaryData, type Insight, type InsightType } from '@/lib/carrier-types'

function deriveInsights(archives: DesignOpsArchive[]): Insight[] {
  return archives.flatMap(archive => {
    const msg = archive.messages.find(
      m => m.from === 'research_insights' && m.confidence !== 'n/a'
    )
    if (!msg) return []
    const sections = formatPlainTextSections(msg.body)
    const findings = sections.find(s => s.label === 'Top findings' || s.label === 'Findings')
    return (findings?.content ?? []).slice(0, 3).map((line, i) => ({
      id:     `${archive.id}-finding-${i}`,
      type:   'pattern' as InsightType,
      text:   line,
      source: new Date(archive.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))
  })
}

interface StepResultsProps {
  archives: DesignOpsArchive[]
  messages: AgentMessage[]
  running: boolean
  view: 'private' | 'shared'
  onDeleteArchive: (id: string) => void
  onNavigateToAnalysis: () => void
}

export function StepResults({
  archives, messages, running, view, onDeleteArchive, onNavigateToAnalysis,
}: StepResultsProps) {
  const latestSynthesis = useMemo(() =>
    [...archives]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      ?.messages.find(m => m.from === 'research_insights' && m.confidence !== 'n/a'),
    [archives]
  )

  const derivedInsights = useMemo(() => deriveInsights(archives), [archives])

  const summary: SummaryData = {
    confidence:     (latestSynthesis?.confidence as SummaryData['confidence']) ?? null,
    participants:   null,
    insights:       derivedInsights.length,
    recommendation: extractSection(latestSynthesis?.body ?? '', 'RECOMMENDATION').slice(0, 80),
    nextSteps:      latestSynthesis?.nextStep ?? '',
  }

  const sortedArchives = useMemo(
    () => [...archives].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [archives]
  )

  if (view === 'private') {
    return (
      <div className="space-y-6">
        <SummaryStrip summary={summary} />

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Analysis runs
          </p>
          <div className="space-y-2">
            <NewRunCard onNewRun={onNavigateToAnalysis} />
            {sortedArchives.map(a => (
              <RunCard
                key={a.id}
                archive={a}
                view={view}
                onDelete={onDeleteArchive}
              />
            ))}
          </div>
        </div>

        {derivedInsights.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Insights
            </p>
            <div className="space-y-2">
              {derivedInsights.map(i => (
                <InsightCard key={i.id} insight={i} view="private" />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Shared view: summary + top insights + next steps only
  return (
    <div className="space-y-6">
      <SummaryStrip summary={summary} />

      {derivedInsights.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Insights
          </p>
          <div className="space-y-2">
            {derivedInsights.slice(0, 5).map(i => (
              <InsightCard key={i.id} insight={i} view="shared" />
            ))}
          </div>
        </div>
      )}

      {summary.nextSteps && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Next steps
          </p>
          <p className="text-sm text-muted-foreground">{summary.nextSteps}</p>
        </div>
      )}
    </div>
  )
}
