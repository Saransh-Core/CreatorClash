import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  ArrowUpRight,
  CirclePlay,
  Clock3,
  Compass,
  Mail,
  Plus,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'
import { z } from 'zod'
import { BattleCard } from '../../components/data/BattleCard'
import { Leaderboard } from '../../components/data/Leaderboard'
import { WeeklyChart } from '../../components/data/WeeklyChart'
import { CreatorAvatar } from '../../components/ui/CreatorAvatar'
import { DemoBadge } from '../../components/ui/DemoBadge'
import { DemoNotice } from '../../components/ui/DemoNotice'
import { EmptyState } from '../../components/ui/EmptyState'
import { InlineNotice } from '../../components/ui/InlineNotice'
import { PageHeading } from '../../components/ui/PageHeading'
import { Panel } from '../../components/ui/Panel'
import { StatBlock } from '../../components/ui/StatBlock'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { challengeSuggestions, creatorById, creatorCategories, demoActivities, demoCreators, formatCompact, formatWhen } from '../../services/demoData'
import { useDemoStore } from '../../stores/demoStore'
import type { Battle, BattlePhase } from '../../types/domain'
import { getDemoStartTime } from '../../utils/date'
import { useAuth } from '../auth/useAuth'
import { createBattle as createRemoteBattle, fetchBattles, fetchCreators, fetchInvitations, respondToInvitation } from '../../services/competitionApi'

export function CreatorOverviewPage() {
  const battles = useDemoStore((state) => state.battles)
  const session = useDemoStore((state) => state.session)
  const clashCoins = useDemoStore((state) => state.clashCoins)
  const invitations = useDemoStore((state) => state.invitations)
  const active = battles.filter((battle) => battle.status === 'live')
  const upcoming = battles.filter((battle) => battle.status === 'upcoming')
  const incomingInvitations = invitations.filter((invitation) => invitation.status === 'incoming')
  return (
    <div className="workspace-page">
      <PageHeading
        eyebrow="CREATOR WORKSPACE · OVERVIEW"
        title={'Good to see you, ' + (session?.name.split(' ')[0] ?? 'creator') + '.'}
        description="Your creative work, competition plans, and community moments in one place."
        action={<DemoBadge>LOCAL DEMO</DemoBadge>}
      />
      <DemoNotice>All competition, audience, and earnings figures below are local demo data. No stream or production service is connected.</DemoNotice>
      {incomingInvitations.length > 0 && <Link className="invitation-callout" to="/creator/battles/invitations"><span className="invitation-callout-icon"><Mail size={17} /></span><span><strong>{incomingInvitations.length} invitation{incomingInvitations.length === 1 ? '' : 's'} need a response</strong><small>Review the sample invitation in your local demo.</small></span><ArrowRight aria-hidden="true" size={16} /></Link>}
      <div className="stats-row">
        <StatBlock label="Live competitions" value={String(active.length).padStart(2, '0')} detail="Illustrative current state" tone="accent" />
        <StatBlock label="Upcoming" value={String(upcoming.length).padStart(2, '0')} detail="Sample schedule" />
        <StatBlock label="Invitations" value={String(incomingInvitations.length).padStart(2, '0')} detail="Needs your review" />
        <StatBlock label="Clash Coins" value={clashCoins.toLocaleString()} detail="Local demo balance" />
      </div>
      <div className="dashboard-grid">
        <Panel className="dashboard-main-panel" eyebrow="IN THE ARENA" title="Your competitions" action={<Link className="text-action" to="/creator/battles">All battles <ArrowRight size={15} /></Link>}>
          <div className="compact-battle-list">
            {[...active, ...upcoming].slice(0, 3).map((battle) => <BattleCard battle={battle} key={battle.id} />)}
            {!active.length && <EmptyState title="The arena is quiet." description="Create a demo competition or browse the sample matchup list." action={<Link className="button button-secondary" to="/creator/battles/create">Create a demo battle</Link>} />}
          </div>
        </Panel>
        <Panel className="dashboard-side-panel" eyebrow="THIS MONTH · DEMO" title="Popularity championship" action={<Link aria-label="Open championship" className="icon-link" to="/creator/championship"><ArrowUpRight size={16} /></Link>}>
          <p className="panel-copy">Three consecutive rounds bring communities together around the creators they enjoy.</p>
          <div className="mini-leader"><CreatorAvatar creator={creatorById('juno-park')} size="small" /><span><strong>Juno Park</strong><small>Sample leader · 4.8k support</small></span><Trophy aria-hidden="true" size={16} /></div>
          <Link className="text-action" to="/creator/championship">Explore the demo event <ArrowRight size={15} /></Link>
        </Panel>
        <Panel className="dashboard-chart-panel" eyebrow="LAST 7 DAYS" title="Community participation">
          <WeeklyChart />
        </Panel>
        <Panel className="dashboard-quick-panel" eyebrow="MAKE YOUR NEXT MOVE" title="Quick actions">
          <div className="quick-actions-list">
            <Link to="/creator/battles/create"><Plus size={16} />Create a battle<ArrowRight size={15} /></Link>
            <Link to="/creator/battles/find"><Compass size={16} />Find an opponent<ArrowRight size={15} /></Link>
            <Link to="/creator/ai-director"><Sparkles size={16} />Open challenge director<ArrowRight size={15} /></Link>
            <Link to="/creator/mini-games"><CirclePlay size={16} />Preview mini-games<ArrowRight size={15} /></Link>
          </div>
        </Panel>
      </div>
    </div>
  )
}

export function CreatorEngagementPage() {
  return (
    <div className="workspace-page">
      <PageHeading eyebrow="CREATOR WORKSPACE · COMMUNITY" title="See how the community joins in." description="Review the example activity types and weekly participation pattern used in this local demo." action={<DemoBadge>DEMO ACTIVITY</DemoBadge>} />
      <DemoNotice>Participation figures and activity windows are illustrative sample content. No Twitch chat, audience or live participation data is connected.</DemoNotice>
      <div className="creator-engagement-layout">
        <Panel eyebrow="WEEKLY SAMPLE" title="Participation over seven days">
          <WeeklyChart />
        </Panel>
        <Panel eyebrow="ACTIVITY EXAMPLES" title="Ways the community can take part">
          <div className="creator-engagement-list">
            {demoActivities.map((activity) => (
              <article key={activity.id}>
                <span className="engagement-kind">{activity.kind.replace('-', ' ')}</span>
                <div><strong>{activity.title}</strong><small>For {creatorById(activity.creatorId).name} · ends {formatWhen(activity.endsAt)}</small></div>
              </article>
            ))}
          </div>
          <Link className="text-action" to="/creator/ai-director">Plan a challenge prompt <ArrowRight size={15} /></Link>
        </Panel>
      </div>
    </div>
  )
}

export function CreatorBattlesPage({ filter = 'all' }: { filter?: 'all' | 'invitations' | 'history' }) {
  const auth = useAuth()
  const accessToken = auth.session?.access_token
  const remoteBattles = useQuery({ queryKey: ['api-battles', accessToken], queryFn: () => fetchBattles(accessToken!), enabled: auth.configured && Boolean(accessToken) })
  const battles = useDemoStore((state) => state.battles)
  const [query, setQuery] = useState('')
  const filtered = battles.filter((battle) => {
    const validStatus =
      filter === 'history' ? battle.status === 'completed' :
      filter === 'invitations' ? false : true
    return validStatus && (battle.title + battle.category).toLowerCase().includes(query.toLowerCase())
  })
  const heading = filter === 'history' ? 'Battle history' : filter === 'invitations' ? 'Invitations' : 'Battle arena'
  return (
    <div className="workspace-page">
      <PageHeading
        eyebrow="CREATOR WORKSPACE · BATTLES"
        title={heading}
        description={filter === 'history' ? 'Review completed demo competitions and their illustrative scores.' : 'Plan a challenge, find a creative counterpart, and bring your community along.'}
        action={filter === 'invitations' ? <Link className="button button-primary" to="/creator/battles/create"><Plus size={16} />Create a battle</Link> : <Link className="button button-primary" to="/creator/battles/create"><Plus size={16} />Create battle</Link>}
      />
      {auth.configured ? <p className="inline-notice">Showing battles returned by the authenticated API. Invitation delivery and later lifecycle actions are not yet implemented.</p> : <DemoNotice>Competition records and statuses are local demo data. No invitation is delivered to another account.</DemoNotice>}
      <div className="subnav-tabs" aria-label="Battle sections">
        <Link aria-current={filter === 'all' ? 'page' : undefined} to="/creator/battles">All battles</Link>
        <Link to="/creator/battles/find">Find opponent</Link>
        <Link aria-current={filter === 'invitations' ? 'page' : undefined} to="/creator/battles/invitations">Invitations</Link>
        <Link aria-current={filter === 'history' ? 'page' : undefined} to="/creator/battles/history">History</Link>
      </div>
      {filter === 'invitations' ? <InvitationsContent /> : auth.configured ? (
        <div className="battle-list">
          {remoteBattles.isPending && <p className="panel-copy">Loading battles…</p>}
          {remoteBattles.isError && <InlineNotice>{remoteBattles.error.message}</InlineNotice>}
          {remoteBattles.data?.filter((battle) => (filter !== 'history' || battle.status === 'completed') && (battle.title + battle.category).toLowerCase().includes(query.toLowerCase())).map((battle) => (
            <article className="battle-card" key={battle.id}><div><span className="eyebrow">{battle.status.replaceAll('_', ' ')} · {battle.category}</span><h3>{battle.title}</h3><p className="panel-copy">{battle.format.replaceAll('-', ' ')} · {battle.duration_minutes} minutes</p></div><Link className="button button-secondary" to={`/creator/battles/${battle.id}`}>View details <ArrowRight size={15} /></Link></article>
          ))}
          {!remoteBattles.isPending && !remoteBattles.data?.length && <EmptyState title="No battles yet." description="Create a battle invitation to start the first competition record." action={<Link className="button button-primary" to="/creator/battles/create">Create a battle</Link>} />}
        </div>
      ) : (
        <>
          <label className="search-field page-search">
            <Compass aria-hidden="true" size={16} />
            <span className="sr-only">Search battles</span>
            <input onChange={(event) => setQuery(event.target.value)} placeholder="Search by title or category" value={query} />
          </label>
          <div className="battle-list">
            {filtered.map((battle) => <BattleCard battle={battle} key={battle.id} />)}
            {!filtered.length && <EmptyState title="No battles found." description="Try another search or create a demo competition." />}
          </div>
        </>
      )}
    </div>
  )
}

const createBattleSchema = z.object({
  title: z.string().trim().min(4, 'Use at least 4 characters.').max(70),
  format: z.enum(['creator-vs-creator', 'creator-vs-community', 'community-vs-community']),
  opponent: z.string().min(1, 'Choose an opponent.'),
  category: z.enum(creatorCategories),
  duration: z.coerce.number().int().min(10, 'Choose at least 10 minutes.').max(120, 'Choose no more than 120 minutes.'),
  challenge: z.string().trim().min(8, 'Add a short challenge brief.').max(240),
  rules: z.string().max(500),
})

type CreateBattleInput = z.input<typeof createBattleSchema>
type CreateBattleOutput = z.output<typeof createBattleSchema>

export function CreateBattlePage() {
  const auth = useAuth()
  const accessToken = auth.session?.access_token
  const queryClient = useQueryClient()
  const remoteCreators = useQuery({ queryKey: ['api-creators', accessToken], queryFn: () => fetchCreators(accessToken!), enabled: auth.configured && Boolean(accessToken) })
  const navigate = useNavigate()
  const createBattle = useDemoStore((state) => state.createBattle)
  const [step, setStep] = useState(1)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateBattleInput, unknown, CreateBattleOutput>({
    resolver: zodResolver(createBattleSchema),
    defaultValues: {
      title: '',
      format: 'creator-vs-creator',
      opponent: '',
      category: 'Art & Creativity',
      duration: 30,
      challenge: '',
      rules: '',
    },
  })
  const values = useWatch({ control })
  const categoryExample = challengeSuggestions.find((item) => item.category === values.category)

  const nextStep = async () => {
    const valid = await trigger(step === 1 ? ['title', 'format', 'opponent'] : ['category', 'duration', 'challenge'])
    if (valid) setStep((current) => Math.min(3, current + 1))
  }
  const previousStep = () => setStep((current) => Math.max(1, current - 1))
  const submit = handleSubmit(async (values) => {
    if (auth.configured) {
      if (!accessToken) return
      try {
        setSubmitError('')
        await createRemoteBattle(accessToken, {
          title: values.title,
          format: values.format,
          opponentId: values.opponent,
          category: values.category,
          challengeBrief: values.challenge,
          durationMinutes: values.duration,
          rules: values.rules,
        })
        await queryClient.invalidateQueries({ queryKey: ['api-battles'] })
        setSuccess(true)
        window.setTimeout(() => navigate('/creator/battles'), 700)
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'The battle could not be created.')
      }
      return
    }
    const battle: Battle = {
      id: 'demo-' + crypto.randomUUID().slice(0, 8),
      title: values.title,
      creatorOneId: 'mira-vale',
      creatorTwoId: values.opponent,
      category: values.category,
      format: values.format,
      status: 'upcoming',
      challenge: values.challenge,
      startsAt: getDemoStartTime(),
      durationMinutes: values.duration,
      progress: 0,
      scoreOne: 0,
      scoreTwo: 0,
      featured: false,
    }
    createBattle(battle)
    setSuccess(true)
    window.setTimeout(() => navigate('/creator/battles'), 900)
  })

  return (
    <div className="workspace-page">
      <PageHeading eyebrow={auth.configured ? 'BATTLE SETUP · API' : 'BATTLE SETUP · LOCAL DEMO'} title="Set the stage." description={auth.configured ? 'Create a server-validated competition record and invitation.' : 'Build a competition brief. This draft stays in your browser and is not sent to another creator.'} />
      {auth.configured ? <p className="inline-notice">The API currently supports creator versus creator invitations. Scheduling, match delivery and later lifecycle actions are not connected.</p> : <DemoNotice>Creating a battle only changes this browser’s local demo data. No invitation or live event is created.</DemoNotice>}
      <div className="wizard-layout">
        <ol aria-label="Battle setup steps" className="wizard-steps">
          {['Format & opponent', 'Challenge brief', 'Review'].map((label, index) => (
            <li aria-current={step === index + 1 ? 'step' : undefined} className={step === index + 1 ? 'wizard-step active' : step > index + 1 ? 'wizard-step done' : 'wizard-step'} key={label}>
              <span>{step > index + 1 ? '✓' : String(index + 1).padStart(2, '0')}</span>{label}
            </li>
          ))}
        </ol>
        <form className="wizard-form" onSubmit={submit}>
          {step === 1 && (
            <section className="form-step">
              <p className="eyebrow">STEP 01 · THE MATCHUP</p>
              <h2>Who is entering the arena?</h2>
              <label className="field-label">Competition title
                <input className="text-input" maxLength={70} placeholder="Give this matchup a name" {...register('title')} />
                {errors.title && <span className="field-error">{errors.title.message}</span>}
              </label>
              <label className="field-label">Competition type
                <select className="text-input" {...register('format')}>
                  <option value="creator-vs-creator">Creator vs Creator</option>
                  {!auth.configured && <><option value="creator-vs-community">Creator vs Community</option><option value="community-vs-community">Community vs Community</option></>}
                </select>
              </label>
              <label className="field-label">{auth.configured ? 'Creator opponent' : 'Demo opponent'}
                <select className="text-input" {...register('opponent')}>
                  <option value="">{auth.configured ? 'Choose a registered creator' : 'Choose a sample creator'}</option>
                  {auth.configured ? remoteCreators.data?.filter((creator) => creator.user_id !== auth.session?.user.id).map((creator) => {
                    const profile = Array.isArray(creator.profiles) ? null : creator.profiles
                    return <option key={creator.user_id} value={creator.user_id}>{profile?.display_name || creator.handle} · {creator.category}</option>
                  }) : demoCreators.filter((creator) => creator.id !== 'mira-vale').map((creator) => <option key={creator.id} value={creator.id}>{creator.name} · {creator.category}</option>)}
                </select>
                {errors.opponent && <span className="field-error">{errors.opponent.message}</span>}
                {auth.configured && remoteCreators.isPending && <span className="field-hint">Loading creator profiles…</span>}
                {auth.configured && remoteCreators.isError && <span className="field-error">{remoteCreators.error.message}</span>}
                {auth.configured && remoteCreators.data?.length === 0 && <span className="field-hint">No creator profiles are available yet. Sign up in Creator mode to create one.</span>}
              </label>
            </section>
          )}
          {step === 2 && (
            <section className="form-step">
              <p className="eyebrow">STEP 02 · THE CHALLENGE</p>
              <h2>Make the brief easy to understand.</h2>
              <label className="field-label">Category
                <select className="text-input" {...register('category')}>
                  {creatorCategories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              {categoryExample && <div className="category-example"><p>Need a starting point? Try a curated {values.category} brief.</p><button className="text-action" onClick={() => setValue('challenge', categoryExample.rules, { shouldDirty: true, shouldValidate: true })} type="button">Use this example <ArrowRight size={14} /></button></div>}
              <label className="field-label">Duration in minutes
                <input className="text-input" type="number" min="10" max="120" {...register('duration')} />
                {errors.duration && <span className="field-error">{errors.duration.message}</span>}
              </label>
              <label className="field-label">Challenge brief
                <textarea className="text-input text-area" maxLength={240} placeholder="What will the creators do?" {...register('challenge')} />
                {errors.challenge && <span className="field-error">{errors.challenge.message}</span>}
              </label>
              <details className="advanced-settings">
                <summary>Advanced options</summary>
                <label className="field-label">Additional rules <span className="optional-label">OPTIONAL</span>
                  <textarea className="text-input text-area" maxLength={500} placeholder="Clarify any constraints or judging notes" {...register('rules')} />
                  {errors.rules && <span className="field-error">{errors.rules.message}</span>}
                </label>
              </details>
            </section>
          )}
          {step === 3 && (
            <section className="form-step">
              <p className="eyebrow">STEP 03 · REVIEW</p>
              <h2>{auth.configured ? 'Review the invitation.' : 'Ready for the demo arena.'}</h2>
              <div className="review-note">{auth.configured ? <p>The API validates and stores this invitation. It does not start a live event or notify Twitch.</p> : <><DemoBadge /><p>When you create this item, it is saved locally and labelled as a demo. No creator is notified and no stream is affected.</p></>}</div>
              <div className="review-summary">
                <span>Title<strong>{values.title || 'Untitled demo'}</strong></span>
                <span>Opponent<strong>{values.opponent ? (auth.configured ? remoteCreators.data?.find((creator) => creator.user_id === values.opponent)?.handle ?? 'Selected creator' : creatorById(values.opponent).name) : 'No opponent selected'}</strong></span>
                <span>Format<strong>{values.format?.replaceAll('-', ' ')}</strong></span>
                <span>Category<strong>{values.category}</strong></span>
                <span>Challenge<strong>{values.challenge || 'No brief entered'}</strong></span>
                <span>Duration<strong>{String(values.duration ?? 30)} minutes</strong></span>
                <span>Lifecycle<strong>{auth.configured ? 'Invitation pending' : 'Upcoming demo'}</strong></span>
              </div>
              {success && <InlineNotice>{auth.configured ? 'Battle invitation created.' : 'Demo battle added to your local list.'}</InlineNotice>}
              {submitError && <InlineNotice>{submitError}</InlineNotice>}
            </section>
          )}
          <div className="wizard-controls">
            {step > 1 ? <button className="button button-quiet" onClick={previousStep} type="button">Back</button> : <Link className="button button-quiet" to="/creator/battles">Cancel</Link>}
            {step < 3 ? <button className="button button-primary" onClick={nextStep} type="button">Continue <ArrowRight size={16} /></button> : <button className="button button-primary" disabled={isSubmitting || success} type="submit"><Plus size={16} />{auth.configured ? 'Create invitation' : 'Create demo battle'}</button>}
          </div>
        </form>
      </div>
    </div>
  )
}

export function OpponentFinderPage() {
  const [category, setCategory] = useState('All categories')
  const [notice, setNotice] = useState('')
  const creators = demoCreators.filter((creator) => category === 'All categories' || creator.category === category)
  return (
    <div className="workspace-page">
      <PageHeading eyebrow="MATCHMAKING · DEMO" title="Find your counterpart." description="Explore sample creator profiles and compatibility cues before building a demo invitation." />
      <DemoNotice>Match scores and audience figures are illustrative, not recommendations from a live matchmaking system.</DemoNotice>
      <div className="filter-bar workspace-filters">
        <label className="filter-control"><span className="sr-only">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{[...new Set(demoCreators.map((creator) => creator.category))].map((item) => <option key={item}>{item}</option>)}</select></label>
        <DemoBadge>CURATED SAMPLE</DemoBadge>
      </div>
      {notice && <InlineNotice>{notice}</InlineNotice>}
      <div className="opponent-list">
        {creators.map((creator, index) => (
          <article className="opponent-row" key={creator.id}>
            <CreatorAvatar creator={creator} size="medium" />
            <div className="opponent-main"><Link to={'/creators/' + creator.id}>{creator.name}</Link><span>{creator.category} · {creator.handle}</span><p>{creator.bio}</p></div>
            <div className="compatibility"><span>DEMO FIT</span><strong>{92 - index * 5}%</strong><small>{creator.wins} sample wins · {formatCompact(creator.followers)} audience</small></div>
            <button className="button button-secondary" onClick={() => setNotice('Demo invitation drafted for ' + creator.name + '. No message was sent.')} type="button"><Mail size={15} />Invite</button>
          </article>
        ))}
      </div>
    </div>
  )
}

function InvitationsContent() {
  const auth = useAuth()
  const accessToken = auth.session?.access_token
  const queryClient = useQueryClient()
  const remoteInvitations = useQuery({ queryKey: ['api-invitations', accessToken], queryFn: () => fetchInvitations(accessToken!), enabled: auth.configured && Boolean(accessToken) })
  const invitations = useDemoStore((state) => state.invitations)
  const respond = useDemoStore((state) => state.respondToInvitation)
  const [notice, setNotice] = useState('')
  if (auth.configured) {
    const respond = async (id: string, accept: boolean) => {
      if (!accessToken) return
      try {
        await respondToInvitation(accessToken, id, accept)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['api-invitations'] }),
          queryClient.invalidateQueries({ queryKey: ['api-battles'] }),
        ])
        setNotice(accept ? 'Invitation accepted. Scheduling is not available yet.' : 'Invitation declined.')
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Could not respond to the invitation.')
      }
    }
    return <>
      {notice && <InlineNotice>{notice}</InlineNotice>}
      {remoteInvitations.isPending && <p className="panel-copy">Loading invitations…</p>}
      {remoteInvitations.isError && <InlineNotice>{remoteInvitations.error.message}</InlineNotice>}
      <div className="invitation-list">
        {remoteInvitations.data?.map((invitation) => {
          const battle = Array.isArray(invitation.battles) ? null : invitation.battles
          return <article className="invitation-row" key={invitation.id}>
            <span className="api-avatar" aria-hidden="true">CC</span>
            <div><span className="eyebrow">{invitation.status.toUpperCase()} · API</span><strong>{battle?.title ?? 'Battle invitation'}</strong><small>{battle?.category ?? 'Creator battle'} · expires {formatWhen(invitation.expires_at)}</small></div>
            {invitation.status === 'pending' ? <div className="invitation-actions"><button className="button button-primary" onClick={() => void respond(invitation.id, true)} type="button">Accept</button><button className="button button-quiet" onClick={() => void respond(invitation.id, false)} type="button">Decline</button></div> : <span className="invitation-state">{invitation.status}</span>}
          </article>
        })}
      </div>
      {!remoteInvitations.isPending && !remoteInvitations.data?.length && <EmptyState title="No invitations yet." description="Invitations to this account will appear here." />}
    </>
  }
  return (
    <>
      {notice && <InlineNotice>{notice}</InlineNotice>}
      <div className="invitation-list">
        {invitations.map((invitation) => {
          const creator = creatorById(invitation.creatorId)
          return (
            <article className="invitation-row" key={invitation.id}>
              <CreatorAvatar creator={creator} size="small" />
              <div><span className="eyebrow">{invitation.status.toUpperCase()} · DEMO</span><strong>{invitation.battleTitle}</strong><small>From {creator.name} · expires {formatWhen(invitation.expiresAt)}</small></div>
              {invitation.status === 'incoming' ? (
                <div className="invitation-actions">
                  <button className="button button-primary" onClick={() => { respond(invitation.id, 'accepted'); setNotice('Demo invitation accepted locally.') }} type="button">Accept</button>
                  <button className="button button-quiet" onClick={() => { respond(invitation.id, 'declined'); setNotice('Demo invitation declined locally.') }} type="button">Decline</button>
                </div>
              ) : <span className="invitation-state">{invitation.status}</span>}
            </article>
          )
        })}
      </div>
    </>
  )
}

export function BattleRoomPage() {
  const { battleId } = useParams()
  const battle = useDemoStore((state) => state.battles.find((item) => item.id === battleId))
  const phase = useDemoStore((state) => state.battlePhases[battleId ?? '']) ?? 'waiting'
  const setPhase = useDemoStore((state) => state.setBattlePhase)
  const [notice, setNotice] = useState('')

  if (!battle) {
    return <div className="workspace-page"><PageHeading eyebrow="BATTLE ROOM" title="This demo battle is unavailable." /><Link className="text-action" to="/creator/battles">Return to battles <ArrowRight size={16} /></Link></div>
  }
  const creatorOne = creatorById(battle.creatorOneId)
  const creatorTwo = creatorById(battle.creatorTwoId)
  const demoWinner = battle.scoreOne === battle.scoreTwo ? null : battle.scoreOne > battle.scoreTwo ? creatorOne : creatorTwo
  const phaseSequence: BattlePhase[] = ['waiting', 'challenge selection', 'challenge acceptance', 'ready', 'live', 'completed']
  const currentIndex = phaseSequence.indexOf(phase)
  const nextPhase = phase === 'cancelled' ? 'waiting' : phaseSequence[Math.min(currentIndex + 1, phaseSequence.length - 1)]!

  return (
    <div className="workspace-page">
      <PageHeading eyebrow="BATTLE ROOM · DEMO STATE MACHINE" title={battle.title} description="The interface previews the competition lifecycle locally; scores and outcomes are illustrative." action={<DemoBadge>{phase.toUpperCase()}</DemoBadge>} />
      <DemoNotice>State changes in this room are local demo transitions. No score is validated and no winner is declared by a backend.</DemoNotice>
      {notice && <InlineNotice>{notice}</InlineNotice>}
      <section className="battle-room">
        <div className="battle-room-topline"><StatusBadge status={battle.status} /><span><Clock3 size={14} /> {battle.durationMinutes} minute format</span></div>
        <div className="battle-room-players">
          <div className="room-player"><CreatorAvatar creator={creatorOne} size="large" /><span className="eyebrow">CHALLENGER 01</span><h2>{creatorOne.name}</h2><strong>{battle.scoreOne}</strong></div>
          <div className="room-vs"><span>VS</span><div className="room-progress"><i style={{ width: battle.progress + '%' }} /></div><small>{battle.progress}% demo progress</small></div>
          <div className="room-player"><CreatorAvatar creator={creatorTwo} size="large" /><span className="eyebrow">CHALLENGER 02</span><h2>{creatorTwo.name}</h2><strong>{battle.scoreTwo}</strong></div>
        </div>
        <div className="room-challenge"><div><span className="eyebrow">THE BRIEF</span><p>{battle.challenge}</p></div><DemoBadge /></div>
        <ol className="phase-track">{phaseSequence.map((item, index) => <li className={item === phase ? 'phase-current' : index < currentIndex ? 'phase-done' : ''} key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ol>
        {phase === 'completed' && <section aria-live="polite" className="battle-victory"><Trophy aria-hidden="true" size={25} /><span className="eyebrow">DEMO RESULT · ILLUSTRATIVE SCORE</span><h2>{demoWinner ? demoWinner.name + ' takes this demo round.' : 'A shared draw.'}</h2><strong>{battle.scoreOne} <i>—</i> {battle.scoreTwo}</strong><p>No production result or reward was issued.</p></section>}
        <div className="room-controls">
          <button className="button button-primary" onClick={() => { setPhase(battle.id, nextPhase); setNotice('Demo state moved to ' + nextPhase + '.') }} type="button">{phase === 'completed' ? 'Restart demo lifecycle' : 'Advance demo state'} <ArrowRight size={16} /></button>
          <button className="button button-quiet" onClick={() => { setPhase(battle.id, 'cancelled'); setNotice('Demo battle marked cancelled locally.') }} type="button">Cancel demo battle</button>
        </div>
      </section>
      <div className="detail-grid">
        <Panel eyebrow="ROUND DETAILS" title="Competition rules"><p className="panel-copy">This sample uses a {battle.format.replaceAll('-', ' ')} format. Objective, manual opponent-verified, and audience-judged score methods must be defined by the competition before a real event.</p><div className="detail-meta-list"><span>Category<strong>{battle.category}</strong></span><span>Start<strong>{formatWhen(battle.startsAt)}</strong></span><span>Result method<strong>Demo preview</strong></span></div></Panel>
        <Panel eyebrow="COMMUNITY" title="The viewing deck"><p className="panel-copy">Community participation controls appear here when the competition format enables them. This preview does not connect to stream chat or accept live votes.</p><Link className="text-action" to="/community/activities">Explore demo activities <ArrowRight size={16} /></Link></Panel>
      </div>
    </div>
  )
}

export function CreatorChampionshipPage() {
  return (
    <div className="workspace-page">
      <PageHeading eyebrow="CREATOR WORKSPACE · CHAMPIONSHIP" title="A monthly stage for the community." description="A three-round popularity showcase, presented independently from skill competition results." action={<DemoBadge>DEMO EDITION</DemoBadge>} />
      <DemoNotice>Registration, rounds, rankings, and contributions below are illustrative. No event is open for real registration.</DemoNotice>
      <div className="championship-workspace-grid">
        <Panel className="championship-round-panel" eyebrow="ROUND 02 / 03" title="Community spotlight">
          <div className="round-progress"><span style={{ width: '63%' }} /></div>
          <div className="round-countdown"><span>ROUND ENDS IN</span><strong>11:24:08</strong><DemoBadge /></div>
          <p className="panel-copy">Creators voluntarily register for all three consecutive 24-hour rounds. Contributions represent popularity support, not a skill score.</p>
          <ol className="round-list">
            <li><span>01</span><div><strong>Opening call</strong><small>Community finds its people</small></div><span className="round-done">Complete</span></li>
            <li><span>02</span><div><strong>Community spotlight</strong><small>Support round</small></div><span className="round-current">In demo</span></li>
            <li><span>03</span><div><strong>Finale</strong><small>Monthly showcase</small></div><span>Upcoming</span></li>
          </ol>
        </Panel>
        <Panel eyebrow="POPULARITY SCORE" title="Monthly sample ranking"><Leaderboard /></Panel>
      </div>
      <section className="hall-of-fame">
        <span className="eyebrow"><Trophy size={15} /> HALL OF FAME · DEMO</span>
        <div><strong>Juno Park</strong><span>October sample champion</span></div>
        <p>Past rankings here are curated sample data and do not represent actual creators or awards.</p>
      </section>
    </div>
  )
}

export function CreatorBattleSummary() {
  return <DemoNotice>Battle scheduling and invitations are local demo actions.</DemoNotice>
}

export function CreatorProfileSummary() {
  return <StatBlock label="Creator audience" value={formatCompact(243700)} detail="Illustrative sample" />
}
