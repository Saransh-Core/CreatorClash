import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, Copy, LoaderCircle, MonitorPlay, Radio, ShieldCheck, Sparkles, Trophy, Unlink } from 'lucide-react'
import { Link } from 'react-router'
import { ImmersiveScene } from '../../components/scenes/ImmersiveScene'
import { DemoBadge } from '../../components/ui/DemoBadge'
import { DemoNotice } from '../../components/ui/DemoNotice'
import { InlineNotice } from '../../components/ui/InlineNotice'
import { PageHeading } from '../../components/ui/PageHeading'
import { Panel } from '../../components/ui/Panel'
import { StatBlock } from '../../components/ui/StatBlock'
import { WeeklyChart } from '../../components/data/WeeklyChart'
import { demoCosmetics } from '../../services/demoData'
import { useDemoStore } from '../../stores/demoStore'
import { useAuth } from '../auth/useAuth'
import { isApiConfigured } from '../../config/runtime'
import { disconnectTwitch, fetchTwitchConnection, fetchTwitchStream, getTwitchAuthorizationUrl } from '../../services/twitchApi'

export function CreatorAnalyticsPage() {
  const battles = useDemoStore((state) => state.battles)
  const completed = battles.filter((battle) => battle.status === 'completed').length
  return <div className="workspace-page"><PageHeading eyebrow="CREATOR WORKSPACE · ANALYTICS" title="Understand the moments that move." description="A concise read on competition and community engagement, using illustrative demo data." action={<DemoBadge>DEMO METRICS</DemoBadge>} /><DemoNotice>These metrics are curated examples and are not connected to Twitch, live audiences, or production competition results.</DemoNotice><div className="stats-row"><StatBlock label="Demo competitions" value={String(battles.length).padStart(2, '0')} detail="Across sample statuses" tone="accent" /><StatBlock label="Completed" value={String(completed).padStart(2, '0')} detail="Illustrative history" /><StatBlock label="Demo record" value="18–5" detail="Sample creator profile" tone="success" /><StatBlock label="Audience trend" value="+18%" detail="Sample weekly index" /></div><div className="analytics-layout"><Panel eyebrow="PARTICIPATION · 7 DAYS" title="Community activity"><WeeklyChart /></Panel><Panel eyebrow="COMPETITION MIX" title="What you play"><div className="analytics-bars">{[['Skill challenge', 74], ['Mini-game', 58], ['Community vote', 42]].map(([name, value]) => <div className="analytics-bar-row" key={name}><span>{name}</span><div><i style={{ width: value + '%' }} /></div><strong>{value}%</strong></div>)}</div><p className="panel-copy">Participation mix is illustrative and intended to preview future competition reporting.</p></Panel></div><Panel eyebrow="NEXT STEP" title="Connect competition history"><p className="panel-copy">Verified results and audience events will appear here after server-side data sources are connected.</p><Link className="text-action" to="/creator/settings">Review creator settings <ArrowRight size={15} /></Link></Panel></div>
}

export function CreatorRewardsPage() {
  const balance = useDemoStore((state) => state.clashCoins)
  const [selectedPreview, setSelectedPreview] = useState('')
  return <div className="workspace-page"><PageHeading eyebrow="CREATOR WORKSPACE · REWARDS" title="A look that feels like yours." description="Preview creator cosmetics and the illustrative Clash Coin collection." action={<span className="balance-pill"><span className="currency-symbol coin-symbol">C</span>{balance.toLocaleString()} Clash Coins</span>} /><DemoNotice>The balance and prices are sample data. Cosmetic previews do not spend Clash Coins; purchases require a server-authoritative ledger.</DemoNotice>{selectedPreview && <InlineNotice>{selectedPreview + ' preview selected. No balance was changed.'}</InlineNotice>}<div className="rewards-feature"><div><p className="eyebrow">COSMETIC PREVIEW · DEMO</p><h2>Make every arrival unmistakable.</h2><p>Profile frames, battle themes, and victory signatures built to express a competitive identity.</p></div><div className="reward-coin-scene"><ImmersiveScene kind="coin" /><span className="reward-frame-preview">CC</span></div></div><div className="cosmetic-list">{demoCosmetics.map((cosmetic) => <article className="cosmetic-row" key={cosmetic.id}><span className="cosmetic-art" style={{ color: cosmetic.accent, borderColor: cosmetic.accent }}><Sparkles size={20} /></span><div className="cosmetic-copy"><p className="eyebrow">{cosmetic.type} · DEMO</p><h3>{cosmetic.name}</h3><span>{cosmetic.description}</span></div><span className="cosmetic-price">{cosmetic.price} <small>CC</small></span><button aria-pressed={selectedPreview === cosmetic.id} className="button button-secondary" onClick={() => setSelectedPreview(cosmetic.id)} type="button">{selectedPreview === cosmetic.id ? 'Preview selected' : 'Preview cosmetic'} <ArrowRight size={15} /></button></article>)}</div><Panel eyebrow="CURRENCY GUIDE" title="Clash Coins stay creator-owned"><p className="panel-copy">Clash Coins are the creator reward currency for cosmetic customisation. They are separate from community Support Tokens.</p></Panel></div>
}

export function CreatorSettingsPage({ section = 'profile' }: { section?: 'profile' | 'twitch' }) {
  const [notice, setNotice] = useState(() => {
    if (typeof window === 'undefined') return ''
    const result = new URL(window.location.href).searchParams.get('twitch')
    if (result === 'connected') return 'Twitch account connected successfully.'
    if (result === 'denied') return 'Twitch authorization was cancelled.'
    if (result === 'error') return 'Twitch could not be connected. Check the app configuration and try again.'
    return ''
  })
  const twitch = section === 'twitch'
  const auth = useAuth()
  const queryClient = useQueryClient()
  const accessToken = auth.session?.access_token
  const enabled = auth.configured && Boolean(accessToken) && isApiConfigured()
  const connection = useQuery({ queryKey: ['twitch-connection', auth.session?.user.id], queryFn: () => fetchTwitchConnection(accessToken!), enabled, retry: false })
  const linked = connection.data?.connected === true
  const stream = useQuery({ queryKey: ['twitch-stream', auth.session?.user.id], queryFn: () => fetchTwitchStream(accessToken!), enabled: enabled && linked, refetchInterval: 60_000, retry: false })
  const connect = useMutation({ mutationFn: () => getTwitchAuthorizationUrl(accessToken!), onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl) })
  const disconnect = useMutation({ mutationFn: () => disconnectTwitch(accessToken!), onSuccess: async ({ revoked }) => {
    setNotice(revoked ? 'Twitch account disconnected.' : 'Twitch account disconnected; Twitch token revocation could not be confirmed.')
    await queryClient.invalidateQueries({ queryKey: ['twitch-connection'] })
    await queryClient.removeQueries({ queryKey: ['twitch-stream'] })
  } })

  useEffect(() => {
    const current = new URL(window.location.href)
    const result = current.searchParams.get('twitch')
    if (!result) return
    current.searchParams.delete('twitch')
    window.history.replaceState(null, '', `${current.pathname}${current.search}${current.hash}`)
    if (result === 'connected') void queryClient.invalidateQueries({ queryKey: ['twitch-connection'] })
  }, [queryClient])

  const confirmDisconnect = () => {
    if (window.confirm('Disconnect your Twitch account from Creator Clash?')) disconnect.mutate()
  }

  return <div className="workspace-page">
    <PageHeading eyebrow={twitch ? 'CREATOR WORKSPACE · TWITCH' : 'CREATOR WORKSPACE · SETTINGS'} title={twitch ? 'Connect your Twitch channel.' : 'Set up your creator presence.'} description={twitch ? 'Link your channel to show verified identity and live status.' : 'Creator profile, workspace preferences, and connected services.'} action={<span className="twitch-connect-badge">{linked ? 'CONNECTED' : 'TWITCH LINK'}</span>} />
    <div className="settings-layout">
      {!twitch && <Panel eyebrow="CREATOR PROFILE" title="Public profile preview"><div className="profile-settings-preview"><span className="creator-monogram">MV</span><div><strong>Mira Vale</strong><small>@miravale · Art & Creativity</small></div><DemoBadge>DEMO PROFILE</DemoBadge></div><label className="field-label">Display name<input className="text-input" defaultValue="Mira Vale" readOnly /></label><label className="field-label">Creator category<select className="text-input" defaultValue="art" disabled><option value="art">Art & Creativity · preview only</option></select></label><button className="button button-secondary" onClick={() => setNotice('Profile editing is not connected yet.')} type="button">Profile editing preview</button></Panel>}
      <Panel eyebrow="ACCOUNT CONNECTION" title="Twitch status">
        {!enabled && <InlineNotice>Sign in with a configured Creator Clash account and API to connect Twitch.</InlineNotice>}
        {connection.isPending && enabled && <output aria-live="polite" className="panel-copy"><LoaderCircle aria-hidden="true" className="spin" size={16} /> Checking Twitch connection…</output>}
        {connection.isError && <InlineNotice>{connection.error.message}</InlineNotice>}
        {connection.isError && enabled && <button className="button button-secondary" disabled={connect.isPending} onClick={() => connect.mutate()} type="button">{connect.isPending ? 'Connecting…' : 'Reconnect Twitch'}</button>}
        {connection.data?.connected ? <>
          <div className="connection-state">
            <img alt={`${connection.data.account.displayName} Twitch profile`} className="twitch-avatar" src={connection.data.account.profileImageUrl} />
            <div><strong>{connection.data.account.displayName}</strong><small>@{connection.data.account.login}</small></div>
            <span aria-label={stream.isPending ? 'Checking live status' : stream.isError ? 'Live status unavailable' : stream.data?.isLive ? 'Online' : 'Offline'} className={stream.data?.isLive ? 'connection-dot is-live' : 'connection-dot'} />
          </div>
          {stream.isPending && <output aria-live="polite" className="panel-copy">Checking live status…</output>}
          {stream.isError && <InlineNotice>{stream.error.message}</InlineNotice>}
          {stream.data?.isLive ? <div className="twitch-live-card">
            <img alt="Live Twitch stream thumbnail" loading="lazy" src={stream.data.thumbnailUrl} />
            <p className="eyebrow"><span className="live-indicator" /> LIVE · {stream.data.viewerCount.toLocaleString()} VIEWERS</p>
            <h3>{stream.data.title}</h3><p className="panel-copy">{stream.data.category}</p>
          </div> : stream.data && <p className="panel-copy">Your channel is offline. Live stream details will appear here when you go live.</p>}
          <button className="button button-secondary" disabled={disconnect.isPending} onClick={confirmDisconnect} type="button"><Unlink size={15} />{disconnect.isPending ? 'Disconnecting…' : 'Disconnect Twitch'}</button>
        </> : connection.data?.connected === false ? <>
          <div className="connection-state"><span className="connection-icon"><Radio size={20} /></span><div><strong>Not connected</strong><small>Connect to show your verified channel identity and live status.</small></div><span className="connection-dot" /></div>
          <button className="button button-primary" disabled={!enabled || connect.isPending} onClick={() => connect.mutate()} type="button">{connect.isPending ? <><LoaderCircle className="spin" size={15} /> Connecting…</> : 'Connect Twitch'}</button>
        </> : null}
        {connect.isError && <InlineNotice>{connect.error.message}</InlineNotice>}
        {disconnect.isError && <InlineNotice>{disconnect.error.message}</InlineNotice>}
        <ul className="integration-checklist"><li><ShieldCheck size={15} /> Twitch tokens stay on the Creator Clash server.</li><li><Check size={15} /> Read-only access to channel and stream status.</li></ul>
      </Panel>
    </div>
    {notice && <InlineNotice>{notice}</InlineNotice>}
    <Panel eyebrow="CREATOR CONTROLS" title="Workspace preferences"><div className="settings-summary-row"><span>Workspace mode</span><Link to="/community">Switch to community <ArrowRight size={15} /></Link></div><div className="settings-summary-row"><span>Overlay preview</span><Link to="/creator/overlay">Open OBS overlay <ArrowRight size={15} /></Link></div></Panel>
  </div>
}

export function ObsOverlayPage() {
  const [copied, setCopied] = useState(false)
  const demoUrl = typeof window === 'undefined' ? '/creator/overlay?mode=demo' : window.location.origin + '/creator/overlay?mode=demo'
  const copy = async () => {
    try { await navigator.clipboard.writeText(demoUrl); setCopied(true) } catch { setCopied(false) }
  }
  return <div className="workspace-page"><PageHeading eyebrow="CREATOR WORKSPACE · BROADCAST TOOLS" title="A clean signal for the stream." description="Preview a browser-source overlay composition for OBS. Live synchronization requires a future backend connection." action={<DemoBadge>OVERLAY DEMO</DemoBadge>} /><DemoNotice>This overlay uses local sample identities and scores. It does not synchronize with a competition.</DemoNotice><section aria-label="OBS overlay preview" className="obs-preview"><div className="obs-preview-grid"><div className="obs-competitor"><span className="obs-avatar">MV</span><span><strong>Mira Vale</strong><small>ART & CREATIVITY · DEMO</small></span></div><div className="obs-score"><span>DEMO MATCH · 08:42</span><strong>04 <i>—</i> 03</strong><small>QUICK SKETCH SHOWDOWN</small></div><div className="obs-competitor obs-competitor-right"><span className="obs-avatar obs-avatar-blue">KR</span><span><strong>Kai Rivers</strong><small>MUSIC · DEMO</small></span></div></div><span className="obs-watermark">CREATOR CLASH · LOCAL PREVIEW</span></section><div className="overlay-actions"><Panel eyebrow="BROWSER SOURCE" title="Local demo URL"><p className="panel-copy">Use this local route to review the overlay composition. It will not update from live battle events.</p><div className="copy-url"><code>{demoUrl}</code><button aria-label="Copy demo overlay URL" className="icon-button" onClick={() => void copy()} type="button">{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>{copied && <InlineNotice>Demo overlay URL copied.</InlineNotice>}</Panel><Panel eyebrow="SETUP" title="Ready for OBS review"><MonitorPlay size={24} /><p className="panel-copy">Add the URL as a browser source after reviewing the sample frame. Transparent background and real-time event sync are future integration work.</p><DemoBadge>NO LIVE SYNC</DemoBadge></Panel></div><div className="settings-summary-row"><span><Trophy size={16} /> Competition data</span><span>Illustrative only</span></div></div>
}
