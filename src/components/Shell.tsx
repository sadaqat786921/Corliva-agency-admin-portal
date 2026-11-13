import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Users, Building2, Layers, ShieldCheck, Bell, UserPlus, Home, CalendarDays, ClipboardCheck,
  TriangleAlert, BarChart3, History, SlidersHorizontal, LogOut, RotateCcw, Search, ChevronDown, Calendar, MessageSquare, Check, UserRound,
} from 'lucide-react'
import { useStore, fmtDate, resetDemoData } from '../data/store'
import { TODAY } from '../data/seed'
import { Avatar, ConfirmDialog, Toasts, useClickOutside } from './ui'

const NAV = [
  { section: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: LayoutGrid, end: true }] },
  { section: 'People & Access', items: [{ to: '/users', label: 'Users & Roles', icon: Users }] },
  { section: 'Agency Setup', items: [
    { to: '/agency', label: 'Agency & Branches', icon: Building2 },
    { to: '/services', label: 'Services & Lists', icon: Layers },
    { to: '/rules', label: 'Rules & Requirements', icon: ShieldCheck },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ] },
  { section: 'Oversight', items: [
    { to: '/referrals', label: 'Referrals', icon: UserPlus },
    { to: '/clients', label: 'Clients', icon: Home },
    { to: '/schedule', label: 'Schedule', icon: CalendarDays, badge: 'unassigned' },
    { to: '/approvals', label: 'Visit Approvals', icon: ClipboardCheck, badge: 'approvals' },
    { to: '/incidents', label: 'Incidents', icon: TriangleAlert },
  ] },
  { section: 'Insights', items: [
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/audit', label: 'Audit History', icon: History },
  ] },
  { section: 'Settings', items: [{ to: '/settings', label: 'Settings', icon: SlidersHorizontal }] },
]

export default function Shell() {
  const s = useStore()
  const nav = useNavigate()
  const [confirmOut, setConfirmOut] = useState(false)
  const [agencyOpen, setAgencyOpen] = useState(false)
  const closeAgency = useCallback(() => setAgencyOpen(false), [])
  const agencyRef = useClickOutside<HTMLDivElement>(agencyOpen, closeAgency)

  const badges: Record<string, number> = {
    unassigned: s.visits.filter(v => v.status === 'Unassigned' && s.inBranch(v.branch)).length,
    approvals: s.approvals.filter(a => a.status === 'Waiting' && s.inBranch(a.branch)).length,
  }
  const agencyInitials = s.agency.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Main menu">
        <div className="sidebar-logo"><img src="./images/corliva-logo-white.svg" alt="CORLIVA" /></div>
        <div ref={agencyRef} style={{ position: 'relative' }}>
          <button className="agency-switch" onClick={() => setAgencyOpen(o => !o)} aria-expanded={agencyOpen} aria-label="Choose branch">
            <span className="agency-avatar">{agencyInitials}</span>
            <span className="grow">
              <span style={{ display: 'block', fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.agency.name}</span>
              <span style={{ display: 'block', fontSize: 11, opacity: .85 }}>{s.branchName(s.branch)}</span>
            </span>
            <ChevronDown size={16} />
          </button>
          {agencyOpen && (
            <div className="popover" style={{ left: 0, right: 0 }}>
              <div className="t-caption t-muted" style={{ padding: '6px 10px' }}>Show work for</div>
              {[{ id: 'all', name: 'All branches' }, ...s.branches.filter(b => b.active)].map(b => (
                <button key={b.id} className="menu-item" onClick={() => { s.setBranch(b.id); setAgencyOpen(false) }}>
                  <Building2 />{b.name}{s.branch === b.id && <Check style={{ marginLeft: 'auto', color: 'var(--action-primary)' }} />}
                </button>
              ))}
              <div className="menu-sep" />
              <button className="menu-item" onClick={() => { setAgencyOpen(false); nav('/agency') }}><SlidersHorizontal />Manage branches</button>
            </div>
          )}
        </div>
        <nav>
          {NAV.map(g => (
            <div key={g.section}>
              <div className="nav-section">{g.section}</div>
              {g.items.map(it => (
                <NavLink key={it.to} to={it.to} end={'end' in it ? it.end : false} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <it.icon />{it.label}
                  {'badge' in it && it.badge && badges[it.badge] > 0 && <span className="nav-badge">{badges[it.badge]}</span>}
                </NavLink>
              ))}
            </div>
          ))}
          <button className="nav-item" onClick={() => setConfirmOut(true)}><LogOut />Log Out</button>
        </nav>
      </aside>

      <main className="main">
        <Header />
        <Outlet />
      </main>
      <Toasts />
      {confirmOut && <ConfirmDialog title="Log out of CORLIVA?" text="You will need your email and password to sign back in." confirm="Log out" onClose={() => setConfirmOut(false)} onConfirm={() => { s.signOut(); nav('/login') }} />}
    </div>
  )
}

function Header() {
  const s = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState<null | 'branch' | 'bell' | 'msg' | 'me' | 'search'>(null)
  const close = useCallback(() => setOpen(null), [])
  const ref = useClickOutside<HTMLDivElement>(open !== null, close)
  const [q, setQ] = useState('')
  const loc = useLocation()
  useEffect(() => { setOpen(null); setQ('') }, [loc.pathname, loc.search])

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (t.length < 2) return []
    const r: { label: string; sub: string; to: string }[] = []
    s.clients.filter(c => c.name.toLowerCase().includes(t)).forEach(c => r.push({ label: c.name, sub: 'Client · ' + s.branchName(c.branch), to: `/clients?open=${c.id}` }))
    s.caregivers.filter(c => c.name.toLowerCase().includes(t)).forEach(c => r.push({ label: c.name, sub: 'Caregiver · ' + c.readiness, to: `/schedule?caregiver=${c.id}` }))
    s.users.filter(u => u.name.toLowerCase().includes(t)).forEach(u => r.push({ label: u.name, sub: 'Team · ' + u.role, to: `/users?open=${u.id}` }))
    s.referrals.filter(x => x.name.toLowerCase().includes(t) || x.id.toLowerCase().includes(t)).forEach(x => r.push({ label: x.name, sub: `Referral ${x.id} · ${x.stage}`, to: `/referrals/${x.id}` }))
    s.visits.filter(v => ('#' + v.id.slice(1)).includes(t) || v.id.includes(t)).forEach(v => r.push({ label: 'Visit #' + v.id.slice(1), sub: `${fmtDate(v.date)} · ${v.start}`, to: `/schedule?visit=${v.id}` }))
    return r.slice(0, 8)
  }, [q, s.clients, s.caregivers, s.users, s.referrals, s.visits, s.branchName])

  const unread = s.inbox.filter(n => !n.read).length
  const openReq = s.requests.filter(r => r.status === 'Open').length
  const go = (to: string) => { setOpen(null); setQ(''); nav(to) }

  return (
    <header className="header" ref={ref}>
      <div style={{ position: 'relative' }}>
        <div className="search" style={{ width: 300 }}>
          <Search />
          <input aria-label="Search" placeholder="Search clients, caregivers, visits" value={q}
            onChange={e => { setQ(e.target.value); setOpen('search') }} onFocus={() => setOpen('search')}
            onKeyDown={e => { if (e.key === 'Enter' && results[0]) go(results[0].to) }} />
        </div>
        {open === 'search' && q.trim().length >= 2 && (
          <div className="popover" style={{ left: 0, right: 'auto', width: 360 }}>
            {results.length === 0 ? <div className="t-small t-muted" style={{ padding: 12 }}>Nothing found for “{q}”. Check the spelling or try a shorter word.</div>
              : results.map(r => (
                <button key={r.to + r.label} className="menu-item" onClick={() => go(r.to)}>
                  <Search /><span><span style={{ display: 'block', fontWeight: 500 }}>{r.label}</span><span className="t-caption t-muted">{r.sub}</span></span>
                </button>
              ))}
          </div>
        )}
      </div>
      <div className="header-spacer" />

      <div style={{ position: 'relative' }}>
        <button className="header-chip" onClick={() => setOpen(open === 'branch' ? null : 'branch')} aria-expanded={open === 'branch'}>
          <Building2 size={16} />{s.branchName(s.branch)}<ChevronDown size={14} />
        </button>
        {open === 'branch' && (
          <div className="popover">
            {[{ id: 'all', name: 'All branches' }, ...s.branches.filter(b => b.active)].map(b => (
              <button key={b.id} className="menu-item" onClick={() => { s.setBranch(b.id); setOpen(null) }}>
                <Building2 />{b.name}{s.branch === b.id && <Check style={{ marginLeft: 'auto', color: 'var(--action-primary)' }} />}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="header-chip" title="Agency time zone: Central Time"><Calendar size={16} />{fmtDate(TODAY, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>

      <div style={{ position: 'relative' }}>
        <button className="icon-btn" aria-label={`Alerts, ${unread} unread`} onClick={() => setOpen(open === 'bell' ? null : 'bell')}>
          <Bell size={18} />{unread > 0 && <span className="dot" />}
        </button>
        {open === 'bell' && (
          <div className="popover" style={{ width: 380 }}>
            <div className="row between" style={{ padding: '6px 10px 8px' }}>
              <span className="t-strong">Alerts</span>
              <button className="link-btn" disabled={!unread} onClick={() => s.setInbox(i => i.map(n => ({ ...n, read: true })))}>Mark all as read</button>
            </div>
            {s.inbox.map(n => (
              <button key={n.id} className="menu-item" style={{ alignItems: 'flex-start' }} onClick={() => { s.setInbox(i => i.map(x => x.id === n.id ? { ...x, read: true } : x)); go(n.link) }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0, background: n.read ? 'transparent' : `var(--status-${n.tone})` }} />
                <span><span style={{ display: 'block', fontWeight: n.read ? 400 : 600 }}>{n.title}</span><span className="t-caption t-muted">{n.body} · {n.at}</span></span>
              </button>
            ))}
            <div className="menu-sep" />
            <button className="menu-item" onClick={() => go('/notifications')}><SlidersHorizontal />Choose which alerts are sent</button>
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <button className="icon-btn" aria-label={`Family requests, ${openReq} open`} onClick={() => setOpen(open === 'msg' ? null : 'msg')}>
          <MessageSquare size={18} />{openReq > 0 && <span className="dot" style={{ background: 'var(--action-primary)' }} />}
        </button>
        {open === 'msg' && (
          <div className="popover" style={{ width: 380 }}>
            <div style={{ padding: '6px 10px 8px' }}><div className="t-strong">Family requests</div><div className="t-caption t-muted">Handled by the client’s Care Coordinator. You can see who owns each one.</div></div>
            {s.requests.map(r => (
              <div key={r.id} className="menu-item" style={{ alignItems: 'flex-start', cursor: 'default' }}>
                <Avatar name={r.from} size="sm" />
                <span className="grow"><span style={{ display: 'block' }}><b>{r.from}</b> about {r.client}</span>
                  <span className="t-small" style={{ display: 'block' }}>“{r.text}”</span>
                  <span className="t-caption t-muted">Owner: {r.owner} · {r.at}</span></span>
                <span className={`chip chip-${r.status === 'Open' ? 'info' : 'success'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <button className="profile-btn" onClick={() => setOpen(open === 'me' ? null : 'me')} aria-expanded={open === 'me'}>
          <span className="avatar">{s.me.initials}</span>
          <span><span style={{ display: 'block', fontWeight: 600, fontSize: 13 }}>{s.me.name}</span><span className="t-caption t-muted">Agency Admin</span></span>
          <ChevronDown size={14} />
        </button>
        {open === 'me' && (
          <div className="popover">
            <button className="menu-item" onClick={() => go('/settings')}><UserRound />My profile</button>
            <button className="menu-item" onClick={() => go('/settings?tab=security')}><ShieldCheck />Password & security</button>
            <button className="menu-item" onClick={resetDemoData}><RotateCcw />Reset demo data</button>
            <div className="menu-sep" />
            <button className="menu-item danger" onClick={() => { s.signOut(); go('/login') }}><LogOut />Log out</button>
          </div>
        )}
      </div>
    </header>
  )
}
