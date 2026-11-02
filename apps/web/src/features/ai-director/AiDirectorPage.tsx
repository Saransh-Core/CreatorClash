import { useMemo, useState } from 'react'
import { ArrowRight, Check, CircleHelp, Sparkles, ThumbsDown, Vote } from 'lucide-react'
import { DemoBadge } from '../../components/ui/DemoBadge'
import { DemoNotice } from '../../components/ui/DemoNotice'
import { InlineNotice } from '../../components/ui/InlineNotice'
import { PageHeading } from '../../components/ui/PageHeading'
import { Panel } from '../../components/ui/Panel'
import { challengeSuggestions, creatorCategories } from '../../services/demoData'
import { useDemoStore } from '../../stores/demoStore'

type Challenge = {
  title: string
  rules: string
  category: string
  difficulty: string
}

type DirectorStage = 'configure' | 'suggestions' | 'voting' | 'acceptance' | 'offered'

export function AiDirectorPage() {
  const [competitionType, setCompetitionType] = useState('Creator vs Creator')
  const [category, setCategory] = useState<string>(creatorCategories[0])
  const [duration, setDuration] = useState(30)
  const [difficulty, setDifficulty] = useState('Open to all')
  const [stage, setStage] = useState<DirectorStage>('configure')
  const [suggestions, setSuggestions] = useState<Challenge[]>([])
  const [selected, setSelected] = useState<Challenge | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editRules, setEditRules] = useState('')
  const [custom, setCustom] = useState('')
  const [notice, setNotice] = useState('')
  const [voteCounts, setVoteCounts] = useState([18, 13, 9, 5, 2])
  const [accepted, setAccepted] = useState([false, false])
  const [voteSession, setVoteSession] = useState(0)
  const castVote = useDemoStore((state) => state.castVote)
  const voteKey = 'challenge-director:' + category + ':' + voteSession
  const existingVote = useDemoStore((state) => state.votes[voteKey])
  const generated = useMemo(() => {
    return challengeSuggestions.filter((challenge) => challenge.category === category).slice(0, 5)
  }, [category])

  const generate = () => {
    setSuggestions(generated.map((challenge) => ({ ...challenge, difficulty })))
    setSelected(null)
    setAccepted([false, false])
    setVoteSession((session) => session + 1)
    setVoteCounts([18, 13, 9, 5, 2])
    setStage('suggestions')
    setNotice('Curated demo suggestions are ready. No AI service was called.')
  }
  const addCustom = () => {
    if (custom.trim().length < 8 || custom.trim().length > 240) {
      setNotice('Write a custom demo challenge between 8 and 240 characters.')
      return
    }
    const addition = { title: 'Creator-written challenge', rules: custom.trim(), category, difficulty }
    setSuggestions((current) => [addition, ...current].slice(0, 5))
    setVoteSession((session) => session + 1)
    setVoteCounts([18, 13, 9, 5, 2])
    setCustom('')
    setStage('suggestions')
    setNotice('Custom challenge added to this local demo session.')
  }
  const beginEdit = (index: number, challenge: Challenge) => {
    setEditingIndex(index)
    setEditTitle(challenge.title)
    setEditRules(challenge.rules)
  }
  const saveEdit = () => {
    if (editingIndex === null || editTitle.trim().length < 4 || editRules.trim().length < 8) {
      setNotice('Add a title of at least 4 characters and a brief of at least 8 characters.')
      return
    }
    setSuggestions((current) => current.map((challenge, index) => index === editingIndex
      ? { ...challenge, title: editTitle.trim(), rules: editRules.trim() }
      : challenge))
    setEditingIndex(null)
    setNotice('Your challenge edits were saved in this browser demo.')
  }
  const closeVote = () => {
    const ranked = [...suggestions].sort((first, second) => {
      const firstIndex = suggestions.indexOf(first)
      const secondIndex = suggestions.indexOf(second)
      return (voteCounts[secondIndex] ?? 0) - (voteCounts[firstIndex] ?? 0)
    })
    setSelected(ranked[0] ?? suggestions[0] ?? null)
    setStage('acceptance')
    setNotice('The highest sample vote was selected locally. Both creator acceptance states are still pending.')
  }
  const vote = (index: number, title: string) => {
    if (existingVote) return
    setVoteCounts((counts) => counts.map((count, position) => position === index ? count + 1 : count))
    castVote(voteKey, title)
    setNotice('Your demo vote was recorded in this browser.')
  }
  const handleAcceptance = (creatorIndex: 0 | 1, choice: 'accept' | 'decline') => {
    if (choice === 'decline') {
      const selectedIndex = Math.max(0, suggestions.findIndex((challenge) => challenge.title === selected?.title))
      const fallback = suggestions[(selectedIndex + 1) % Math.max(1, suggestions.length)]
      setSelected(fallback ?? null)
      setAccepted([false, false])
      setStage(fallback ? 'acceptance' : 'suggestions')
      setNotice(fallback ? 'One creator declined. The next ranked demo challenge is now offered.' : 'No fallback challenge is available in this demo set.')
      return
    }
    const next = [...accepted] as [boolean, boolean]
    next[creatorIndex] = true
    setAccepted(next)
    if (next.every(Boolean)) {
      setStage('offered')
      setNotice('Both demo creators accepted. The challenge is ready for the demo battle state machine.')
    } else {
      setNotice('One creator accepted locally. The other acceptance is still pending.')
    }
  }

  return (
    <div className="workspace-page">
      <PageHeading eyebrow="CHALLENGE DIRECTOR · DEMO" title="Make the next challenge a good one." description="Shape a brief, review curated suggestions, preview community voting, and walk through the offer lifecycle." action={<DemoBadge>AI DEMO</DemoBadge>} />
      <DemoNotice>This director uses curated local suggestions. It does not call an AI service or send prompts to a backend.</DemoNotice>
      {notice && <InlineNotice>{notice}</InlineNotice>}
      <div className="director-layout">
        <Panel className="director-config" eyebrow="01 / DEFINE THE MOMENT" title="Set the parameters">
          <label className="field-label">Competition type<select className="text-input" onChange={(event) => setCompetitionType(event.target.value)} value={competitionType}><option>Creator vs Creator</option><option>Creator vs Community</option><option>Community vs Community</option></select></label>
          <label className="field-label">Category<select className="text-input" onChange={(event) => setCategory(event.target.value)} value={category}>{creatorCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field-label">Difficulty<select className="text-input" onChange={(event) => setDifficulty(event.target.value)} value={difficulty}><option>Open to all</option><option>Relaxed</option><option>Balanced</option><option>High energy</option></select></label>
          <label className="field-label">Duration<select className="text-input" onChange={(event) => setDuration(Number(event.target.value))} value={duration}><option value={15}>15 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option></select></label>
          <p className="field-help">Review three to five curated examples for this category. No AI call is made.</p>
          <button className="button button-primary" onClick={generate} type="button"><Sparkles size={16} />Generate demo suggestions</button>
          <div className="custom-challenge"><span className="eyebrow">OR WRITE YOUR OWN</span><textarea className="text-input text-area" maxLength={240} onChange={(event) => setCustom(event.target.value)} placeholder="Describe a challenge in your own words" value={custom} /><button className="button button-secondary" onClick={addCustom} type="button">Add custom challenge</button></div>
        </Panel>
        <div className="director-workflow">
          <ol className="director-stage-track">
            {(['configure', 'suggestions', 'voting', 'acceptance', 'offered'] as const).map((item, index) => <li className={stage === item ? 'active' : ''} key={item}><span>0{index + 1}</span>{item === 'configure' ? 'Brief' : item === 'suggestions' ? 'Suggestions' : item === 'voting' ? 'Community vote' : item === 'acceptance' ? 'Creator approval' : 'Ready'}</li>)}
          </ol>
          {stage === 'configure' && <EmptyDirector />}
          {stage === 'suggestions' && (
            <Panel eyebrow="02 / REVIEW" title="Challenge suggestions">
              <div className="suggestion-list">{suggestions.map((challenge, index) => <article className="suggestion-item" key={challenge.title}><span className="suggestion-index">0{index + 1}</span><div><span className="eyebrow">{challenge.category} · {duration} MIN · {competitionType} · {challenge.difficulty}</span>{editingIndex === index ? <div className="challenge-edit-fields"><label className="field-label">Challenge title<input className="text-input" maxLength={70} onChange={(event) => setEditTitle(event.target.value)} value={editTitle} /></label><label className="field-label">Brief<textarea className="text-input text-area" maxLength={240} onChange={(event) => setEditRules(event.target.value)} value={editRules} /></label><button className="button button-secondary" onClick={saveEdit} type="button">Save edits</button><button className="text-action" onClick={() => setEditingIndex(null)} type="button">Cancel</button></div> : <><h3>{challenge.title}</h3><p>{challenge.rules}</p><button className="text-action" onClick={() => beginEdit(index, challenge)} type="button">Edit this suggestion</button></>}</div><DemoBadge /></article>)}</div>
              <button className="button button-primary" disabled={!suggestions.length} onClick={() => { setStage('voting'); setNotice('Community preview is open. Votes are local demo input.') }} type="button"><Vote size={16} />Open community voting preview</button>
            </Panel>
          )}
          {stage === 'voting' && (
            <Panel eyebrow="03 / COMMUNITY PREVIEW" title="Which challenge should lead?">
              <p className="panel-copy">Vote counts combine a small sample distribution with your local demo vote. They do not represent a live audience.</p>
              <div className="director-vote-list">{suggestions.map((challenge, index) => <div className="director-vote" key={challenge.title}><div><strong>{challenge.title}</strong><small>{challenge.rules}</small><span className="vote-bar"><i style={{ width: Math.min(100, ((voteCounts[index] ?? 0) / 50) * 100) + '%' }} /></span></div><span className="vote-total">{voteCounts[index] ?? 0}</span><button aria-label={'Vote for ' + challenge.title} className={existingVote === challenge.title ? 'icon-button selected' : 'icon-button'} disabled={Boolean(existingVote)} onClick={() => vote(index, challenge.title)} type="button"><Vote size={16} /></button></div>)}</div>
              <button className="button button-primary" onClick={closeVote} type="button">Close demo vote & rank <ArrowRight size={16} /></button>
            </Panel>
          )}
          {stage === 'acceptance' && selected && (
            <Panel eyebrow="04 / CREATOR ACCEPTANCE" title="Both creators must agree.">
              <div className="selected-challenge"><DemoBadge /> <h3>{selected.title}</h3><p>{selected.rules}</p></div>
              <div className="acceptance-rows">{['Mira Vale', 'Sol Chen'].map((creator, index) => <div className="acceptance-row" key={creator}><span className="acceptance-avatar">{creator.split(' ').map((part) => part[0]).join('')}</span><strong>{creator}</strong><span className={accepted[index] ? 'accepted-state' : 'pending-state'}>{accepted[index] ? 'Accepted in demo' : 'Awaiting response'}</span><button className="button button-secondary" onClick={() => handleAcceptance(index as 0 | 1, 'accept')} type="button"><Check size={14} />Accept</button><button aria-label={'Decline for ' + creator} className="icon-button" onClick={() => handleAcceptance(index as 0 | 1, 'decline')} type="button"><ThumbsDown size={15} /></button></div>)}</div>
              <p className="demo-caption">If a creator declines, the next ranked eligible demo challenge is offered.</p>
            </Panel>
          )}
          {stage === 'offered' && selected && (
            <Panel eyebrow="05 / READY FOR THE BATTLE" title="Challenge accepted.">
              <div className="selected-challenge selected-ready"><Check aria-hidden="true" size={20} /><div><h3>{selected.title}</h3><p>{selected.rules}</p></div><DemoBadge /></div>
              <p className="panel-copy">This accepted demo brief can be carried into the local battle lifecycle preview.</p>
              <button className="button button-primary" onClick={() => setNotice('Demo challenge state is ready; no external competition was created.')} type="button">Keep this demo brief</button>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyDirector() {
  return (
    <div className="director-empty">
      <span className="director-empty-icon"><CircleHelp size={21} /></span>
      <p className="eyebrow">THE CHALLENGE LIFECYCLE</p>
      <h2>From suggestion to shared brief.</h2>
      <p>Generate a curated demo set, preview a community vote, then require both creators to accept. A decline moves the offer to the next ranked suggestion.</p>
      <div className="director-empty-footer"><DemoBadge /> Curated local data · no AI call</div>
    </div>
  )
}
