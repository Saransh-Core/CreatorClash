import { Navigate, Outlet, useLocation } from 'react-router'
import { useDemoStore } from '../../stores/demoStore'

export function AuthGate() {
  const session = useDemoStore((state) => state.session)
  const location = useLocation()

  if (!session) {
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
