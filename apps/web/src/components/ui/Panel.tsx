import type { PropsWithChildren, ReactNode } from 'react'

type PanelProps = PropsWithChildren<{
  title?: string
  eyebrow?: string
  action?: ReactNode
  className?: string
}>

export function Panel({ title, eyebrow, action, className = '', children }: PanelProps) {
  return (
    <section className={'panel ' + className}>
      {(title || eyebrow || action) && (
        <div className="panel-heading">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2>{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
