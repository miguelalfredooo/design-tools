import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CarrierTopbarProps {
  view: 'private' | 'shared'
  onViewChange: (v: 'private' | 'shared') => void
}

export function CarrierTopbar({ view, onViewChange }: CarrierTopbarProps) {
  return (
    <div className="flex items-center justify-between border-b px-5 py-3 shrink-0">
      {/* View toggle */}
      <div role="group" aria-label="View mode" className="flex bg-muted rounded-md p-0.5 gap-0.5">
        <Button
          variant={view === 'private' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('private')}
          aria-pressed={view === 'private'}
        >
          Private
        </Button>
        <Button
          variant={view === 'shared' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('shared')}
          aria-pressed={view === 'shared'}
        >
          Shared
        </Button>
      </div>

      {/* Copy share link */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const url = new URL(window.location.href)
          url.searchParams.set('view', 'shared')
          navigator.clipboard.writeText(url.toString())
          toast.success('Link copied')
        }}
      >
        Copy share link
      </Button>
    </div>
  )
}
