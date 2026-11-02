import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { CreatorClashMark } from '../../components/brand/CreatorClashMark'
import { DemoBadge } from '../../components/ui/DemoBadge'
import { useDemoStore } from '../../stores/demoStore'
import { useAuth } from './useAuth'
import { creatorCategories } from '../../services/demoData'

const demoAccountSchema = z.object({
  displayName: z.string().trim().min(2, 'Use at least 2 characters.').max(32),
  mode: z.enum(['creator', 'community']),
})

const accountBaseSchema = z.object({
  displayName: z.string().trim().max(48).optional(),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  mode: z.enum(['creator', 'community']),
  creatorHandle: z.string().optional(),
  creatorCategory: z.string().optional(),
})

const accountSchema = accountBaseSchema.superRefine((values, context) => {
  if (!values.displayName || values.displayName.length < 2) context.addIssue({ code: 'custom', path: ['displayName'], message: 'Use at least 2 characters.' })
  if (values.mode !== 'creator') return
  if (!values.creatorHandle || !/^[a-zA-Z0-9_]{3,25}$/.test(values.creatorHandle)) context.addIssue({ code: 'custom', path: ['creatorHandle'], message: 'Use 3–25 letters, numbers, or underscores.' })
  if (!values.creatorCategory || !creatorCategories.includes(values.creatorCategory as (typeof creatorCategories)[number])) context.addIssue({ code: 'custom', path: ['creatorCategory'], message: 'Choose a creator category.' })
})

type DemoAccountInput = z.infer<typeof demoAccountSchema>
type AccountInput = z.infer<typeof accountSchema>

export function LoginPage({ createAccount = false }: { createAccount?: boolean }) {
  const auth = useAuth()
  return auth.configured
    ? <SupabaseAccountPage createAccount={createAccount} />
    : <DemoAccountPage createAccount={createAccount} />
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <div aria-hidden="true" className="auth-visual">
        <div className="auth-visual-orbit" />
        <CreatorClashMark />
        <p className="auth-quote">Every great competition<br />starts with a community.</p>
        <span className="auth-visual-caption">CREATOR CLASH · CREATIVE ARENA</span>
      </div>
      <section aria-labelledby="auth-title" className="auth-panel">{children}</section>
    </main>
  )
}

function DemoAccountPage({ createAccount }: { createAccount: boolean }) {
  const createDemoSession = useDemoStore((state) => state.createDemoSession)
  const location = useLocation()
  const navigate = useNavigate()
  const requestedMode = new URLSearchParams(location.search).get('mode')
  const requestedDestination = (location.state as { from?: string } | null)?.from ?? new URLSearchParams(location.search).get('next')
  const initialMode = requestedMode === 'creator' || requestedDestination?.startsWith('/creator') ? 'creator' : 'community'
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DemoAccountInput>({
    resolver: zodResolver(demoAccountSchema),
    defaultValues: { displayName: 'Arena Guest', mode: initialMode },
  })

  const onSubmit = handleSubmit(async ({ displayName, mode }) => {
    createDemoSession(displayName, mode)
    navigate(requestedDestination || (mode === 'creator' ? '/creator' : '/community'), { replace: true })
  })

  return (
    <AuthShell>
      <Link aria-label="Back to Creator Clash" className="auth-back" to="/"><ArrowLeft aria-hidden="true" size={16} />Back to Creator Clash</Link>
      <div className="auth-form-wrap">
        <DemoBadge>DEMO ACCOUNT</DemoBadge>
        <h1 id="auth-title">{createAccount ? 'Join the arena.' : 'Welcome back.'}</h1>
        <p className="auth-subtitle">{createAccount ? 'Create a local demo profile to explore both workspace modes.' : 'Continue with a clearly labelled local demo profile.'}</p>
        <form className="form-stack" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="displayName">Display name
            <input autoComplete="name" className="text-input" id="displayName" placeholder="Arena Guest" {...register('displayName')} />
            {errors.displayName && <span className="field-error">{errors.displayName.message}</span>}
          </label>
          <label className="field-label" htmlFor="mode">Start in
            <select className="text-input" id="mode" {...register('mode')}><option value="community">Community workspace</option><option value="creator">Creator workspace</option></select>
          </label>
          <button className="button button-primary auth-submit" disabled={isSubmitting} type="submit">Enter demo workspace <ArrowRight aria-hidden="true" size={16} /></button>
        </form>
        <p className="auth-safety-note"><ShieldCheck aria-hidden="true" size={15} />Demo only. No email, Twitch, or production authentication is connected.</p>
        <div className="auth-switch">{createAccount ? 'Already exploring?' : 'New to the demo?'} <Link to={createAccount ? '/login' : '/signup'}>{createAccount ? 'Sign in' : 'Create a demo profile'}</Link></div>
        <Link className="auth-quiet-link" to="/forgot-password">Forgot your password?</Link>
      </div>
    </AuthShell>
  )
}

function SupabaseAccountPage({ createAccount }: { createAccount: boolean }) {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const requestedDestination = (location.state as { from?: string } | null)?.from ?? new URLSearchParams(location.search).get('next')
  const requestedMode = new URLSearchParams(location.search).get('mode')
  const initialMode = requestedMode === 'creator' || requestedDestination?.startsWith('/creator') ? 'creator' : 'community'
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<AccountInput>({
    resolver: zodResolver(createAccount ? accountSchema : accountBaseSchema),
    defaultValues: { displayName: '', email: '', password: '', mode: initialMode },
  })

  const submit = handleSubmit(async (values) => {
    setMessage('')
    setErrorMessage('')
    try {
      if (createAccount) {
        const hasSession = await auth.signUp(values.email, values.password, values.displayName!,
          values.mode === 'creator' ? { handle: values.creatorHandle!, category: values.creatorCategory! } : undefined)
        if (!hasSession) {
          setMessage('Check your email to confirm your account, then sign in. Your Creator and Community modes use this same account.')
          return
        }
      } else {
        await auth.signIn(values.email, values.password)
      }
      navigate(requestedDestination || (values.mode === 'creator' ? '/creator' : '/community'), { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The account request could not be completed.')
    }
  })

  return (
    <AuthShell>
      <Link aria-label="Back to Creator Clash" className="auth-back" to="/"><ArrowLeft aria-hidden="true" size={16} />Back to Creator Clash</Link>
      <div className="auth-form-wrap">
        <span className="eyebrow">SECURE ACCOUNT · ONE IDENTITY</span>
        <h1 id="auth-title">{createAccount ? 'Join the arena.' : 'Welcome back.'}</h1>
        <p className="auth-subtitle">{createAccount ? 'Use one account for both Creator and Community workspaces.' : 'Sign in to continue to your Creator Clash workspace.'}</p>
        <form className="form-stack" onSubmit={submit}>
          {createAccount && <label className="field-label" htmlFor="displayName">Display name<input autoComplete="name" className="text-input" id="displayName" {...register('displayName')} />{errors.displayName && <span className="field-error">{errors.displayName.message}</span>}</label>}
          <label className="field-label" htmlFor="email">Email<input autoComplete="email" className="text-input" id="email" type="email" {...register('email')} />{errors.email && <span className="field-error">{errors.email.message}</span>}</label>
          <label className="field-label" htmlFor="password">Password<input autoComplete={createAccount ? 'new-password' : 'current-password'} className="text-input" id="password" type="password" {...register('password')} />{errors.password && <span className="field-error">{errors.password.message}</span>}</label>
          <label className="field-label" htmlFor="mode">Open workspace<select className="text-input" id="mode" {...register('mode')}><option value="community">Community workspace</option><option value="creator">Creator workspace</option></select></label>
          {createAccount && watch('mode') === 'creator' && <>
            <label className="field-label" htmlFor="creatorHandle">Creator handle<input autoComplete="username" className="text-input" id="creatorHandle" maxLength={25} {...register('creatorHandle')} />{errors.creatorHandle && <span className="field-error">{errors.creatorHandle.message}</span>}</label>
            <label className="field-label" htmlFor="creatorCategory">Creator category<select className="text-input" id="creatorCategory" {...register('creatorCategory')}><option value="">Choose a category</option>{creatorCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select>{errors.creatorCategory && <span className="field-error">{errors.creatorCategory.message}</span>}</label>
          </>}
          {message && <p aria-live="polite" className="inline-notice">{message}</p>}
          {errorMessage && <p aria-live="assertive" className="field-error">{errorMessage}</p>}
          <button className="button button-primary auth-submit" disabled={isSubmitting} type="submit">{createAccount ? 'Create account' : 'Sign in'} <ArrowRight aria-hidden="true" size={16} /></button>
        </form>
        <p className="auth-safety-note"><ShieldCheck aria-hidden="true" size={15} />Authentication and session persistence are handled by Supabase Auth.</p>
        <div className="auth-switch">{createAccount ? 'Already have an account?' : 'New to Creator Clash?'} <Link to={createAccount ? '/login' : '/signup'}>{createAccount ? 'Sign in' : 'Create an account'}</Link></div>
        <Link className="auth-quiet-link" to="/forgot-password">Forgot your password?</Link>
      </div>
    </AuthShell>
  )
}

export function ForgotPasswordPage() {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [busy, setBusy] = useState(false)

  if (!auth.configured) {
    return <main className="auth-page"><div aria-hidden="true" className="auth-visual"><div className="auth-visual-orbit" /><CreatorClashMark /><p className="auth-quote">Your account stays yours.</p><span className="auth-visual-caption">CREATOR CLASH · DEMO ENVIRONMENT</span></div><section aria-labelledby="auth-title" className="auth-panel"><Link aria-label="Back to login" className="auth-back" to="/login"><ArrowLeft aria-hidden="true" size={16} />Back to login</Link><div className="auth-form-wrap"><DemoBadge>DEMO MODE</DemoBadge><h1 id="auth-title">Password recovery isn’t connected.</h1><p className="auth-subtitle">This frontend preview has no account or email service. Use the demo profile flow to explore the workspaces.</p><Link className="button button-primary auth-submit" to="/login">Continue to demo sign in <ArrowRight aria-hidden="true" size={16} /></Link></div></section></main>
  }

  const submitRecovery = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setErrorMessage('')
    try {
      if (auth.session) {
        await auth.updatePassword(password)
        setMessage('Your password was updated.')
      } else {
        await auth.sendPasswordRecovery(email)
        setMessage('If that email belongs to an account, a password reset link is on its way.')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Password recovery could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="auth-page"><div aria-hidden="true" className="auth-visual"><div className="auth-visual-orbit" /><CreatorClashMark /><p className="auth-quote">Your account stays yours.</p><span className="auth-visual-caption">CREATOR CLASH · SECURE ACCOUNT</span></div><section aria-labelledby="auth-title" className="auth-panel"><Link aria-label="Back to login" className="auth-back" to="/login"><ArrowLeft aria-hidden="true" size={16} />Back to login</Link><div className="auth-form-wrap"><span className="eyebrow">SUPABASE AUTH</span><h1 id="auth-title">{auth.session ? 'Choose a new password.' : 'Reset your password.'}</h1><p className="auth-subtitle">{auth.session ? 'Enter a new password for your Creator Clash account.' : 'We’ll send a secure recovery link if that email belongs to an account.'}</p><form className="form-stack" onSubmit={submitRecovery}>{auth.session ? <label className="field-label" htmlFor="new-password">New password<input autoComplete="new-password" className="text-input" id="new-password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label> : <label className="field-label" htmlFor="recovery-email">Email<input autoComplete="email" className="text-input" id="recovery-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>}{message && <p aria-live="polite" className="inline-notice">{message}</p>}{errorMessage && <p aria-live="assertive" className="field-error">{errorMessage}</p>}<button className="button button-primary auth-submit" disabled={busy} type="submit">{auth.session ? 'Update password' : 'Send recovery link'} <ArrowRight size={16} /></button></form></div></section></main>
}
