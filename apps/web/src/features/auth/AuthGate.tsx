import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './useAuth'
import { useDemoStore } from '../../stores/demoStore'

export function AuthGate() {
  const session = useDemoStore((state) => state.session)
  const auth = useAuth()
  const location = useLocation()

  if (auth.configured && auth.loading) {
    return <div aria-live="polite" className="route-loading"><span className="loading-mark" /><span>Checking your account…</span></div>
  }

  if (auth.configured ? !auth.session : !session) {
    return (
      <Navigate
        replace
        state={{ from: location.pathname + location.search }}
        to="/login"
      />
    )
  }

  return <Outlet />
}
