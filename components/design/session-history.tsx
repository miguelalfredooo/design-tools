import { type StatusId } from '@/lib/carrier-types'
import { STATUS_LABELS } from '@/lib/carrier-types'

const dotColor: Record<StatusId, string> = {
  complete:    'var(--color-status-complete)',
  in_progress: 'var(--color-status-progress)',
  blocked:     'var(--color-status-blocked)',
  not_started: 'var(--color-status-idle)',
}

interface SessionHistoryProps {
  sessions: Array<{ id: string; title: string; status: StatusId }>
  onSelect: (id: string) => void
}

export function SessionHistory({ sessions, onSelect }: SessionHistoryProps) {
  if (sessions.length === 0) return null
  return (
    <nav aria-label="Session history">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
        History
      </p>
      <ul role="list" className="space-y-0.5">
        {sessions.map(s => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              className="w-full flex items-center gap-2 py-1.5 px-1 rounded cursor-pointer hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div
                className="size-[6px] rounded-full shrink-0"
                style={{ background: dotColor[s.status] }}
                aria-label={STATUS_LABELS[s.status]}
                role="img"
              />
              <span className="text-sm text-muted-foreground truncate text-left">{s.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
