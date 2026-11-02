import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Award, Check, Heart, Search, Users, Vote, Wallet } from 'lucide-react'
import { Link } from 'react-router'
import { BattleCard } from '../../components/data/BattleCard'
import { CreatorFeature } from '../../components/data/CreatorFeature'
import { Leaderboard } from '../../components/data/Leaderboard'
import { CreatorAvatar } from '../../components/ui/CreatorAvatar'
import { DemoBadge } from '../../components/ui/DemoBadge'
import { DemoNotice } from '../../components/ui/DemoNotice'
import { EmptyState } from '../../components/ui/EmptyState'
import { InlineNotice } from '../../components/ui/InlineNotice'
import { PageHeading } from '../../components/ui/PageHeading'
import { Panel } from '../../components/ui/Panel'
import { StatBlock } from '../../components/ui/StatBlock'
import { creatorById, creatorCategories, demoActivities, demoCreators, formatCompact, formatWhen } from '../../services/demoData'
import { useDemoStore } from '../../stores/demoStore'
import { announceMotionPreferenceChange } from '../../utils/motionPreference'

export function CommunityOverviewPage() {
  const session = useDemoStore((state) => state.session)
  const supportTokens = useDemoStore((state) => state.supportTokens)
  const followedCreators = useDemoStore((state) => state.followedCreators)
  const allBattles = useDemoStore((state) => state.battles)
  const activeBattles = allBattles.filter((battle) => battle.status === 'live')
  const upcomingBattles = allBattles.filter((battle) => battle.status === 'upcoming').slice(0, 2)
  const activities = demoActivities.filter((activity) => activity.status === 'open')
  return (
    <div className="workspace-page">
      <PageHeading
        eyebrow="COMMUNITY WORKSPACE · OVERVIEW"
        title={'Welcome to the viewing deck' + (session ? ', ' + session.name.split(' ')[0] + '.' : '.')}
        description="The competition feels different when you are part of the moment."
        action={<DemoBadge>LOCAL DEMO</DemoBadge>}
      />
      <DemoNotice>Balances, activities, and competitions are local demo data. Participation does not affect a real account or award.</DemoNotice>
      <div className="stats-row community-stats">
        <StatBlock label="Support Tokens" value={supportTokens.toLocaleString()} detail="Separate community demo balance" tone="accent" />
        <StatBlock label="Creators followed" value={String(followedCreators.length).padStart(2, '0')} detail="Saved in this browser" />
        <StatBlock label="Live demo events" value={String(activeBattles.length).padStart(2, '0')} detail="Illustrative state" />
        <StatBlock label="Open activities" value={String(activities.length).padStart(2, '0')} detail="Demo participation" />
      </div>
      <div className="dashboard-grid community-dashboard-grid">
        <Panel className="dashboard-main-panel" eyebrow="LIVE & UP NEXT · DEMO" title="Competitions to follow" action={<Link className="text-action" to="/arena">Explore arena <ArrowRight size={15} /></Link>}>
          <div className="compact-battle-list">{activeBattles.slice(0, 2).map((battle) => <BattleCard battle={battle} key={battle.id} publicView />)}{upcomingBattles.map((battle) => <BattleCard battle={battle} key={battle.id} publicView />)}</div>
        </Panel>
        <Panel className="dashboard-side-panel" eyebrow="YOUR NEXT MOVE" title="Open community activities">
          <div className="activity-mini-list">{activities.slice(0, 3).map((activity) => <Link key={activity.id} to="/community/activities"><span className="activity-mini-icon"><Vote size={15} /></span><span><strong>{activity.title}</strong><small>Ends {formatWhen(activity.endsAt)}</small></span><ArrowRight size={15} /></Link>)}</div>
        </Panel>
        <Panel className="dashboard-chart-panel" eyebrow="CREATORS TO KNOW" title="A few voices from the arena">
          <div className="creator-inline-list">{demoCreators.slice(0, 3).map((creator) => <Link key={creator.id} to={'/creators/' + creator.id}><CreatorAvatar creator={creator} size="small" /><span><strong>{creator.name}</strong><small>{creator.category}</small></span><ArrowRight size={15} /></Link>)}</div>
        </Panel>
        <Panel className="dashboard-quick-panel" eyebrow="YOUR SUPPORT TOKENS" title={supportTokens.toLocaleString() + ' available in demo'}>
          <p className="panel-copy">Community Support Tokens and creator Clash Coins have separate purposes. No transaction is available in this preview.</p>
          <Link className="text-action" to="/community/wallet"><Wallet size={15} /> View Support Token history <ArrowRight size={15} /></Link>
        </Panel>
      </div>
    </div>
  )
}

export function CommunityDiscoverPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const followed = useDemoStore((state) => state.followedCreators)
  const toggleFollow = useDemoStore((state) => state.toggleFollow)
  const creators = demoCreators.filter((creator) =>
    (category === 'All categories' || creator.category === category) &&
    (creator.name + creator.category + creator.bio).toLowerCase().includes(query.toLowerCase()),
  )
  const allBattles = useDemoStore((state) => state.battles)
  const battles = allBattles.filter((battle) => battle.status !== 'completed')
  const categories = ['All categories', ...creatorCategories]
  return (
    <div className="workspace-page">
      <PageHeading eyebrow="COMMUNITY · DISCOVER" title="Find a competition worth gathering for." description="Browse the demo arena and the creators behind each moment." action={<DemoBadge>DEMO DIRECTORY</DemoBadge>} />
      <DemoNotice>Sample profiles, audience counts, and competition details. Following a creator is saved locally only.</DemoNotice>
      <div className="filter-bar workspace-filters">
        <label className="search-field"><Search aria-hidden="true" size={16} /><span className="sr-only">Search creators</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Search creators and challenges" value={query} /></label>
        <label className="filter-control"><span className="sr-only">Creator category</span><select onChange={(event) => setCategory(event.target.value)} value={category}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <DemoBadge>CURATED SAMPLE</DemoBadge>
      </div>
      <section className="section-block">
        <div className="section-title-row"><div><p className="eyebrow">CREATOR INDEX</p><h2>People to meet</h2></div><span className="eyebrow">{creators.length} SAMPLE PROFILES</span></div>
        <div className="creator-grid community-creator-grid">{creators.map((creator) => <div className="follow-wrap" key={creator.id}><CreatorFeature creator={creator} /><button aria-pressed={followed.includes(creator.id)} className={followed.includes(creator.id) ? 'follow-button followed' : 'follow-button'} onClick={() => toggleFollow(creator.id)} type="button">{followed.includes(creator.id) ? <Check size={14} /> : <Heart size={14} />}{followed.includes(creator.id) ? 'Following in demo' : 'Follow locally'}</button></div>)}</div>
        {!creators.length && <EmptyState title="No creators match that search." description="Try another name or category." />}
      </section>
      <section className="section-block">
        <div className="section-title-row"><div><p className="eyebrow">UPCOMING AND LIVE</p><h2>Competitions to explore</h2></div><Link className="text-action" to="/arena">Open public arena <ArrowRight size={15} /></Link></div>
        <div className="battle-list">{battles.map((battle) => <BattleCard battle={battle} key={battle.id} publicView />)}</div>
      </section>
    </div>
  )
}

export function CommunityActivitiesPage() {
  const votes = useDemoStore((state) => state.votes)
  const castVote = useDemoStore((state) => state.castVote)
  const complete = useDemoStore((state) => state.completeDemoActivity)
  const [notice, setNotice] = useState('')
  const choices = ['A tiny moon café', 'A city inside a teacup', 'A forest that hums']
  const handleVote = (activityId: string, choice: string) => {
    if (votes[activityId]) return
    castVote(activityId, choice)
    complete('vote-' + activityId)
    setNotice('Your demo vote was saved in this browser. No wallet transaction is connected.')
  }

  return (
    <div className="workspace-page">
      <PageHeading eyebrow="COMMUNITY · ACTIVITIES" title="Your voice belongs in the room." description="Vote on a challenge prompt, play a demo mini-game, or explore community competition." action={<DemoBadge>DEMO ACTIVITIES</DemoBadge>} />
      <DemoNotice>Voting and activity completion are local demo interactions. Token eligibility and awards require a server connection.</DemoNotice>
      {notice && <InlineNotice>{notice}</InlineNotice>}
      <div className="activity-feed">
        {demoActivities.map((activity, index) => {
          const creator = creatorById(activity.creatorId)
          return (
            <article className="activity-feature" key={activity.id}>
              <div className="activity-feature-meta"><span className="activity-index">0{index + 1}</span><DemoBadge /><span className="activity-deadline">Ends {formatWhen(activity.endsAt)}</span></div>
              <div className="activity-feature-heading"><CreatorAvatar creator={creator} size="small" /><div><span className="eyebrow">{activity.kind.replace('-', ' ').toUpperCase()} · {creator.name}</span><h2>{activity.title}</h2></div></div>
              {activity.kind === 'vote' ? (
                <fieldset className="vote-options">
                  <legend className="sr-only">Choose a challenge prompt</legend>
                  {choices.map((choice, choiceIndex) => (
                    <button aria-pressed={votes[activity.id] === choice} className={votes[activity.id] === choice ? 'vote-option selected' : 'vote-option'} disabled={Boolean(votes[activity.id])} key={choice} onClick={() => handleVote(activity.id, choice)} type="button">
                      <span>0{choiceIndex + 1}</span>{choice}<span className="vote-percent">{votes[activity.id] === choice ? 'YOUR PICK' : [42, 33, 25][choiceIndex] + '%'}</span>
                    </button>
                  ))}
                  <small className="demo-caption">Illustrative poll distribution · DEMO</small>
                </fieldset>
              ) : (
                <p className="activity-description">
                  {activity.kind === 'quiz' ? 'Answer a short knowledge round and see your local demo score.' :
                    activity.kind === 'mini-game' ? 'Try a fast reaction round against your own best time.' :
                      'Explore the monthly popularity showcase and sample creator rankings.'}
                </p>
              )}
              <div className="activity-feature-footer">
                  <span>{activity.kind === 'vote' ? (votes[activity.id] ? 'Vote recorded in this browser' : 'One local demo vote') : 'Participation is local; no token award is connected'}</span>
                {activity.kind === 'quiz' ? <Link className="text-action" to="/community/activities/quick-quiz">Start Quick Quiz <ArrowRight size={15} /></Link> :
                  activity.kind === 'mini-game' ? <Link className="text-action" to="/community/activities/reaction-rush">Play Reaction Rush <ArrowRight size={15} /></Link> :
                    activity.kind === 'support' ? <Link className="text-action" to="/community/support">Explore support <ArrowRight size={15} /></Link> : null}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export function CommunitySupportPage() {
  const supportDialog = useRef<HTMLDialogElement>(null)
  const supportTokens = useDemoStore((state) => state.supportTokens)
  const [amount, setAmount] = useState(25)
  const [selectedCreator, setSelectedCreator] = useState<(typeof demoCreators)[number] | null>(null)
  useEffect(() => {
    const dialog = supportDialog.current
    if (!dialog) return
    if (selectedCreator && !dialog.open) dialog.showModal()
    if (!selectedCreator && dialog.open) dialog.close()
  }, [selectedCreator])
  return (
    <div className="workspace-page">
      <PageHeading eyebrow="COMMUNITY · CREATOR SUPPORT" title="Choose who you want to cheer on." description="Explore a local demonstration of how community support can appear in the monthly popularity showcase." action={<DemoBadge>DEMO ONLY</DemoBadge>} />
      <DemoNotice>Creator support is preview-only here. Support Tokens cannot be moved until the server-side ledger is connected.</DemoNotice>
      <div className="support-balance">
        <div><span className="eyebrow">SUPPORT TOKENS · DEMO</span><strong>{supportTokens.toLocaleString()}</strong><span>available in this browser</span></div>
        <p>Support Tokens are a separate community currency in the product concept. Clash Coins belong to creators and are not used here.</p>
      </div>
      <div className="support-amount-row"><span className="eyebrow">DEMO CONTRIBUTION · SUPPORT TOKENS</span>{[10, 25, 50, 100].map((value) => <button aria-pressed={amount === value} className={amount === value ? 'amount-choice selected' : 'amount-choice'} key={value} onClick={() => setAmount(value)} type="button">{value} tokens</button>)}</div>
      <div className="support-creator-list">
        {demoCreators.map((creator, index) => (
          <article className="support-creator-row" key={creator.id}>
            <span className="support-rank">0{index + 1}</span>
            <CreatorAvatar creator={creator} size="medium" />
            <div className="support-creator-copy"><Link to={'/creators/' + creator.id}>{creator.name}</Link><span>{creator.category} · {creator.handle}</span></div>
            <div className="support-meter"><span style={{ width: Math.max(8, 78 - index * 6) + '%' }} /><small>{formatCompact(Math.max(0, 4_820 - index * 360))} demo support</small></div>
            <button className="button button-secondary" onClick={() => setSelectedCreator(creator)} type="button"><Heart size={15} />Preview support</button>
          </article>
        ))}
      </div>
      <Panel eyebrow="SUPPORT HISTORY" title="No confirmed support yet"><p className="panel-copy">This preview does not write token transactions. Confirmed support history will appear here when a secure wallet service is connected.</p><Link className="text-action" to="/community/wallet"><Wallet size={15} /> Review token history <ArrowRight size={15} /></Link></Panel>
      <dialog className="support-confirm-preview" ref={supportDialog} aria-labelledby="support-preview-title" onCancel={(event) => { event.preventDefault(); setSelectedCreator(null) }}>{selectedCreator && <div><p className="eyebrow">SUPPORT PREVIEW · NO TRANSACTION</p><h2 id="support-preview-title">Support {selectedCreator.name}?</h2><p>You selected {amount} Support Tokens. This preview cannot submit or reserve tokens, and standings will not change.</p><div className="support-preview-summary"><CreatorAvatar creator={selectedCreator} size="small" /><span>{selectedCreator.category}</span><strong>{amount} tokens</strong></div><div className="hero-actions"><button className="button button-secondary" onClick={() => setSelectedCreator(null)} type="button">Close preview</button><button className="button button-primary" disabled type="button">Support unavailable</button></div></div>}</dialog>
    </div>
  )
}

export function CommunityChampionshipPage() {
  return (
    <div className="workspace-page">
      <PageHeading eyebrow="COMMUNITY · MONTHLY CHAMPIONSHIP" title="The month belongs to the people who show up." description="Follow three consecutive 24-hour rounds, separate from creator skill scores." action={<DemoBadge>DEMO EDITION</DemoBadge>} />
      <DemoNotice>Round timing, pairings, rankings, and contributions are sample data. Contribution validation requires a backend and is not connected.</DemoNotice>
      <div className="championship-community-grid">
        <Panel className="championship-round-panel" eyebrow="ROUND 02 OF 03" title="Community spotlight">
          <div className="round-countdown"><span>TIME REMAINING</span><strong>11:24:08</strong><DemoBadge /></div>
          <div className="round-progress"><span style={{ width: '63%' }} /></div>
          <p className="panel-copy">Support a creator you enjoy. Popularity support contributes to the monthly community ranking, not the skill result of any battle.</p>
          <Link className="button button-primary" to="/community/support">Choose a creator <ArrowRight size={16} /></Link>
          <ol className="round-list">
            <li><span>01</span><div><strong>Opening call</strong><small>Community discovers the event</small></div><span className="round-done">Complete</span></li>
            <li><span>02</span><div><strong>Community spotlight</strong><small>Support round</small></div><span className="round-current">In demo</span></li>
            <li><span>03</span><div><strong>Finale</strong><small>Monthly reveal</small></div><span>Upcoming</span></li>
          </ol>
        </Panel>
        <Panel eyebrow="POPULARITY RANKING" title="Monthly demo standings"><Leaderboard /></Panel>
      </div>
      <div className="detail-grid">
        <Panel eyebrow="DAILY WINNERS" title="The rounds so far">
          <div className="daily-winner"><span>ROUND 01</span><CreatorAvatar creator={creatorById('juno-park')} size="small" /><strong>Juno Park</strong><DemoBadge /></div>
          <div className="daily-winner"><span>ROUND 02</span><CreatorAvatar creator={creatorById('mira-vale')} size="small" /><strong>Mira Vale</strong><DemoBadge /></div>
          <div className="daily-winner"><span>ROUND 03</span><span className="pending-winner">Awaiting finale</span></div>
        </Panel>
        <Panel eyebrow="SEPARATE SCOREBOARDS" title="Popularity ≠ skill">
          <p className="panel-copy">Community support determines popularity ordering. Objective, manual opponent-verified, and audience-judged skill results belong to individual competitions and are not added into this ranking.</p>
        </Panel>
      </div>
    </div>
  )
}

export function CommunityWalletPage() {
  const balance = useDemoStore((state) => state.supportTokens)
  const allTransactions = useDemoStore((state) => state.transactions)
  const transactions = allTransactions.filter((entry) => entry.currency === 'Support Tokens')
  return (
    <div className="workspace-page">
      <PageHeading eyebrow="COMMUNITY · WALLET" title="Your Support Token activity." description="A transparent view of demo participation grants and community support." action={<DemoBadge>LOCAL DEMO</DemoBadge>} />
      <DemoNotice>This balance and ledger are stored in local demo state. They have no real value and do not change any production balance.</DemoNotice>
      <section className="wallet-hero">
        <div className="wallet-orb" aria-hidden="true">S</div>
        <div><span className="eyebrow">SUPPORT TOKENS</span><strong>{balance.toLocaleString()}</strong><span>community demo balance</span></div>
        <p>Support Tokens belong to community members. Clash Coins are a separate creator currency and are shown in the creator rewards workspace.</p>
      </section>
      <Panel eyebrow="LOCAL LEDGER" title="Recent activity" action={<DemoBadge>DEMO ENTRIES</DemoBadge>}>
        <div className="transaction-table-wrap">
          <table className="transaction-table">
            <thead><tr><th>Activity</th><th>Type</th><th>Date</th><th className="align-right">Amount</th></tr></thead>
            <tbody>{transactions.map((entry) => <tr key={entry.id}><td><strong>{entry.description}</strong></td><td><span className="transaction-kind">{entry.kind}</span></td><td>{formatWhen(entry.createdAt)}</td><td className={entry.amount < 0 ? 'align-right amount-negative' : 'align-right amount-positive'}>{entry.amount > 0 ? '+' : ''}{entry.amount}</td></tr>)}</tbody>
          </table>
          {!transactions.length && <EmptyState title="No demo activity yet." description="Complete a local participation demo to see an illustrative entry." />}
        </div>
      </Panel>
      <DemoNotice>Demo transaction entries illustrate a possible ledger presentation. No wallet service is connected.</DemoNotice>
    </div>
  )
}

export function CommunityRewardsPage() {
  const completed = useDemoStore((state) => state.completedActivities)
  const followedCreators = useDemoStore((state) => state.followedCreators)
  const milestones = [
    { id: 'first-vote', title: 'First voice', description: 'Cast a demo vote in a challenge poll.', progress: completed.some((id) => id.startsWith('vote-')) ? 1 : 0, target: 1, icon: Vote },
    { id: 'three-activities', title: 'In the room', description: 'Complete three demo participation activities.', progress: Math.min(3, completed.length), target: 3, icon: Users },
    { id: 'meet-three', title: 'Find your people', description: 'Follow three creators in the local demo directory.', progress: Math.min(3, followedCreators.length), target: 3, icon: Heart },
  ]
  return (
    <div className="workspace-page">
      <PageHeading eyebrow="COMMUNITY · REWARDS" title="Recognition for showing up." description="Explore illustrative participation badges and community milestones." action={<DemoBadge>DEMO REWARDS</DemoBadge>} />
      <DemoNotice>Badges and progress are local demo illustrations. They are not a real reward grant or eligibility record.</DemoNotice>
      <div className="milestone-list">{milestones.map((item) => {
        const Icon = item.icon
        return <article className="milestone-row" key={item.id}><span className="milestone-icon"><Icon size={19} /></span><div className="milestone-copy"><span className="eyebrow">COMMUNITY MILESTONE</span><h2>{item.title}</h2><p>{item.description}</p><div className="milestone-progress"><span style={{ width: (item.progress / item.target * 100) + '%' }} /></div><small>{item.progress} / {item.target} demo activities</small></div><span className={item.progress >= item.target ? 'milestone-status earned' : 'milestone-status'}>{item.progress >= item.target ? <><Award size={16} /> Demo earned</> : 'In progress'}</span></article>
      })}</div>
      <Panel eyebrow="COMMUNITY COLLECTION" title="Participation marks">
        <div className="badge-gallery"><div><span className="badge-object badge-lilac">CC</span><strong>Early signal</strong><small>Community participation</small></div><div><span className="badge-object badge-gold">✦</span><strong>Round supporter</strong><small>Championship activity</small></div><div><span className="badge-object badge-green">↗</span><strong>Good sport</strong><small>Competition spirit</small></div></div>
      </Panel>
    </div>
  )
}

export function CommunitySettingsPage() {
  const [saved, setSaved] = useState('')
  const [preferences, setPreferences] = useState<Record<'competitionUpdates' | 'activityReminders' | 'reducedMotion', boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('creator-clash-community-settings') ?? '{"competitionUpdates":true,"activityReminders":false,"reducedMotion":false}') as Record<string, boolean>
    } catch {
      return { competitionUpdates: true, activityReminders: false, reducedMotion: false }
    }
  })
  const update = (key: string, value: boolean) => {
    const next = { ...preferences, [key]: value }
    setPreferences(next)
    localStorage.setItem('creator-clash-community-settings', JSON.stringify(next))
    if (key === 'reducedMotion') announceMotionPreferenceChange()
    setSaved('Preference saved locally in this browser.')
  }
  return (
    <div className="workspace-page">
      <PageHeading eyebrow="COMMUNITY · PROFILE" title="Make the viewing deck yours." description="Manage local display and activity preferences for this demo." action={<DemoBadge>LOCAL PROFILE</DemoBadge>} />
      <DemoNotice>Settings are stored in this browser only. Notification delivery and account preferences are not connected.</DemoNotice>
      {saved && <InlineNotice>{saved}</InlineNotice>}
      <div className="settings-layout">
        <Panel eyebrow="YOUR EXPERIENCE" title="Community preferences">
          <div className="setting-row"><div><strong>Competition updates</strong><small>Show sample competition and championship updates.</small></div><input aria-label="Competition updates" checked={preferences['competitionUpdates']} onChange={(event) => update('competitionUpdates', event.target.checked)} type="checkbox" /></div>
          <div className="setting-row"><div><strong>Activity reminders</strong><small>Remember your demo preference for activity reminders.</small></div><input aria-label="Activity reminders" checked={preferences['activityReminders']} onChange={(event) => update('activityReminders', event.target.checked)} type="checkbox" /></div>
          <div className="setting-row"><div><strong>Reduced motion</strong><small>Reduce nonessential animation in this browser preview. System settings are always respected.</small></div><input aria-label="Reduced motion" checked={preferences['reducedMotion']} onChange={(event) => update('reducedMotion', event.target.checked)} type="checkbox" /></div>
        </Panel>
        <Panel eyebrow="CURRENCIES" title="Two different roles">
          <div className="currency-explainer"><span className="currency-symbol support-symbol">S</span><div><strong>Support Tokens</strong><small>Community participation and creator support · demo</small></div></div>
          <div className="currency-explainer"><span className="currency-symbol coin-symbol">C</span><div><strong>Clash Coins</strong><small>Creator competition rewards and cosmetics · demo</small></div></div>
        </Panel>
      </div>
    </div>
  )
}
