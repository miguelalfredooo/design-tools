export type StepId = 'objective' | 'analysis' | 'results' | 'design-ops'

export type StatusId = 'not_started' | 'in_progress' | 'complete' | 'blocked'

export const STATUS_LABELS: Record<StatusId, string> = {
  not_started: 'Not started',
  in_progress:  'In progress',
  complete:     'Complete',
  blocked:      'Blocked',
}

export type SpineStep = {
  id:             StepId
  label:          string
  status:         StatusId
  blockedReason?: string
}

export type InsightType = 'risk' | 'opportunity' | 'pattern'

export type Insight = {
  id:      string
  type:    InsightType
  text:    string
  source:  string
  detail?: string
}

export type SummaryData = {
  confidence:     'high' | 'medium' | 'low' | null
  participants:   number | null
  insights:       number
  recommendation: string
  nextSteps:      string
}
