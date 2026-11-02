import { CircleCheck, CircleX } from 'lucide-react'

export function InlineNotice({
  children,
  tone = 'success',
}: {
  children: string
  tone?: 'success' | 'error'
}) {
  const Icon = tone === 'success' ? CircleCheck : CircleX
  return (
    <output className={'inline-notice notice-' + tone}>
      <Icon aria-hidden="true" size={16} />
      {children}
    </output>
  )
}
