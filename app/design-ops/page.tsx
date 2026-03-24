import { Suspense } from 'react'
import { CarrierShell } from '@/components/design/carrier-shell'

export default function DesignOpsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <CarrierShell />
    </Suspense>
  )
}
