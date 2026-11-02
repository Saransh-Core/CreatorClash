import type { Creator } from '../../types/domain'
import type { CSSProperties } from 'react'

type CreatorAvatarProps = {
  creator: Creator
  size?: 'small' | 'medium' | 'large'
}

export function CreatorAvatar({ creator, size = 'medium' }: CreatorAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={'creator-avatar avatar-' + size}
      style={{ '--avatar-accent': creator.color } as CSSProperties}
    >
      {creator.initials}
    </span>
  )
}
