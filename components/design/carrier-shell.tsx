'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useDesignOpsWorkspace } from '@/hooks/use-design-ops-workspace'
import { CarrierRail } from './carrier-rail'
import { CarrierMainPane } from './carrier-main-pane'
import { type StepId, type StatusId, type SpineStep } from '@/lib/carrier-types'
import { toast } from 'sonner'

export function CarrierShell() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = (searchParams.get('view') === 'shared' ? 'shared' : 'private') as 'private' | 'shared'

  const {
    objectives, activeObjectiveId, activeObjective,
    messages, archives, modules, running, loading,
    currentRunMode,
    setActiveObjectiveId, setMessages, setRunning, setCurrentRunMode,
    addObjective, updateObjective, deleteObjective,
    deleteArchive, archiveRun, updateModule,
  } = useDesignOpsWorkspace()

  // Derive steps
  const steps: SpineStep[] = useMemo(() => {
    const objectiveStatus: StatusId = activeObjective !== null ? 'complete' : 'not_started'
    const analysisStatus: StatusId = running
      ? 'in_progress'
      : archives.length > 0
      ? 'complete'
      : 'not_started'
    // Results is 'in_progress' when data exists — intentional per spec (results are
    // always reviewable/ongoing, not a terminal 'complete' state in this build).
    const resultsStatus: StatusId =
      archives.length > 0 ? 'in_progress' : 'not_started'
    return [
      { id: 'objective',  label: 'Objective',   status: objectiveStatus },
      { id: 'analysis',   label: 'Analysis',    status: analysisStatus },
      { id: 'results',    label: 'Results',     status: resultsStatus },
      { id: 'design-ops', label: 'Design Ops',  status: 'not_started' },
    ]
  }, [activeObjective, running, archives, messages])

  const [activeStep, setActiveStep] = useState<StepId>('objective')
  const [stepInitialized, setStepInitialized] = useState(false)

  // Once data finishes loading, navigate to the first incomplete step.
  // Only runs once (stepInitialized gate). design-ops never auto-lands.
  useEffect(() => {
    if (!loading && !stepInitialized) {
      setStepInitialized(true)
      if (steps[0].status !== 'not_started') {
        if (steps[1].status === 'not_started') {
          setActiveStep('analysis')
        } else {
          setActiveStep('results')
        }
      }
    }
  }, [loading, stepInitialized, steps])

  const onViewChange = (v: 'private' | 'shared') => {
    const params = new URLSearchParams(searchParams.toString())
    if (v === 'shared') { params.set('view', 'shared') } else { params.delete('view') }
    router.replace(`?${params.toString()}`)
  }

  const onSessionSelect = (id: string) => {
    setActiveObjectiveId(id)
    setActiveStep('results')
  }

  const onNewSession = () => {
    setActiveObjectiveId(null)
    setMessages([])
    setRunning(false)
    setActiveStep('objective')
  }

  const onNavigateToAnalysis = () => setActiveStep('analysis')

  const onRunComplete = async (payload: Parameters<typeof archiveRun>[0]) => {
    await archiveRun(payload)
    toast.success('Analysis complete', {
      action: {
        label: 'View results',
        onClick: () => setActiveStep('results'),
      },
    })
  }

  // Derive session list from archives grouped by first objective id
  const sessionList = useMemo(() => {
    const map = new Map<string, { id: string; title: string; status: StatusId }>()
    for (const a of archives) {
      if (!a.objectives?.length) continue
      const objId = a.objectives[0].id
      if (!map.has(objId)) {
        map.set(objId, {
          id: objId,
          title: a.objectives[0].title ?? 'Untitled session',
          status: 'complete',
        })
      }
    }
    return Array.from(map.values())
  }, [archives])

  return (
    <div className="flex h-screen overflow-hidden">
      <CarrierRail
        activeStep={activeStep}
        steps={steps}
        onStepChange={setActiveStep}
        onNewSession={onNewSession}
        onSessionSelect={onSessionSelect}
        activeObjective={activeObjective}
        sessions={sessionList}
      />
      <CarrierMainPane
        activeStep={activeStep}
        view={view}
        onViewChange={onViewChange}
        onNavigateToAnalysis={onNavigateToAnalysis}
        onRunComplete={onRunComplete}
        objectives={objectives}
        activeObjectiveId={activeObjectiveId}
        activeObjective={activeObjective}
        messages={messages}
        archives={archives}
        running={running}
        loading={loading}
        currentRunMode={currentRunMode}
        setActiveObjectiveId={setActiveObjectiveId}
        setMessages={setMessages}
        setRunning={setRunning}
        setCurrentRunMode={setCurrentRunMode}
        addObjective={addObjective}
        updateObjective={updateObjective}
        deleteObjective={deleteObjective}
        deleteArchive={deleteArchive}
        modules={modules}
        updateModule={updateModule}
      />
    </div>
  )
}
