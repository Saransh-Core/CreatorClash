import { RouterProvider } from 'react-router'
import { AppProviders } from './providers'
import { router } from './router'
import { useMotionPreference } from '../utils/motionPreference'

export function App() {
  useMotionPreference()

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
