import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import type { Creator } from '../../types/domain'
import { CreatorAvatar } from '../ui/CreatorAvatar'
import { DemoBadge } from '../ui/DemoBadge'
import type { CSSProperties } from 'react'

export function CreatorFeature({ creator }: { creator: Creator }) {
  return (
    <Link className="creator-feature" to={'/creators/' + creator.id}>
      <div className="creator-feature-art" style={{ '--creator-accent': creator.color } as CSSProperties}>
        <div className="creator-art-orbit" />
        <CreatorAvatar creator={creator} size="large" />
        <span className="creator-art-index">CC / CREATOR</span>
      </div>
      <div className="creator-feature-body">
        <div className="creator-feature-title">
          <div>
            <span className="eyebrow">{creator.category}</span>
            <h3>{creator.name}</h3>
            <span className="creator-handle">{creator.handle}</span>
          </div>
          <ArrowUpRight aria-hidden="true" size={18} />
        </div>
        <p>{creator.bio}</p>
        <div className="creator-feature-stats">
          <span>{new Intl.NumberFormat('en', { notation: 'compact' }).format(creator.followers)} audience</span>
          <span>{creator.wins} demo wins</span>
          <DemoBadge />
        </div>
      </div>
    </Link>
  )
}
