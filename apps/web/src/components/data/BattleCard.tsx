import { ArrowUpRight, Users } from 'lucide-react'
import { Link } from 'react-router'
import { creatorById, formatWhen } from '../../services/demoData'
import type { Battle } from '../../types/domain'
import { CreatorAvatar } from '../ui/CreatorAvatar'
import { DemoBadge } from '../ui/DemoBadge'
import { StatusBadge } from '../ui/StatusBadge'

export function BattleCard({ battle, publicView = false }: { battle: Battle; publicView?: boolean }) {
  const creatorOne = creatorById(battle.creatorOneId)
  const creatorTwo = creatorById(battle.creatorTwoId)
  const detailPath = publicView ? '/arena/' + battle.id : '/creator/battles/' + battle.id

  return (
    <article className="battle-row">
      <div className="battle-row-status">
        <StatusBadge status={battle.status} />
        <DemoBadge />
      </div>
      <div className="battle-row-main">
        <div className="battle-competitors">
          <CreatorAvatar creator={creatorOne} size="small" />
          <span className="battle-vs">VS</span>
          <CreatorAvatar creator={creatorTwo} size="small" />
          <span className="competitor-names">{creatorOne.name} <span>vs</span> {creatorTwo.name}</span>
        </div>
        <Link className="battle-title-link" to={detailPath}>
          {battle.title}
        </Link>
        <p className="battle-subline">
          {battle.category} <span>·</span> {battle.format.replaceAll('-', ' ')}
        </p>
      </div>
      <div className="battle-row-meta">
        {battle.status === 'completed' ? (
          <span className="battle-score">{battle.scoreOne} <i>—</i> {battle.scoreTwo}</span>
        ) : (
          <span>{formatWhen(battle.startsAt)}</span>
        )}
        <span className="battle-audience">
          <Users aria-hidden="true" size={14} />
          Community involved
        </span>
      </div>
      <Link aria-label={'Open ' + battle.title} className="icon-link" to={detailPath}>
        <ArrowUpRight aria-hidden="true" size={17} />
      </Link>
    </article>
  )
}
