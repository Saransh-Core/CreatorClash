import { useState } from 'react'
import { ArrowRight, Search, Sparkles, Trophy, Users } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { BattleCard } from '../../components/data/BattleCard'
import { CreatorFeature } from '../../components/data/CreatorFeature'
import { Leaderboard } from '../../components/data/Leaderboard'
import { ImmersiveScene } from '../../components/scenes/ImmersiveScene'
import { CreatorAvatar } from '../../components/ui/CreatorAvatar'
import { DemoBadge } from '../../components/ui/DemoBadge'
import { DemoNotice } from '../../components/ui/DemoNotice'
import { PageHeading } from '../../components/ui/PageHeading'
import { Panel } from '../../components/ui/Panel'
import type { CSSProperties } from 'react'
import { StatusBadge } from '../../components/ui/StatusBadge'
import {
  creatorById,
  creatorCategories,
  demoBattles,
  demoCreators,
  demoLeaderboard,
  formatCompact,
  formatWhen,
} from '../../services/demoData'
import type { CompetitionFormat, CompetitionStatus } from '../../types/domain'
import { useDemoStore } from '../../stores/demoStore'

export function ArenaPage() {
  const allBattles = useDemoStore((state) => state.battles)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | CompetitionStatus>('all')
  const [category, setCategory] = useState('all')
  const [format, setFormat] = useState<'all' | CompetitionFormat>('all')
  const categories = ['all', ...creatorCategories]
  const formats = ['all', ...new Set(allBattles.map((battle) => battle.format))] as Array<'all' | CompetitionFormat>
  const filtered = allBattles.filter((battle) => {
        const text = (battle.title + ' ' + battle.category + ' ' + battle.challenge).toLowerCase()
        return (
          text.includes(query.toLowerCase()) &&
          (status === 'all' || battle.status === status) &&
          (category === 'all' || battle.category === category) &&
          (format === 'all' || battle.format === format)
        )
      })
  const featured = allBattles.find((battle) => battle.featured && battle.status === 'live')

  return (
    <div className="public-page">
      <PageHeading
        eyebrow="THE ARENA · DEMO DIRECTORY"
        title="Find your next front-row moment."
        description="Explore creator competitions and community challenges. Every listing on this page is illustrative demo data."
      />
      {featured && (
        <section className="featured-arena">
          <div className="featured-arena-copy">
            <div className="eyebrow-row"><StatusBadge status={featured.status} /><DemoBadge /></div>
            <p className="eyebrow">FEATURED COMPETITION</p>
            <h2>{featured.title}</h2>
            <p>{featured.challenge}</p>
            <Link className="text-action" to={'/arena/' + featured.id}>
              View competition <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="featured-arena-art" aria-hidden="true">
            <ImmersiveScene kind="arena" />
            <span className="featured-vs">VS</span>
            <span className="featured-creator featured-creator-left">{creatorById(featured.creatorOneId).initials}</span>
            <span className="featured-creator featured-creator-right">{creatorById(featured.creatorTwoId).initials}</span>
          </div>
        </section>
      )}
      <DemoNotice>Demo competition listings and status only. No live stream, scores, or participation are connected.</DemoNotice>
      <div className="filter-bar">
        <label className="search-field">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">Search competitions</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search competitions"
            value={query}
          />
        </label>
        <label className="filter-control">
          <span className="sr-only">Competition status</span>
          <select onChange={(event) => setStatus(event.target.value as typeof status)} value={status}>
            <option value="all">All statuses</option>
            <option value="live">Live demo</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label className="filter-control">
          <span className="sr-only">Competition category</span>
          <select onChange={(event) => setCategory(event.target.value)} value={category}>
            {categories.map((item) => (
              <option key={item} value={item}>{item === 'all' ? 'All categories' : item}</option>
            ))}
          </select>
        </label>
        <label className="filter-control">
          <span className="sr-only">Battle type</span>
          <select onChange={(event) => setFormat(event.target.value as typeof format)} value={format}>
            {formats.map((item) => <option key={item} value={item}>{item === 'all' ? 'All battle types' : item.replaceAll('-', ' ')}</option>)}
          </select>
        </label>
      </div>
      <div className="battle-list">
        {filtered.length ? filtered.map((battle) => (
          <BattleCard battle={battle} key={battle.id} publicView />
        )) : (
          <div className="empty-state">
            <Search aria-hidden="true" size={22} />
            <h3>No competitions match those filters.</h3>
            <p>Try a different title, category, or status.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function PublicBattleDetailPage() {
  const { battleId } = useParams()
  const battle = useDemoStore((state) => state.battles.find((item) => item.id === battleId))

  if (!battle) {
    return (
      <div className="public-page">
        <PageHeading eyebrow="ARENA" title="That competition isn't in this demo." />
        <Link className="text-action" to="/arena">Return to the arena <ArrowRight size={16} /></Link>
      </div>
    )
  }

  const first = creatorById(battle.creatorOneId)
  const second = creatorById(battle.creatorTwoId)
  const winner = battle.scoreOne === battle.scoreTwo ? null : battle.scoreOne > battle.scoreTwo ? first : second

  return (
    <div className="public-page">
      <PageHeading
        eyebrow="COMPETITION DETAIL · DEMO"
        title={battle.title}
        description={battle.challenge}
        action={<StatusBadge status={battle.status} />}
      />
      <DemoNotice>Illustrative competition state. It is not connected to Twitch or a live scoring service.</DemoNotice>
      <section className="battle-detail-stage">
        <div className="battle-identity">
          <CreatorAvatar creator={first} size="large" />
          <Link to={'/creators/' + first.id}>{first.name}</Link>
          <span>{first.category}</span>
        </div>
        <div className="battle-center-mark">
          <DemoBadge />
          <strong>VS</strong>
          <span>{battle.progress}% complete</span>
        </div>
        <div className="battle-identity">
          <CreatorAvatar creator={second} size="large" />
          <Link to={'/creators/' + second.id}>{second.name}</Link>
          <span>{second.category}</span>
        </div>
        <div aria-label={'Demo score ' + battle.scoreOne + ' to ' + battle.scoreTwo} className="battle-detail-score">
          <strong>{battle.scoreOne}</strong>
          <span>DEMO SCORE</span>
          <strong>{battle.scoreTwo}</strong>
        </div>
      </section>
      <div className="detail-grid">
        <Panel eyebrow="THE CHALLENGE" title="The brief">
          <p className="panel-copy">{battle.challenge}</p>
          <div className="detail-meta-list">
            <span>Category <strong>{battle.category}</strong></span>
            <span>Format <strong>{battle.format.replaceAll('-', ' ')}</strong></span>
            <span>Duration <strong>{battle.durationMinutes} minutes</strong></span>
            <span>Scheduled <strong>{formatWhen(battle.startsAt)}</strong></span>
          </div>
        </Panel>
        <Panel eyebrow="DEMO RESULT" title={battle.status === 'completed' ? 'Competition complete' : 'How to take part'}>
          <p className="panel-copy">
            {battle.status === 'completed'
              ? winner ? 'Demo result: ' + winner.name + ' leads this illustrative score.' : 'This illustrative demo ended in a tie.'
              : 'A connected participation flow will be added when the verified backend services are implemented.'}
          </p>
          <div className="panel-actions">
            <Link className="button button-primary" to="/login?next=/community/activities">
              {battle.status === 'completed' ? 'Explore the community' : 'Join the demo'}
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <DemoBadge>DEMO STATE</DemoBadge>
          </div>
        </Panel>
      </div>
    </div>
  )
}

export function CreatorsPage() {
  const [query, setQuery] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') ?? 'all'
  const creators = demoCreators.filter((creator) =>
    (category === 'all' || creator.category === category) &&
    (creator.name + ' ' + creator.category + ' ' + creator.handle)
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  return (
    <div className="public-page">
      <PageHeading
        eyebrow="CREATOR INDEX · DEMO"
        title="The people make the competition."
        description="Meet the creators in this curated sample. Profiles and audience figures are illustrative demo content."
      />
      <div className="filter-bar creator-directory-filters">
        <label className="search-field creator-search">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">Search creators</span>
          <input onChange={(event) => setQuery(event.target.value)} placeholder="Search creators or categories" value={query} />
        </label>
        <label className="filter-control"><span className="sr-only">Filter creators by category</span><select onChange={(event) => setSearchParams(event.target.value === 'all' ? {} : { category: event.target.value })} value={category}><option value="all">All categories</option>{creatorCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="creator-grid">
        {creators.map((creator) => <CreatorFeature creator={creator} key={creator.id} />)}
      </div>
      {!creators.length && <p className="empty-state">No creators match your search.</p>}
    </div>
  )
}

export function CreatorProfilePage() {
  const { id } = useParams()
  const creator = demoCreators.find((item) => item.id === id)

  if (!creator) {
    return (
      <div className="public-page">
        <PageHeading eyebrow="CREATOR PROFILE" title="That profile isn't in this demo." />
        <Link className="text-action" to="/creators">Browse creators <ArrowRight size={16} /></Link>
      </div>
    )
  }

  const battles = demoBattles.filter((battle) => battle.creatorOneId === id || battle.creatorTwoId === id)
  return (
    <div className="public-page">
      <section className="profile-hero">
        <div className="profile-art" style={{ '--creator-accent': creator.color } as CSSProperties}>
          <div className="profile-orbit" />
          <CreatorAvatar creator={creator} size="large" />
        </div>
        <div className="profile-copy">
          <div className="eyebrow-row"><span className="eyebrow">{creator.category}</span><DemoBadge /></div>
          <h1>{creator.name}</h1>
          <span className="creator-handle">{creator.handle}</span>
          <p>{creator.bio}</p>
          <div className="profile-stats">
            <span><strong>{formatCompact(creator.followers)}</strong> demo audience</span>
            <span><strong>{creator.wins}</strong> demo wins</span>
            <span><strong>{creator.losses}</strong> demo losses</span>
          </div>
          <Link className="button button-secondary" to="/arena">
            Explore competitions <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="section-block">
        <div className="section-title-row">
          <div><p className="eyebrow">APPEARANCES</p><h2>Competition history</h2></div>
          <DemoBadge />
        </div>
        <div className="battle-list">
          {battles.map((battle) => <BattleCard battle={battle} key={battle.id} publicView />)}
        </div>
      </section>
    </div>
  )
}

export function PublicChampionshipPage() {
  const first = demoCreators.find((creator) => creator.id === demoLeaderboard[0]!.creatorId)!
  return (
    <div className="public-page">
      <PageHeading
        eyebrow="MONTHLY POPULARITY CHAMPIONSHIP · DEMO"
        title="Three days. One community-powered champion."
        description="A monthly showcase for creators and the communities who rally around them. Popularity support and skill competition remain separate."
        action={<DemoBadge>DEMO EDITION</DemoBadge>}
      />
      <section className="championship-feature">
        <div className="championship-story">
          <span className="champion-kicker"><Trophy aria-hidden="true" size={15} /> MONTHLY SHOWCASE</span>
          <h2>Support carries<br />the story forward.</h2>
          <p>Three consecutive 24-hour rounds bring creators and communities together. Every contribution in this view is illustrative demo data.</p>
          <Link className="button button-primary" to="/community/championship">
            View the championship <ArrowRight size={16} />
          </Link>
          <span className="championship-timing">ROUND 02 · 11H 24M REMAINING <DemoBadge /></span>
        </div>
        <div className="championship-trophy">
          <ImmersiveScene kind="trophy" />
          <div className="trophy-plaque">
            <span>DEMO LEADER</span>
            <strong>{first.name}</strong>
            <small>Popularity support · illustrative</small>
          </div>
        </div>
      </section>
      <div className="detail-grid championship-lower">
        <Panel eyebrow="THE THREE ROUNDS" title="A month in three chapters">
          <ol className="round-list">
            <li><span>01</span><div><strong>Opening call</strong><small>Communities find their people.</small></div><span className="round-done">Complete</span></li>
            <li><span>02</span><div><strong>Community spotlight</strong><small>Support moves the story along.</small></div><span className="round-current">In demo</span></li>
            <li><span>03</span><div><strong>Finale</strong><small>The monthly showcase concludes.</small></div><span>Upcoming</span></li>
          </ol>
        </Panel>
        <Panel eyebrow="POPULARITY SUPPORT" title="The sample leaderboard">
          <Leaderboard compact />
        </Panel>
      </div>
      <DemoNotice>Championship timing, registration, rankings, and support are demo-only. No contribution validation is connected.</DemoNotice>
    </div>
  )
}

export function HowItWorksPage() {
  const steps = [
    { n: '01', title: 'Connect', text: 'Bring your creator identity and community into one shared competition space. Account linking will be added in a later integration phase.' },
    { n: '02', title: 'Compete', text: 'Creators meet across playful challenges, skill formats, and community-led moments.' },
    { n: '03', title: 'Engage', text: 'Viewers shape the experience through eligible participation and clearly explained voting.' },
    { n: '04', title: 'Win', text: 'Competition results and rewards follow explicit rules and verified outcomes.' },
  ]
  return (
    <div className="public-page">
      <PageHeading
        eyebrow="HOW IT WORKS"
        title="The stream is where it happens. The arena is how we play."
        description="Creator Clash is designed to complement Twitch, not replace it as the livestream destination."
      />
      <DemoNotice>This page explains the intended product flow. The integrations and competition services are not connected.</DemoNotice>
      <div className="steps-editorial">
        {steps.map((step) => (
          <article className="step-row" key={step.n}>
            <span className="step-number">{step.n}</span>
            <h2>{step.title}</h2>
            <p>{step.text}</p>
            <span aria-hidden="true" className="step-rule" />
          </article>
        ))}
      </div>
      <section className="closing-cta">
        <div><p className="eyebrow">THE NEXT MOVE IS YOURS</p><h2>Your Community.<br />Your Competition.<br /><span>Your Victory.</span></h2></div>
        <Link className="button button-primary" to="/signup">Explore the demo <ArrowRight size={16} /></Link>
        <Sparkles aria-hidden="true" className="closing-sparkle" size={56} />
      </section>
    </div>
  )
}

export function PublicHomeFooterStats() {
  return (
    <div className="public-proof-row">
      <span><Users aria-hidden="true" size={15} /> Shared by creators and communities</span>
      <span><Trophy aria-hidden="true" size={15} /> Competition-first experiences</span>
      <span><DemoBadge /> Sample data, clearly labelled</span>
    </div>
  )
}

export function NotFoundPage() {
  return <div className="public-page"><PageHeading eyebrow="404 · ARENA NOT FOUND" title="This route missed the match." description="The page may have moved, or it may not be part of this preview." /><Link className="button button-primary" to="/">Return to Creator Clash <ArrowRight size={16} /></Link></div>
}
