import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { CreatorClashMark } from '../../components/brand/CreatorClashMark'
import { DemoBadge } from '../../components/ui/DemoBadge'
import { useDemoStore } from '../../stores/demoStore'

const demoAccountSchema = z.object({
  displayName: z.string().trim().min(2, 'Use at least 2 characters.').max(32),
  mode: z.enum(['creator', 'community']),
})

type DemoAccountInput = z.infer<typeof demoAccountSchema>

export function LoginPage({ createAccount = false }: { createAccount?: boolean }) {
  const createDemoSession = useDemoStore((state) => state.createDemoSession)
  const location = useLocation()
  const navigate = useNavigate()
  const requestedMode = new URLSearchParams(location.search).get('mode')
  const requestedDestination =
    (location.state as { from?: string } | null)?.from ??
    new URLSearchParams(location.search).get('next')
  const initialMode = requestedMode === 'creator' || requestedDestination?.startsWith('/creator')
    ? 'creator'
    : 'community'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DemoAccountInput>({
    resolver: zodResolver(demoAccountSchema),
    defaultValues: {
      displayName: 'Arena Guest',
      mode: initialMode,
    },
  })

  const onSubmit = handleSubmit(async ({ displayName, mode }) => {
    createDemoSession(displayName, mode)
    navigate(requestedDestination || (mode === 'creator' ? '/creator' : '/community'), { replace: true })
  })

  return (
    <main className="auth-page">
      <div aria-hidden="true" className="auth-visual">
        <div className="auth-visual-orbit" />
        <CreatorClashMark />
        <p className="auth-quote">
          Every great competition
          <br />
          starts with a community.
        </p>
        <span className="auth-visual-caption">CREATOR CLASH · DEMO ENVIRONMENT</span>
      </div>
      <section aria-labelledby="auth-title" className="auth-panel">
        <Link aria-label="Back to Creator Clash" className="auth-back" to="/">
          <ArrowLeft aria-hidden="true" size={16} />
          Back to Creator Clash
        </Link>
        <div className="auth-form-wrap">
          <DemoBadge>DEMO ACCOUNT</DemoBadge>
          <h1 id="auth-title">{createAccount ? 'Join the arena.' : 'Welcome back.'}</h1>
          <p className="auth-subtitle">
            {createAccount
              ? 'Create a local demo profile to explore both workspace modes.'
              : 'Continue with a clearly labelled local demo profile.'}
          </p>
          <form className="form-stack" onSubmit={onSubmit}>
            <label className="field-label" htmlFor="displayName">
              Display name
              <input
                autoComplete="name"
                className="text-input"
                id="displayName"
                placeholder="Arena Guest"
                {...register('displayName')}
              />
              {errors.displayName && (
                <span className="field-error">{errors.displayName.message}</span>
              )}
            </label>
            <label className="field-label" htmlFor="mode">
              Start in
              <select className="text-input" id="mode" {...register('mode')}>
                <option value="community">Community workspace</option>
                <option value="creator">Creator workspace</option>
              </select>
            </label>
            <button className="button button-primary auth-submit" disabled={isSubmitting} type="submit">
              Enter demo workspace <ArrowRight aria-hidden="true" size={16} />
            </button>
          </form>
          <p className="auth-safety-note">
            <ShieldCheck aria-hidden="true" size={15} />
            Demo only. No email, Twitch, or production authentication is connected.
          </p>
          <div className="auth-switch">
            {createAccount ? 'Already exploring?' : 'New to the demo?'}
            <Link to={createAccount ? '/login' : '/signup'}>
              {createAccount ? 'Sign in' : 'Create a demo profile'}
            </Link>
          </div>
          <Link className="auth-quiet-link" to="/forgot-password">
            Forgot your password?
          </Link>
        </div>
      </section>
    </main>
  )
}

export function ForgotPasswordPage() {
  return (
    <main className="auth-page">
      <div aria-hidden="true" className="auth-visual">
        <div className="auth-visual-orbit" />
        <CreatorClashMark />
        <p className="auth-quote">Your account stays yours.</p>
        <span className="auth-visual-caption">CREATOR CLASH · DEMO ENVIRONMENT</span>
      </div>
      <section aria-labelledby="auth-title" className="auth-panel">
        <Link aria-label="Back to login" className="auth-back" to="/login">
          <ArrowLeft aria-hidden="true" size={16} />
          Back to login
        </Link>
        <div className="auth-form-wrap">
          <DemoBadge>DEMO MODE</DemoBadge>
          <h1 id="auth-title">Password recovery isn’t connected.</h1>
          <p className="auth-subtitle">
            This frontend preview has no account or email service. Use the demo
            profile flow to explore the workspaces.
          </p>
          <Link className="button button-primary auth-submit" to="/login">
            Continue to demo sign in <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>
    </main>
  )
}
