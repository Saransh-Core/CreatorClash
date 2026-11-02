import { useState } from 'react'
import { ArrowLeft, ArrowRight, ChartNoAxesColumnIncreasing, Compass, Crown, Gamepad2, LogOut, Radio, Settings2, Shield, Sparkles, Swords, Trophy, Users, Wallet, UserRound } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { CreatorClashMark } from '../brand/CreatorClashMark'
import { DemoBadge } from '../ui/DemoBadge'
import { useDemoStore } from '../../stores/demoStore'

type WorkspaceLayoutProps = { experience: 'creator' | 'community' }
type NavItem = { label: string; path: string; icon: typeof Radio; end?: boolean }
type NavGroup = { label: string; items: NavItem[] }

const creatorGroups: NavGroup[] = [
  { label: 'Workspace', items: [
    { label: 'Overview', path: '/creator', icon: Compass, end: true },
    { label: 'Battles', path: '/creator/battles', icon: Swords },
    { label: 'Find opponents', path: '/creator/battles/find', icon: Users },
    { label: 'Challenge Studio', path: '/creator/ai-director', icon: Sparkles },
    { label: 'Activities', path: '/creator/mini-games', icon: Gamepad2 },
    { label: 'Championship', path: '/creator/championship', icon: Trophy },
    { label: 'Rewards', path: '/creator/rewards', icon: Crown },
    { label: 'Analytics', path: '/creator/analytics', icon: ChartNoAxesColumnIncreasing },
    { label: 'Settings', path: '/creator/settings', icon: Settings2 },
  ] },
]
const communityGroups: NavGroup[] = [
  { label: 'Community', items: [
    { label: 'Home', path: '/community', icon: Compass, end: true },
    { label: 'Discover', path: '/community/discover', icon: Users },
    { label: 'Activities', path: '/community/activities', icon: Sparkles },
    { label: 'Championship', path: '/community/championship', icon: Trophy },
    { label: 'Wallet', path: '/community/wallet', icon: Wallet },
    { label: 'Profile', path: '/community/profile', icon: UserRound },
  ] },
]

export function WorkspaceLayout({ experience }: WorkspaceLayoutProps) {
  const isCreator = experience === 'creator'
  const label = isCreator ? 'Creator workspace' : 'Community workspace'
  const eyebrow = isCreator ? 'THE CONTROL ROOM' : 'THE VIEWING DECK'
  const groups = isCreator ? creatorGroups : communityGroups
  const counterpartPath = isCreator ? '/community' : '/creator'
  const counterpartLabel = isCreator ? 'Community mode' : 'Creator mode'
  const session = useDemoStore((state) => state.session)
  const signOut = useDemoStore((state) => state.signOut)
  const resetDemo = useDemoStore((state) => state.resetDemo)
  const switchMode = useDemoStore((state) => state.switchMode)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const handleSignOut = () => { signOut(); navigate('/login', { replace: true }) }
  const handleReset = () => { if (window.confirm('Reset this browser’s Creator Clash demo data?')) { resetDemo(); navigate('/login') } }

  return <div className="workspace-frame">
    <a className="skip-link" href="#workspace-content">Skip to workspace</a>
    <aside aria-label={label + ' navigation'} className={menuOpen ? 'workspace-sidebar menu-open' : 'workspace-sidebar'}>
      <div className="sidebar-brand-row"><Link aria-label="Creator Clash home" className="brand-link" to="/"><CreatorClashMark /></Link><button aria-controls="workspace-navigation" aria-expanded={menuOpen} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} className="mobile-menu-toggle" onClick={() => setMenuOpen((open) => !open)} type="button"><span /><span /></button></div>
      <div className="workspace-context"><span className="workspace-context-icon">{isCreator ? <Radio aria-hidden="true" size={17} /> : <Compass aria-hidden="true" size={17} />}</span><span><span className="eyebrow">{eyebrow}</span><span className="workspace-context-label">{label}</span></span><DemoBadge>DEMO</DemoBadge></div>
      <nav aria-label="Workspace navigation" className="workspace-nav" id="workspace-navigation">{groups.map((group) => <div className="workspace-nav-group" key={group.label}><span className="workspace-nav-heading">{group.label}</span>{group.items.map(({ label: itemLabel, path, icon: Icon, end }) => <NavLink className="workspace-nav-link" end={end ?? true} key={path} onClick={() => setMenuOpen(false)} to={path}><Icon aria-hidden="true" size={16} /><span>{itemLabel}</span><span className="nav-indicator" /></NavLink>)}</div>)}</nav>
      <div className="sidebar-bottom"><Link className="sidebar-link" to="/"><ArrowLeft aria-hidden="true" size={16} />Public site</Link><Link className="sidebar-link mode-switch-link" onClick={() => switchMode(isCreator ? 'community' : 'creator')} to={counterpartPath}><span>Switch to {counterpartLabel}</span><ArrowRight aria-hidden="true" size={16} /></Link><button className="sidebar-link reset-demo-link" onClick={handleReset} type="button"><span>Reset demo data</span><Shield aria-hidden="true" size={15} /></button></div>
    </aside>
    <div className="workspace-main"><header className="workspace-topbar"><span className="topbar-label">{label}</span><div className="topbar-actions"><span className="environment-tag"><span aria-hidden="true" className="status-dot" />Browser demo · local data</span><span className="topbar-user">{session?.name ?? 'Arena Guest'}</span><button aria-label="Sign out of demo profile" className="icon-button" onClick={handleSignOut} type="button"><LogOut size={16} /></button></div></header><main className="workspace-content" id="workspace-content"><Outlet /></main></div>
  </div>
}
