import { ArrowDownRight, ArrowUpRight, Trophy } from 'lucide-react'
import { demoCreators, demoLeaderboard, formatCompact } from '../../services/demoData'
import { CreatorAvatar } from '../ui/CreatorAvatar'
import { DemoBadge } from '../ui/DemoBadge'

export function Leaderboard({ compact = false }: { compact?: boolean }) {
  const rows = compact ? demoLeaderboard.slice(0, 4) : demoLeaderboard

  return (
    <div className="leaderboard">
      {rows.map((entry, index) => {
        const creator = demoCreators.find((item) => item.id === entry.creatorId) ?? demoCreators[0]!
        return (
          <div className="leaderboard-row" key={entry.creatorId}>
            <span className={'leaderboard-rank rank-' + (index + 1)}>
              {index === 0 ? <Trophy aria-label="First place" size={15} /> : String(entry.rank).padStart(2, '0')}
            </span>
            <CreatorAvatar creator={creator} size="small" />
            <span className="leaderboard-person">
              <strong>{creator.name}</strong>
              <span>{creator.category}</span>
            </span>
            <span className="leaderboard-support">
              <strong>{formatCompact(entry.support)}</strong>
              <span>demo support</span>
            </span>
            {!compact && (
              <span className="leaderboard-change" aria-label={index % 2 ? 'Down one place' : 'Up one place'}>
                {index % 2 ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
              </span>
            )}
          </div>
        )
      })}
      <div className="leaderboard-footnote">
        <DemoBadge />
        <span>Popularity support is demo data; skill scores are separate.</span>
      </div>
    </div>
  )
}
