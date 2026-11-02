import type { CompetitionStatus } from '../../types/domain'

const statusLabels: Record<CompetitionStatus, string> = {
  live: 'Live demo',
  upcoming: 'Upcoming',
  completed: 'Completed',
}

export function StatusBadge({ status }: { status: CompetitionStatus }) {
  return (
    <span className={'status-badge status-' + status}>
      {statusLabels[status]}
    </span>
  )
}
