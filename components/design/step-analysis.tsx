import { DesignOpsCrewRunner } from './design-ops-crew-runner'
import { type Objective, type AgentMessage, type SynthesisMode } from '@/lib/design-ops-types'

interface StepAnalysisProps {
  objective: Objective | null
  onMessages: (msgs: AgentMessage[]) => void
  onRunStatusChange: (running: boolean) => void
  onModeChange?: (mode: SynthesisMode) => void
  onRunComplete?: (payload: {
    prompt: string
    mode: SynthesisMode
    objectives: Objective[]
    messages: AgentMessage[]
    provider?: string
    model?: string
  }) => void | Promise<void>
}

export function StepAnalysis(props: StepAnalysisProps) {
  return (
    <DesignOpsCrewRunner
      objective={props.objective}
      onMessages={props.onMessages}
      onRunStatusChange={props.onRunStatusChange}
      onModeChange={props.onModeChange}
      onRunComplete={props.onRunComplete}
    />
  )
}
