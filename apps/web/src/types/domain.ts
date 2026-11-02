export type CompetitionStatus = 'live' | 'upcoming' | 'completed'
export type BattlePhase =
  | 'waiting'
  | 'challenge selection'
  | 'challenge acceptance'
  | 'ready'
  | 'live'
  | 'completed'
  | 'cancelled'
export type CompetitionFormat = 'creator-vs-creator' | 'creator-vs-community' | 'community-vs-community'

export type Creator = {
  id: string
  name: string
  handle: string
  initials: string
  category: string
  followers: number
  wins: number
  losses: number
  color: string
  bio: string
}

export type Battle = {
  id: string
  title: string
  creatorOneId: string
  creatorTwoId: string
  category: string
  format: CompetitionFormat
  status: CompetitionStatus
  challenge: string
  startsAt: string
  durationMinutes: number
  progress: number
  scoreOne: number
  scoreTwo: number
  featured: boolean
}

export type DemoTransaction = {
  id: string
  currency: 'Support Tokens' | 'Clash Coins'
  amount: number
  kind: 'earned' | 'spent' | 'support' | 'demo grant'
  description: string
  createdAt: string
}

export type DemoSession = {
  name: string
  handle: string
  mode: 'creator' | 'community'
  createdAt: string
}

export type DemoInvitation = {
  id: string
  creatorId: string
  battleTitle: string
  status: 'incoming' | 'outgoing' | 'accepted' | 'declined'
  expiresAt: string
}

export type DemoActivity = {
  id: string
  title: string
  kind: 'vote' | 'quiz' | 'support' | 'mini-game'
  creatorId: string
  status: 'open' | 'completed'
  endsAt: string
}

export type Cosmetic = {
  id: string
  name: string
  type: 'Profile frame' | 'Battle theme' | 'Badge' | 'Victory effect'
  price: number
  description: string
  accent: string
}
