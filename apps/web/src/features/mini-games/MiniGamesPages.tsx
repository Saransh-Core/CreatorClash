import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Brain, CirclePlay, Clock3, Flame, Gamepad2, Lightbulb, RotateCcw, Users, Zap } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DemoBadge } from '../../components/ui/DemoBadge'
import { DemoNotice } from '../../components/ui/DemoNotice'
import { PageHeading } from '../../components/ui/PageHeading'
import { useDemoStore } from '../../stores/demoStore'

const games = [
  { id: 'quick-quiz', name: 'Quick Quiz', description: 'A fast round of surprising questions.', icon: Brain, state: 'Playable demo' },
  { id: 'reaction-rush', name: 'Reaction Rush', description: 'Wait for the signal, then trust your reflexes.', icon: Zap, state: 'Playable demo' },
  { id: 'guess-the-majority', name: 'Guess the Majority', description: 'Predict what the room will choose.', icon: Users, state: 'Playable demo' },
  { id: 'word-clash', name: 'Word Clash', description: 'Find the sharpest word under a shared constraint.', icon: Lightbulb, state: 'Preview' },
  { id: 'bluff-battle', name: 'Bluff Battle', description: 'Tell a convincing story and spot the twist.', icon: CirclePlay, state: 'Preview' },
  { id: 'hot-take-showdown', name: 'Hot Take Showdown', description: 'Defend a playful opinion to the room.', icon: Flame, state: 'Preview' },
  { id: 'impossible-quiz', name: 'Impossible Quiz', description: 'A trickier quiz with surprising rules.', icon: Brain, state: 'Preview' },
  { id: 'caption-clash', name: 'Caption Clash', description: 'Create a line that gives an image a new life.', icon: Lightbulb, state: 'Preview' },
  { id: 'memory-clash', name: 'Memory Clash', description: 'Notice the detail before the moment moves on.', icon: Gamepad2, state: 'Preview' },
]

export function MiniGamesHubPage() {
  return (
    <div className="workspace-page">
      <PageHeading eyebrow="CREATOR WORKSPACE · MINI-GAMES" title="Small games. Big room energy." description="Explore demo-ready games for creator and community participation." action={<DemoBadge>LOCAL DEMO</DemoBadge>} />
      <DemoNotice>Playable games run entirely in this browser. Scores are demo-only and are not validated for a real competition.</DemoNotice>
      <section className="minigame-feature">
        <div><span className="eyebrow">PLAYABLE SET · 01–03</span><h2>Made for the moment between moments.</h2><p>Run a quick knowledge round, test reaction time, or see how well you understand the room.</p></div>
        <span className="minigame-feature-emblem" aria-hidden="true"><Gamepad2 size={39} /></span>
      </section>
      <div className="game-list">
        {games.map((game, index) => {
          const Icon = game.icon
          const playable = game.state === 'Playable demo'
          return <Link className={playable ? 'game-row' : 'game-row unavailable'} key={game.id} to={'/creator/mini-games/' + game.id}><span className="game-index">0{index + 1}</span><span className="game-icon"><Icon size={19} /></span><span className="game-copy"><strong>{game.name}</strong><small>{game.description}</small></span><DemoBadge>{playable ? 'PLAYABLE DEMO' : 'PREVIEW'}</DemoBadge><span className="game-state">{playable ? 'Open game' : 'Preview availability'}</span><ArrowRight size={16} /></Link>
        })}
      </div>
    </div>
  )
}

type QuizQuestion = {
  prompt: string
  options: string[]
  answer: number
}

const quizQuestions: QuizQuestion[] = [
  { prompt: 'Which planet has the shortest day?', options: ['Mars', 'Jupiter', 'Mercury', 'Venus'], answer: 1 },
  { prompt: 'What is the only mammal capable of true flight?', options: ['Flying squirrel', 'Bat', 'Sugar glider', 'Colugo'], answer: 1 },
  { prompt: 'Which instrument usually has 47 strings?', options: ['Harp', 'Sitar', 'Koto', 'Zither'], answer: 0 },
  { prompt: 'What colour is an octopus’s blood?', options: ['Red', 'Blue', 'Green', 'Clear'], answer: 1 },
]

const majorityPrompts = [
  { question: 'Pick a perfect late-night snack.', choices: ['Something sweet', 'Something crunchy', 'Leftovers, proudly', 'A cup of tea'] },
  { question: 'Choose a superpower for one ordinary day.', choices: ['Pause time', 'Speak every language', 'Instant tidy-up', 'Know every song'] },
  { question: 'What does the room choose for a team name?', choices: ['Moonlight Club', 'The Side Quests', 'Good Signal', 'Chat Decides'] },
]

export function MiniGamePage({ workspace = 'creator' }: { workspace?: 'creator' | 'community' }) {
  const { gameId = '' } = useParams()
  const backPath = workspace === 'community' ? '/community/activities' : '/creator/mini-games'
  const game = games.find((item) => item.id === gameId)
  if (gameId === 'quick-quiz') return <QuickQuizPage backPath={backPath} />
  if (gameId === 'reaction-rush') return <ReactionRushPage backPath={backPath} />
  if (gameId === 'guess-the-majority') return <GuessMajorityPage backPath={backPath} />

  return (
    <div className="workspace-page">
      <Link className="back-link" to={backPath}><ArrowLeft size={15} />All mini-games</Link>
      <PageHeading eyebrow="MINI-GAME PREVIEW" title={game?.name ?? 'Mini-game not found'} description={game?.description ?? 'Choose one of the games listed in the demo hub.'} action={<DemoBadge>PREVIEW ONLY</DemoBadge>} />
      <DemoNotice>This concept has a preview page, but playable interaction is not included in this frontend demo.</DemoNotice>
      <div className="preview-game-panel"><span className="preview-game-icon"><CirclePlay size={25} /></span><p className="eyebrow">GAME CONCEPT · NOT PLAYABLE</p><h2>Built for co-op chaos and friendly rivalry.</h2><p>When the game is designed, its instructions, input method, timer, scoring, result, and replay flow will be defined as one coherent experience.</p><Link className="button button-secondary" to="/creator/mini-games">Back to playable games <ArrowRight size={16} /></Link></div>
    </div>
  )
}

function GameFrame({ title, subtitle, children, backPath }: { title: string; subtitle: string; children: ReactNode; backPath: string }) {
  return (
    <div className="workspace-page">
      <Link className="back-link" to={backPath}><ArrowLeft size={15} />Back to activities</Link>
      <PageHeading eyebrow="PLAYABLE MINI-GAME · DEMO" title={title} description={subtitle} action={<DemoBadge>LOCAL SCORE</DemoBadge>} />
      <DemoNotice>Gameplay and scores run locally in this browser. Results do not affect a competition record or real rewards.</DemoNotice>
      <section className="game-stage">{children}</section>
    </div>
  )
}

function QuickQuizPage({ backPath }: { backPath: string }) {
  const [active, setActive] = useState(false)
  const [finished, setFinished] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [selected, setSelected] = useState<number | null>(null)
  const [completionOutcome, setCompletionOutcome] = useState<'recorded' | 'previously-recorded' | 'none'>('none')
  const complete = useDemoStore((state) => state.completeDemoActivity)

  useEffect(() => {
    if (!active || finished || timeLeft <= 0) return
    const timer = window.setTimeout(() => {
      if (timeLeft <= 1) {
        setTimeLeft(0)
        setFinished(true)
      } else {
        setTimeLeft((time) => time - 1)
      }
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [active, finished, timeLeft])

  const start = () => {
    setCompletionOutcome(alreadyCompleted ? 'previously-recorded' : 'none')
    setActive(true)
    setFinished(false)
    setQuestionIndex(0)
    setScore(0)
    setTimeLeft(30)
    setSelected(null)
  }
  const answer = (index: number) => {
    if (!active || finished || selected !== null) return
    setSelected(index)
    const nextScore = score + (index === quizQuestions[questionIndex]?.answer ? 1 : 0)
    setScore(nextScore)
    window.setTimeout(() => {
      if (questionIndex + 1 >= quizQuestions.length) {
        setFinished(true)
        setCompletionOutcome(complete('game-quick-quiz') ? 'recorded' : 'previously-recorded')
      } else {
        setQuestionIndex((current) => current + 1)
        setSelected(null)
      }
    }, 650)
  }
  const question = quizQuestions[questionIndex]
  const alreadyCompleted = useDemoStore((state) => state.completedActivities.includes('game-quick-quiz'))

  return (
    <GameFrame backPath={backPath} title="Quick Quiz" subtitle="Four questions, thirty seconds, one local score.">
      {!active && !finished ? <GameIntro icon={<Brain size={25} />} title="Ready when you are." detail="Choose an answer to move on. Your score appears when the local demo round ends." action={<button className="button button-primary" onClick={start} type="button">Start quiz <ArrowRight size={16} /></button>} /> : null}
      {active && question && (
        <div className="quiz-round">
          <div className="game-hud"><span><Clock3 size={15} /> 00:{String(timeLeft).padStart(2, '0')}</span><span>QUESTION 0{questionIndex + 1} / 0{quizQuestions.length}</span><span>SCORE <strong>{score}</strong></span></div>
          <div className="quiz-prompt"><p className="eyebrow">QUICK QUIZ · DEMO ROUND</p><h2>{question.prompt}</h2></div>
          <div className="quiz-options">{question.options.map((option, index) => <button className={selected === index ? index === question.answer ? 'quiz-option correct' : 'quiz-option incorrect' : 'quiz-option'} disabled={selected !== null} key={option} onClick={() => answer(index)} type="button"><span>0{index + 1}</span>{option}<ArrowRight size={15} /></button>)}</div>
        </div>
      )}
      {finished && <GameResult title="Round complete." score={score + ' / ' + quizQuestions.length} detail={timeLeft <= 0 ? 'The demo timer ran out.' : 'A quick mind and a little good fortune.'} reward={completionOutcome === 'recorded' ? 'Participation recorded in this browser demo. No tokens were moved.' : completionOutcome === 'previously-recorded' ? 'This activity was already recorded in the demo.' : 'No participation reward is connected in this demo.'} replay={start} />}
    </GameFrame>
  )
}

function ReactionRushPage({ backPath }: { backPath: string }) {
  const [phase, setPhase] = useState<'intro' | 'wait' | 'go' | 'false-start' | 'result'>('intro')
  const [reaction, setReaction] = useState<number | null>(null)
  const [rewardWasRecorded, setRewardWasRecorded] = useState(false)
  const timeout = useRef<number | null>(null)
  const startedAt = useRef(0)
  const complete = useDemoStore((state) => state.completeDemoActivity)
  const alreadyCompleted = useDemoStore((state) => state.completedActivities.includes('game-reaction-rush'))

  useEffect(() => () => {
    if (timeout.current !== null) window.clearTimeout(timeout.current)
  }, [])

  const start = () => {
    if (timeout.current !== null) window.clearTimeout(timeout.current)
    setReaction(null)
    setPhase('wait')
    timeout.current = window.setTimeout(() => {
      startedAt.current = performance.now()
      setPhase('go')
    }, 1400 + Math.random() * 1800)
  }
  const click = () => {
    if (phase === 'intro' || phase === 'false-start' || phase === 'result') return
    if (phase === 'wait') {
      if (timeout.current !== null) window.clearTimeout(timeout.current)
      setPhase('false-start')
      return
    }
    const milliseconds = Math.round(performance.now() - startedAt.current)
    setReaction(milliseconds)
    setRewardWasRecorded(alreadyCompleted)
    setPhase('result')
    complete('game-reaction-rush')
  }

  return (
    <GameFrame backPath={backPath} title="Reaction Rush" subtitle="Wait for the violet signal. Tap too soon and the round resets.">
      {phase === 'intro' && <GameIntro icon={<Zap size={25} />} title="Ready, but don’t rush." detail="A signal will appear after a short, unpredictable pause. Touch-friendly and keyboard accessible." action={<button className="button button-primary" onClick={start} type="button">Begin warm-up <ArrowRight size={16} /></button>} />}
      {(phase === 'wait' || phase === 'go' || phase === 'false-start') && <button aria-label={phase === 'go' ? 'Signal! Click now' : 'Wait for the signal'} className={'reaction-target reaction-' + phase} onClick={click} type="button">{phase === 'wait' ? 'WAIT FOR IT' : phase === 'go' ? 'NOW' : 'EARLY · TRY AGAIN'}</button>}
      {phase === 'false-start' && <button className="button button-secondary retry-reaction" onClick={start} type="button">Try another round <RotateCcw size={15} /></button>}
      {phase === 'result' && <GameResult title="Nice reflex." score={reaction + ' ms'} detail="Personal bests are local to this demo session." reward={rewardWasRecorded ? 'Activity already recorded in this browser demo. No tokens were moved.' : 'Participation recorded locally. No wallet transaction is connected.'} replay={start} />}
    </GameFrame>
  )
}

function GuessMajorityPage({ backPath }: { backPath: string }) {
  const [round, setRound] = useState(0)
  const [choice, setChoice] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [rewardWasRecorded, setRewardWasRecorded] = useState(false)
  const complete = useDemoStore((state) => state.completeDemoActivity)
  const alreadyCompleted = useDemoStore((state) => state.completedActivities.includes('game-guess-majority'))
  const prompt = majorityPrompts[round]

  const choose = (answer: string) => {
    if (choice) return
    setChoice(answer)
    const majority = prompt?.choices[1] ?? answer
    if (answer === majority) setScore((current) => current + 1)
  }
  const nextRound = () => {
    if (round + 1 < majorityPrompts.length) {
      setRound((current) => current + 1)
      setChoice(null)
    } else {
      setRewardWasRecorded(alreadyCompleted)
      complete('game-guess-majority')
      setFinished(true)
    }
  }
  const reset = () => {
    setRound(0)
    setChoice(null)
    setScore(0)
    setFinished(false)
    setRewardWasRecorded(false)
  }

  return (
    <GameFrame backPath={backPath} title="Guess the Majority" subtitle="Predict the answer most people in this sample room would choose.">
      {!finished && prompt && (
        <div className="majority-round">
          <div className="game-hud"><span>ROUND 0{round + 1} / 0{majorityPrompts.length}</span><span>LOCAL SCORE <strong>{score}</strong></span><DemoBadge /></div>
          <div className="quiz-prompt"><p className="eyebrow">READ THE ROOM · DEMO</p><h2>{prompt.question}</h2></div>
          <div className="majority-options">{prompt.choices.map((item, index) => <button aria-pressed={choice === item} className={choice === item ? 'majority-option chosen' : 'majority-option'} disabled={Boolean(choice)} key={item} onClick={() => choose(item)} type="button"><span>0{index + 1}</span>{item}{choice && <small>{[21, 34, 27, 18][index]}% sample room</small>}</button>)}</div>
          {choice && <div className="majority-feedback"><span>Your pick: <strong>{choice}</strong></span><span>Sample majority: <strong>{prompt.choices[1]}</strong></span><button className="button button-primary" onClick={nextRound} type="button">{round + 1 === majorityPrompts.length ? 'See demo result' : 'Next round'} <ArrowRight size={15} /></button></div>}
        </div>
      )}
      {finished && <GameResult title="You read the room." score={score + ' / ' + majorityPrompts.length} detail="Sample audience answers are curated for this demo." reward={rewardWasRecorded ? 'Activity already recorded in this browser demo. No tokens were moved.' : 'Participation recorded locally. No wallet transaction is connected.'} replay={reset} />}
    </GameFrame>
  )
}

function GameIntro({ icon, title, detail, action }: { icon: ReactNode; title: string; detail: string; action: ReactNode }) {
  return <div className="game-intro"><span className="game-intro-icon">{icon}</span><p className="eyebrow">DEMO GAME</p><h2>{title}</h2><p>{detail}</p>{action}<span className="game-intro-footnote"><DemoBadge /> Scores are local; no wallet transaction is connected.</span></div>
}

function GameResult({ title, score, detail, reward, replay }: { title: string; score: string; detail: string; reward: string; replay: () => void }) {
  return <div className="game-result"><span className="result-emblem"><Gamepad2 size={27} /></span><p className="eyebrow">DEMO ROUND COMPLETE</p><h2>{title}</h2><strong className="game-result-score">{score}</strong><p>{detail}</p><span className="game-result-reward">{reward}</span><button className="button button-primary" onClick={replay} type="button">Play again <RotateCcw size={15} /></button></div>
}
