import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface CTAProps {
  title: string
  subtitle: string
  href?: string
  label?: string
}

export function CTA({
  title,
  subtitle,
  href = '/login',
  label = 'Start free now',
}: CTAProps) {
  return (
    <div className="not-prose rounded-xl border border-[#E2E8F0] bg-slate-50 p-6 lg:p-8 text-center space-y-4">
      <p className="text-sm lg:text-base font-semibold text-[#1E293B]">{title}</p>
      <p className="text-xs lg:text-sm text-[#475569]">{subtitle}</p>
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-lg bg-[#05A660] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#048C51]"
      >
        {label}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  )
}
