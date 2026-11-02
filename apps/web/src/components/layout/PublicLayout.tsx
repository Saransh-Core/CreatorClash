import { useState } from 'react'
import { ArrowUpRight, Menu } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { CreatorClashMark } from '../brand/CreatorClashMark'

const links = [
  { label: 'Home', path: '/' },
  { label: 'Explore competitions', path: '/arena' },
  { label: 'Creators', path: '/creators' },
  { label: 'Championship', path: '/championship' },
  { label: 'How it works', path: '/how-it-works' },
]

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <div className="site-frame">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <Link aria-label="Creator Clash home" className="brand-link" onClick={closeMenu} to="/">
          <CreatorClashMark />
        </Link>
        <nav aria-label="Main navigation" className="public-nav">
          {links.map((link) => <NavLink className="nav-link" end={link.path === '/'} key={link.path} to={link.path}>{link.label}</NavLink>)}
        </nav>
        <Link className="header-action" onClick={closeMenu} to="/login">Sign in <ArrowUpRight aria-hidden="true" size={15} /></Link>
        <details className="mobile-menu" onToggle={(event) => setMobileMenuOpen(event.currentTarget.open)} open={mobileMenuOpen}>
          <summary aria-label={mobileMenuOpen ? 'Close main menu' : 'Open main menu'} aria-expanded={mobileMenuOpen}><Menu size={20} /></summary>
          <nav aria-label="Mobile main navigation">
            {links.map((link) => <Link key={link.path} onClick={closeMenu} to={link.path}>{link.label}</Link>)}
            <Link className="mobile-menu-cta" onClick={closeMenu} to="/login">Sign in <ArrowUpRight size={15} /></Link>
          </nav>
        </details>
      </header>
      <main id="main-content"><Outlet /></main>
      <footer className="site-footer">
        <Link aria-label="Creator Clash home" className="footer-brand" to="/"><CreatorClashMark compact /></Link>
        <span className="footer-tagline">Competition belongs to everyone.</span>
        <nav aria-label="Footer public links"><Link to="/arena">Explore competitions</Link><Link to="/creators">Creators</Link><Link to="/championship">Championship</Link><Link to="/how-it-works">How it works</Link></nav>
        <nav aria-label="Footer workspace links"><Link to="/login?mode=creator&next=/creator">Creator workspace</Link><Link to="/login?mode=community&next=/community">Community workspace</Link><span className="footer-social-placeholder">Social channels · Coming soon</span></nav>
        <div className="footer-legal"><span>© Creator Clash</span><span>Demo preview · Legal pages coming soon</span></div>
      </footer>
    </div>
  )
}
