import { CarrierTopbar } from './carrier-topbar'
import { StepObjective } from './step-objective'
import { StepAnalysis } from './step-analysis'
import { StepResults } from './step-results'
import { StepDesignOps } from './step-design-ops'
import { type StepId } from '@/lib/carrier-types'
import {
  type Objective, type AgentMessage, type DesignOpsArchive, type SynthesisMode,
  type DesignOpsModuleRecord,
} from '@/lib/design-ops-types'

interface CarrierMainPaneProps {
  activeStep: StepId
  view: 'private' | 'shared'
  onViewChange: (v: 'private' | 'shared') => void
  onNavigateToAnalysis: () => void
  onRunComplete: (payload: {
    prompt: string; mode: SynthesisMode; objectives: Objective[]
    messages: AgentMessage[]; provider?: string; model?: string
  }) => void | Promise<void>
  objectives: Objective[]
  activeObjectiveId: string | null
  activeObjective: Objective | null
  messages: AgentMessage[]
  archives: DesignOpsArchive[]
  running: boolean
  loading: boolean
  currentRunMode: SynthesisMode
  setActiveObjectiveId: (id: string | null) => void
  setMessages: (msgs: AgentMessage[]) => void
  setRunning: (r: boolean) => void
  setCurrentRunMode: (m: SynthesisMode) => void
  addObjective: (obj: Omit<Objective, 'id' | 'createdAt'>) => Promise<Objective | null>
  updateObjective: (id: string, updates: Omit<Objective, 'id' | 'createdAt'>) => Promise<Objective | null>
  deleteObjective: (id: string) => void
  deleteArchive: (id: string) => void
  modules: DesignOpsModuleRecord[]
  updateModule: (id: string, updates: Partial<Omit<DesignOpsModuleRecord, 'id' | 'createdAt'>>) => Promise<DesignOpsModuleRecord | null>
}

export function CarrierMainPane({
  activeStep, view, onViewChange, onNavigateToAnalysis, onRunComplete,
  objectives, activeObjectiveId, activeObjective, messages, archives,
  running, loading, currentRunMode,
  setActiveObjectiveId, setMessages, setRunning, setCurrentRunMode,
  addObjective, updateObjective, deleteObjective, deleteArchive,
  modules, updateModule,
}: CarrierMainPaneProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <CarrierTopbar view={view} onViewChange={onViewChange} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-5">
          {activeStep === 'objective' && (
            <StepObjective
              objectives={objectives}
              activeObjectiveId={activeObjectiveId}
              onActiveObjectiveChange={setActiveObjectiveId}
              onAdd={addObjective}
              onUpdate={updateObjective}
              onDelete={deleteObjective}
            />
          )}
          {activeStep === 'analysis' && (
            <StepAnalysis
              objective={activeObjective}
              onMessages={setMessages}
              onRunStatusChange={setRunning}
              onModeChange={setCurrentRunMode}
              onRunComplete={onRunComplete}
            />
          )}
          {activeStep === 'results' && (
            <StepResults
              archives={archives}
              messages={messages}
              running={running}
              view={view}
              onDeleteArchive={deleteArchive}
              onNavigateToAnalysis={onNavigateToAnalysis}
            />
          )}
          {activeStep === 'design-ops' && <StepDesignOps view={view} modules={modules} onUpdateModule={updateModule} />}
        </div>
      </div>
    </div>
  )
}
