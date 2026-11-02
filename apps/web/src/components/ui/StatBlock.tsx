import type { ReactNode } from 'react'

type StatBlockProps = {
  label: string
  value: ReactNode
  detail?: string
  tone?: 'default' | 'accent' | 'success'
}

export function StatBlock({ label, value, detail, tone = 'default' }: StatBlockProps) {
  return (
    <div className="stat-block">
      <span className="stat-label">{label}</span>
      <strong className={'stat-value stat-' + tone}>{value}</strong>
      {detail && <span className="stat-detail">{detail}</span>}
    </div>
  )
}
