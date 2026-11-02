/* oxlint-disable react/only-export-components -- this module defines lazy route references and the router singleton. */
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { PublicLayout } from '../components/layout/PublicLayout'
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout'
import { AuthGate } from '../features/auth/AuthGate'

const LandingPage = lazy(() => import('../features/home/LandingPage').then((module) => ({ default: module.LandingPage })))
const LoginPage = lazy(() => import('../features/auth/AuthPages').then((module) => ({ default: module.LoginPage })))
const SignupPage = lazy(() => import('../features/auth/AuthPages').then((module) => ({ default: () => <module.LoginPage createAccount /> })))
const ForgotPasswordPage = lazy(() => import('../features/auth/AuthPages').then((module) => ({ default: module.ForgotPasswordPage })))
const ArenaPage = lazy(() => import('../features/public/PublicPages').then((module) => ({ default: module.ArenaPage })))
const PublicBattleDetailPage = lazy(() => import('../features/public/PublicPages').then((module) => ({ default: module.PublicBattleDetailPage })))
const PublicChampionshipPage = lazy(() => import('../features/public/PublicPages').then((module) => ({ default: module.PublicChampionshipPage })))
const CreatorsPage = lazy(() => import('../features/public/PublicPages').then((module) => ({ default: module.CreatorsPage })))
const CreatorProfilePage = lazy(() => import('../features/public/PublicPages').then((module) => ({ default: module.CreatorProfilePage })))
const HowItWorksPage = lazy(() => import('../features/public/PublicPages').then((module) => ({ default: module.HowItWorksPage })))
const NotFoundPage = lazy(() => import('../features/public/PublicPages').then((module) => ({ default: module.NotFoundPage })))
const CreatorOverviewPage = lazy(() => import('../features/creator/CreatorPages').then((module) => ({ default: module.CreatorOverviewPage })))
const CreatorEngagementPage = lazy(() => import('../features/creator/CreatorPages').then((module) => ({ default: module.CreatorEngagementPage })))
const CreatorBattlesPage = lazy(() => import('../features/creator/CreatorPages').then((module) => ({ default: module.CreatorBattlesPage })))
const CreateBattlePage = lazy(() => import('../features/creator/CreatorPages').then((module) => ({ default: module.CreateBattlePage })))
const OpponentFinderPage = lazy(() => import('../features/creator/CreatorPages').then((module) => ({ default: module.OpponentFinderPage })))
const BattleRoomPage = lazy(() => import('../features/creator/CreatorPages').then((module) => ({ default: module.BattleRoomPage })))
const CreatorChampionshipPage = lazy(() => import('../features/creator/CreatorPages').then((module) => ({ default: module.CreatorChampionshipPage })))
const CreatorRewardsPage = lazy(() => import('../features/creator/CreatorExtras').then((module) => ({ default: module.CreatorRewardsPage })))
const CreatorAnalyticsPage = lazy(() => import('../features/creator/CreatorExtras').then((module) => ({ default: module.CreatorAnalyticsPage })))
const CreatorSettingsPage = lazy(() => import('../features/creator/CreatorExtras').then((module) => ({ default: module.CreatorSettingsPage })))
const ObsOverlayPage = lazy(() => import('../features/creator/CreatorExtras').then((module) => ({ default: module.ObsOverlayPage })))
const CommunityOverviewPage = lazy(() => import('../features/community/CommunityPages').then((module) => ({ default: module.CommunityOverviewPage })))
const CommunityDiscoverPage = lazy(() => import('../features/community/CommunityPages').then((module) => ({ default: module.CommunityDiscoverPage })))
const CommunityActivitiesPage = lazy(() => import('../features/community/CommunityPages').then((module) => ({ default: module.CommunityActivitiesPage })))
const CommunitySupportPage = lazy(() => import('../features/community/CommunityPages').then((module) => ({ default: module.CommunitySupportPage })))
const CommunityChampionshipPage = lazy(() => import('../features/community/CommunityPages').then((module) => ({ default: module.CommunityChampionshipPage })))
const CommunityWalletPage = lazy(() => import('../features/community/CommunityPages').then((module) => ({ default: module.CommunityWalletPage })))
const CommunityRewardsPage = lazy(() => import('../features/community/CommunityPages').then((module) => ({ default: module.CommunityRewardsPage })))
const CommunitySettingsPage = lazy(() => import('../features/community/CommunityPages').then((module) => ({ default: module.CommunitySettingsPage })))
const MiniGamesHubPage = lazy(() => import('../features/mini-games/MiniGamesPages').then((module) => ({ default: module.MiniGamesHubPage })))
const MiniGamePage = lazy(() => import('../features/mini-games/MiniGamesPages').then((module) => ({ default: module.MiniGamePage })))
const AiDirectorPage = lazy(() => import('../features/ai-director/AiDirectorPage').then((module) => ({ default: module.AiDirectorPage })))

function RouteFallback() {
  return <div aria-live="polite" className="route-loading"><span className="loading-mark" /><span>Entering the arena…</span></div>
}
function RouteBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <RouteBoundary><LandingPage /></RouteBoundary> },
      { path: '/arena', element: <RouteBoundary><ArenaPage /></RouteBoundary> },
      { path: '/arena/:battleId', element: <RouteBoundary><PublicBattleDetailPage /></RouteBoundary> },
      { path: '/championship', element: <RouteBoundary><PublicChampionshipPage /></RouteBoundary> },
      { path: '/creators', element: <RouteBoundary><CreatorsPage /></RouteBoundary> },
      { path: '/creators/:id', element: <RouteBoundary><CreatorProfilePage /></RouteBoundary> },
      { path: '/how-it-works', element: <RouteBoundary><HowItWorksPage /></RouteBoundary> },
      { path: '*', element: <RouteBoundary><NotFoundPage /></RouteBoundary> },
    ],
  },
  { path: '/login', element: <RouteBoundary><LoginPage /></RouteBoundary> },
  { path: '/signup', element: <RouteBoundary><SignupPage /></RouteBoundary> },
  { path: '/forgot-password', element: <RouteBoundary><ForgotPasswordPage /></RouteBoundary> },
  { path: '/app/creator', element: <Navigate replace to="/creator" /> },
  { path: '/app/community', element: <Navigate replace to="/community" /> },
  {
    element: <AuthGate />,
    children: [
      {
        path: '/creator', element: <WorkspaceLayout experience="creator" />, children: [
          { index: true, element: <RouteBoundary><CreatorOverviewPage /></RouteBoundary> },
          { path: 'community-engagement', element: <RouteBoundary><CreatorEngagementPage /></RouteBoundary> },
          { path: 'battles', element: <RouteBoundary><CreatorBattlesPage /></RouteBoundary> },
          { path: 'battles/create', element: <RouteBoundary><CreateBattlePage /></RouteBoundary> },
          { path: 'battles/find', element: <RouteBoundary><OpponentFinderPage /></RouteBoundary> },
          { path: 'battles/invitations', element: <RouteBoundary><CreatorBattlesPage filter="invitations" /></RouteBoundary> },
          { path: 'battles/history', element: <RouteBoundary><CreatorBattlesPage filter="history" /></RouteBoundary> },
          { path: 'battles/:battleId', element: <RouteBoundary><BattleRoomPage /></RouteBoundary> },
          { path: 'ai-director', element: <RouteBoundary><AiDirectorPage /></RouteBoundary> },
          { path: 'mini-games', element: <RouteBoundary><MiniGamesHubPage /></RouteBoundary> },
          { path: 'mini-games/:gameId', element: <RouteBoundary><MiniGamePage /></RouteBoundary> },
          { path: 'championship', element: <RouteBoundary><CreatorChampionshipPage /></RouteBoundary> },
          { path: 'rewards', element: <RouteBoundary><CreatorRewardsPage /></RouteBoundary> },
          { path: 'analytics', element: <RouteBoundary><CreatorAnalyticsPage /></RouteBoundary> },
          { path: 'settings', element: <RouteBoundary><CreatorSettingsPage /></RouteBoundary> },
          { path: 'integrations/twitch', element: <RouteBoundary><CreatorSettingsPage section="twitch" /></RouteBoundary> },
          { path: 'overlay', element: <RouteBoundary><ObsOverlayPage /></RouteBoundary> },
        ],
      },
      {
        path: '/community', element: <WorkspaceLayout experience="community" />, children: [
          { index: true, element: <RouteBoundary><CommunityOverviewPage /></RouteBoundary> },
          { path: 'discover', element: <RouteBoundary><CommunityDiscoverPage /></RouteBoundary> },
          { path: 'activities', element: <RouteBoundary><CommunityActivitiesPage /></RouteBoundary> },
          { path: 'activities/:gameId', element: <RouteBoundary><MiniGamePage workspace="community" /></RouteBoundary> },
          { path: 'support', element: <RouteBoundary><CommunitySupportPage /></RouteBoundary> },
          { path: 'championship', element: <RouteBoundary><CommunityChampionshipPage /></RouteBoundary> },
          { path: 'wallet', element: <RouteBoundary><CommunityWalletPage /></RouteBoundary> },
          { path: 'rewards', element: <RouteBoundary><CommunityRewardsPage /></RouteBoundary> },
          { path: 'profile', element: <RouteBoundary><CommunitySettingsPage /></RouteBoundary> },
          { path: 'settings', element: <Navigate replace to="/community/profile" /> },
        ],
      },
    ],
  },
])
