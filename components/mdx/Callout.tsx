import type { ReactNode } from 'react'

interface CalloutProps {
  children: ReactNode
}

export function Callout({ children }: CalloutProps) {
  return (
    <div className="not-prose rounded-xl border border-[#E2E8F0] bg-slate-50 p-5 lg:p-6 space-y-3 text-sm lg:text-base text-[#1E293B]">
      {children}
    </div>
  )
}
