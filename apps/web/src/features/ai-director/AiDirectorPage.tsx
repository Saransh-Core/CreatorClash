import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, CircleHelp, LoaderCircle, Sparkles, ThumbsDown, Vote } from 'lucide-react'
import { DemoNotice } from '../../components/ui/DemoNotice'
import { InlineNotice } from '../../components/ui/InlineNotice'
import { PageHeading } from '../../components/ui/PageHeading'
import { Panel } from '../../components/ui/Panel'
import { runtimeConfig } from '../../config/runtime'
import { useAuth } from '../auth/useAuth'
import { fetchBattles, type ApiBattle } from '../../services/competitionApi'
import {
  approveChallenge,
  fetchChallenges,
  fetchVoteTotals,
  finalizeChallengeVoting,
  generateChallenges,
  openChallengeVoting,
  saveGeneratedChallenges,
  selectChallengeOption,
  type PersistedChallenge,
  voteForChallenge,
} from '../../services/challengeApi'
import { creatorCategories } from '../../services/demoData'

const difficulties = ['Open to all', 'Relaxed', 'Balanced', 'High energy'] as const
const challengeTypes = ['Creative', 'Skill', 'Knowledge', 'Community'] as const
const durations = [15, 30, 45, 60] as const

function acceptedBattles(battles: ApiBattle[], userId: string | undefined) {
  return battles.filter((battle) => battle.battle_participants.some((participant) =>
    participant.user_id === userId && participant.participant_status === 'accepted'))
}

export function AiDirectorPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const accessToken = auth.session?.access_token
  const ready = Boolean(runtimeConfig.apiBaseUrl && auth.configured && accessToken)
  const battlesQuery = useQuery({
    queryKey: ['challenge-director-battles', auth.session?.user.id],
    queryFn: () => fetchBattles(accessToken!),
    enabled: ready,
  })
  const availableBattles = useMemo(() => acceptedBattles(battlesQuery.data ?? [], auth.session?.user.id), [battlesQuery.data, auth.session?.user.id])
  const [battleId, setBattleId] = useState('')
  const [category, setCategory] = useState<string>(creatorCategories[0] ?? 'Other')
  const [challengeType, setChallengeType] = useState<string>(challengeTypes[0])
  const [difficulty, setDifficulty] = useState<(typeof difficulties)[number]>('Balanced')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [brief, setBrief] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [generatedChallengeId, setGeneratedChallengeId] = useState('')
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [votingExpired, setVotingExpired] = useState(false)

  const activeBattleId = battleId || availableBattles[0]?.id || ''
  const selectedBattle = availableBattles.find((battle) => battle.id === activeBattleId)
  const durationOptions = selectedBattle
    ? durations.filter((duration) => duration <= selectedBattle.duration_minutes).length
      ? durations.filter((duration) => duration <= selectedBattle.duration_minutes)
      : [selectedBattle.duration_minutes]
    : [...durations]
  const effectiveDuration = durationOptions.includes(durationMinutes) ? durationMinutes : durationOptions.at(-1) ?? durationMinutes
  const challengesQuery = useQuery({
    queryKey: ['challenges', activeBattleId, auth.session?.user.id],
    queryFn: () => fetchChallenges(accessToken!, activeBattleId),
    enabled: ready && Boolean(activeBattleId),
    refetchInterval: (query) => query.state.data?.some((challenge) => challenge.status === 'voting') ? 5000 : false,
  })
  const challenge: PersistedChallenge | undefined = challengesQuery.data?.find((item) => item.id === generatedChallengeId)
    ?? challengesQuery.data?.[0]
  const activeVoting = challenge?.status === 'voting'
  const voteTotalsQuery = useQuery({
    queryKey: ['challenge-votes', challenge?.id],
    queryFn: () => fetchVoteTotals(accessToken!, challenge!.id),
    enabled: ready && Boolean(activeVoting && challenge?.id),
    refetchInterval: activeVoting ? 5000 : false,
  })
  const optionSelected = challenge?.challenge_options.find((option) => option.id === (challenge.selected_option_id ?? selectedOptionId))
  const currentVoteCount = voteTotalsQuery.data?.reduce((sum, option) => sum + option.vote_count, 0) ?? 0

  useEffect(() => {
    if (!challenge?.voting_ends_at) return
    const timer = window.setTimeout(() => setVotingExpired(true), Math.max(0, Date.parse(challenge.voting_ends_at) - Date.now()))
    return () => window.clearTimeout(timer)
  }, [challenge?.voting_ends_at])

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true)
    setNotice('')
    try {
      await action()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['challenges', activeBattleId] }),
        queryClient.invalidateQueries({ queryKey: ['community-open-challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['challenge-votes', challenge?.id] }),
      ])
      setNotice(successMessage)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The challenge request could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  const generate = async () => {
    if (!accessToken || !selectedBattle) return
    if (brief.trim().length < 8) {
      setNotice('Add a competition brief of at least 8 characters.')
      return
    }
    setBusy(true)
    setNotice('')
    setGeneratedChallengeId('')
    setSelectedOptionId('')
    setVotingExpired(false)
    try {
      const preferences = {
        battleId: selectedBattle.id,
        category,
        challengeType,
        difficulty,
        durationMinutes: effectiveDuration,
        format: selectedBattle.format as 'creator-vs-creator' | 'creator-vs-community' | 'community-vs-community',
        brief: brief.trim(),
        customInstructions: customInstructions.trim(),
      }
      const options = await generateChallenges(accessToken, preferences)
      const id = await saveGeneratedChallenges(accessToken, preferences, options)
      setGeneratedChallengeId(id)
      await queryClient.invalidateQueries({ queryKey: ['challenges', selectedBattle.id] })
      setNotice('AI generated and saved ' + options.length + ' structured challenge options. Choose one to continue.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Challenge generation failed. No demo suggestions were substituted.')
    } finally {
      setBusy(false)
    }
  }

  const canVote = Boolean(challenge && challenge.status === 'voting' && !voteTotalsQuery.isError)

  return (
    <div className="workspace-page">
      <PageHeading eyebrow="CHALLENGE DIRECTOR · AI POWERED" title="Make the next challenge a good one." description="Generate structured competition briefs, persist the options, and move the selected challenge through voting and creator approval." action={<span className="status-pill">{ready ? 'AUTHENTICATED API' : 'CONNECTION REQUIRED'}</span>} />
      {!ready && <DemoNotice>Live Challenge Studio requires a signed-in Supabase account and a configured Creator Clash API. This screen will not substitute demo challenges.</DemoNotice>}
      {ready && <DemoNotice>AI requests run on the API server. Generated options and workflow state are saved in Supabase; no challenge result is decided by the browser.</DemoNotice>}
      {notice && <InlineNotice>{notice}</InlineNotice>}
      {battlesQuery.isError && <InlineNotice>{battlesQuery.error.message}</InlineNotice>}
      {challengesQuery.isError && <InlineNotice>{challengesQuery.error.message}</InlineNotice>}

      <div className="director-layout">
        <Panel className="director-config" eyebrow="01 / DEFINE THE MOMENT" title="Set the parameters">
          <label className="field-label">Battle<select className="text-input" disabled={!ready || battlesQuery.isPending || !availableBattles.length} onChange={(event) => { const nextBattle = availableBattles.find((item) => item.id === event.target.value); setBattleId(event.target.value); if (nextBattle) setCategory(nextBattle.category); setGeneratedChallengeId(''); setVotingExpired(false) }} value={activeBattleId}>
            <option value="">{battlesQuery.isPending ? 'Loading battles…' : 'Choose an accepted battle'}</option>
            {availableBattles.map((battle) => <option key={battle.id} value={battle.id}>{battle.title} · {battle.category}</option>)}
          </select></label>
          {ready && !battlesQuery.isPending && !availableBattles.length && <p className="field-help">No accepted battle participation is available for this account yet.</p>}
          <label className="field-label">Category<select className="text-input" onChange={(event) => setCategory(event.target.value)} value={category}>{creatorCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field-label">Challenge type<select className="text-input" onChange={(event) => setChallengeType(event.target.value)} value={challengeType}>{challengeTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field-label">Difficulty<select className="text-input" onChange={(event) => setDifficulty(event.target.value as (typeof difficulties)[number])} value={difficulty}>{difficulties.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field-label">Duration<select className="text-input" onChange={(event) => setDurationMinutes(Number(event.target.value))} value={effectiveDuration}>{durationOptions.map((item) => <option key={item} value={item}>{item} minutes</option>)}</select></label>
          <label className="field-label">Competition brief<textarea className="text-input text-area" maxLength={800} onChange={(event) => setBrief(event.target.value)} placeholder="What should the creators make, solve, or perform?" value={brief} /></label>
          <label className="field-label">Optional creator instructions<textarea className="text-input text-area" maxLength={500} onChange={(event) => setCustomInstructions(event.target.value)} placeholder="Accessibility, materials, tone, or other constraints" value={customInstructions} /></label>
          <p className="field-help">Format is inherited from the selected battle: {selectedBattle?.format ?? 'choose a battle first'}.</p>
          <button className="button button-primary" disabled={!ready || !selectedBattle || busy || battlesQuery.isPending} onClick={() => void generate()} type="button">
            {busy ? <><LoaderCircle className="director-spinner" size={16} />Generating and saving…</> : <><Sparkles size={16} />Generate with AI</>}
          </button>
        </Panel>

        <div className="director-results">
          {!ready && <EmptyDirector title="Connect the live service" detail="Sign in with a configured account and API to generate real challenges. No local suggestion fallback is available." />}
          {ready && battlesQuery.isPending && <EmptyDirector title="Loading your battles" detail="Checking accepted battle participation before enabling challenge generation." loading />}
          {ready && !battlesQuery.isPending && !availableBattles.length && <EmptyDirector title="An accepted battle is required" detail="Challenge options are always saved against an authenticated battle and creator." />}
          {ready && selectedBattle && !challenge && !challengesQuery.isPending && <EmptyDirector title="Ready for a real challenge" detail="Choose the preferences and competition brief, then request structured suggestions from the server-side AI service." />}
          {challengesQuery.isPending && <EmptyDirector title="Loading saved challenges" detail="Reading persisted challenge options from the selected battle." loading />}
          {challenge && (
            <Panel eyebrow={'BATTLE · ' + challenge.status.toUpperCase()} title={challenge.status === 'voting' ? 'Community vote is open' : challenge.status === 'approval' ? 'Creator approval' : challenge.status === 'approved' ? 'Challenge approved' : challenge.status === 'rejected' ? 'Challenge declined' : 'Saved challenge options'}>
              <p className="panel-copy">{challenge.prompt}</p>
              {challenge.status === 'draft' && <p className="panel-copy">Select one option for approval, or open the optional community vote. The server records either transition.</p>}
              <div className="suggestion-list">
                {challenge.challenge_options.map((option) => {
                  const votes = voteTotalsQuery.data?.find((entry) => entry.option_id === option.id)?.vote_count ?? 0
                  const isSelected = (challenge.selected_option_id ?? selectedOptionId) === option.id
                  const approval = challenge.challenge_approvals.find((item) => item.creator_id === auth.session?.user.id)
                  return (
                    <article className={isSelected ? 'suggestion-item selected-option' : 'suggestion-item'} key={option.id}>
                      <span className="suggestion-index">{String(option.position).padStart(2, '0')}</span>
                      <div className="suggestion-copy">
                        <span className="eyebrow">{option.difficulty} · {option.estimated_duration_minutes} MIN</span>
                        <h3>{option.title}</h3>
                        <p>{option.description}</p>
                        <details className="challenge-details"><summary>Rules, score and victory conditions</summary><dl><dt>Rules</dt><dd>{option.rules}</dd><dt>Scoring</dt><dd>{option.scoring_method}</dd><dt>Preparation</dt><dd>{option.equipment_preparation}</dd><dt>Victory</dt><dd>{option.victory_conditions}</dd></dl></details>
                        {challenge.status === 'voting' && <p className="field-help">{votes} {votes === 1 ? 'vote' : 'votes'}</p>}
                        {challenge.status === 'approval' && isSelected && <p className="field-help">{approval ? (approval.approved ? 'Your approval is recorded.' : 'Your rejection is recorded.') : 'Awaiting your approval decision.'}</p>}
                      </div>
                      {challenge.status === 'draft' && challenge.created_by === auth.session?.user.id && <button className={isSelected ? 'button button-primary' : 'button button-secondary'} disabled={busy} onClick={() => setSelectedOptionId(option.id)} type="button">{isSelected ? <><Check size={14} />Selected</> : 'Select option'}</button>}
                      {challenge.status === 'draft' && challenge.created_by !== auth.session?.user.id && <span className="status-pill">Awaiting challenge owner</span>}
                      {challenge.status === 'voting' && <button aria-label={'Vote for ' + option.title} className="icon-button" disabled={!canVote || busy || voteTotalsQuery.isPending || voteTotalsQuery.data?.some((entry) => entry.viewer_option_id !== null)} onClick={() => void runAction(() => voteForChallenge(accessToken!, challenge.id, option.id), 'Your vote has been recorded by the server.')} type="button"><Vote size={16} /></button>}
                      {challenge.status === 'approval' && isSelected && <span className="status-pill">{challenge.challenge_approvals.length} / 2 decisions</span>}
                    </article>
                  )
                })}
              </div>
              {challenge.status === 'draft' && challenge.created_by === auth.session?.user.id && <div className="challenge-actions">
                <button className="button button-primary" disabled={!selectedOptionId || busy} onClick={() => void runAction(() => selectChallengeOption(accessToken!, challenge.id, selectedOptionId), 'Selected option sent to the creator approval stage.')} type="button"><Check size={15} />Select for approval</button>
                <button className="button button-secondary" disabled={busy} onClick={() => void runAction(() => openChallengeVoting(accessToken!, challenge.id), 'Community voting is open for ten minutes.')} type="button"><Vote size={15} />Open optional community vote</button>
              </div>}
              {challenge.status === 'draft' && challenge.created_by !== auth.session?.user.id && <p className="panel-copy">The challenge creator must select an option or open a community vote.</p>}
              {challenge.status === 'voting' && <div className="challenge-actions">
                <span className="field-help">{currentVoteCount} server-recorded votes · ends {challenge.voting_ends_at ? new Date(challenge.voting_ends_at).toLocaleTimeString() : 'soon'}</span>
                {votingExpired && <button className="button button-primary" disabled={busy} onClick={() => void runAction(() => finalizeChallengeVoting(accessToken!, challenge.id), 'The server finalized the poll and selected the highest-ranked option.')} type="button">Finalize vote on server <ArrowRight size={15} /></button>}
                {voteTotalsQuery.isError && <InlineNotice>{voteTotalsQuery.error.message}</InlineNotice>}
              </div>}
              {challenge.status === 'approval' && optionSelected && <div className="challenge-actions">
                <button className="button button-primary" disabled={busy || challenge.challenge_approvals.some((item) => item.creator_id === auth.session?.user.id)} onClick={() => void runAction(() => approveChallenge(accessToken!, challenge.id, true), 'Your approval decision was saved.')} type="button"><Check size={15} />Approve challenge</button>
                <button className="button button-secondary" disabled={busy || challenge.challenge_approvals.some((item) => item.creator_id === auth.session?.user.id)} onClick={() => void runAction(() => approveChallenge(accessToken!, challenge.id, false), 'Your rejection decision was saved.')} type="button"><ThumbsDown size={15} />Reject challenge</button>
              </div>}
              {challenge.status === 'approved' && optionSelected && <div className="selected-challenge selected-ready"><Check size={19} /><div><span className="eyebrow">SERVER-APPROVED CHALLENGE</span><h3>{optionSelected.title}</h3><p>{optionSelected.description}</p></div></div>}
              {challenge.status === 'rejected' && <InlineNotice>The creator approvals rejected this challenge. Generate a new option set to continue.</InlineNotice>}
            </Panel>
          )}
          {challenge && challenge.status !== 'voting' && <button className="button button-secondary" disabled={busy || !ready || !selectedBattle} onClick={() => void generate()} type="button"><Sparkles size={15} />Generate another set</button>}
        </div>
      </div>
    </div>
  )
}

function EmptyDirector({ title, detail, loading = false }: { title: string; detail: string; loading?: boolean }) {
  return <div aria-live="polite" className="director-empty">
    <span className="director-empty-icon">{loading ? <LoaderCircle className="director-spinner" size={21} /> : <CircleHelp size={21} />}</span>
    <p className="eyebrow">CHALLENGE STUDIO</p>
    <h2>{title}</h2>
    <p>{detail}</p>
    <div className="director-empty-footer"><Sparkles size={14} /> Server-validated · battle-associated</div>
  </div>
}
