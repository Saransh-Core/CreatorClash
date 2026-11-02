import { Info } from 'lucide-react'

export function DemoNotice({ children }: { children: string }) {
  return (
    <p className="demo-notice" role="note">
      <Info aria-hidden="true" size={15} />
      <span>{children}</span>
    </p>
  )
}
