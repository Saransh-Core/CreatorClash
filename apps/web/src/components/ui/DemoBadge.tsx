export function DemoBadge({ children = 'DEMO' }: { children?: string }) {
  return <span className="demo-badge">{children}</span>
}
