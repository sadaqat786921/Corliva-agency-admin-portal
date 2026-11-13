import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ClipboardCheck, UserX, Home, TriangleAlert, FileText, Download, UserPlus, ChevronLeft, ChevronRight, Clock, ShieldCheck, Users, History, CheckCircle2, Plus } from 'lucide-react'
import { useStore, fmtDate, downloadCsv } from '../data/store'
import { TODAY, iso, addDays, Stage } from '../data/seed'
import { daysInStage } from '../data/referrals'
import { Avatar, Button, CardHead, Chip, ChipTone, Field, Input, Modal, PageHead, Select, StatTile } from '../components/ui'
import InviteModal from '../components/InviteModal'

const STAGES: { s: Stage; tone: ChipTone }[] = [
  { s: 'Enquiry', tone: 'neutral' }, { s: 'Qualification', tone: 'info' }, { s: 'Assessment', tone: 'info' }, { s: 'Decision', tone: 'warning' }, { s: 'Converted', tone: 'success' },
]

export default function Dashboard() {
  const s = useStore()
  const nav = useNavigate()
  const [invite, setInvite] = useState(false)
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const visits = s.visits.filter(v => s.inBranch(v.branch))
  const today = visits.filter(v => v.date === TODAY)
  const tomorrowOpen = visits.filter(v => v.date === addDays(1) && v.status === 'Unassigned')
  const count = (st: string) => today.filter(v => v.status === st).length
  const waiting = s.approvals.filter(a => a.status === 'Waiting' && s.inBranch(a.branch))
  const cgs = s.caregivers.filter(c => s.inBranch(c.branch))
  const blocked = cgs.filter(c => c.readiness === 'Blocked')
  const activeClients = s.clients.filter(c => c.status === 'Active' && s.inBranch(c.branch))
  const openInc = s.incidents.filter(i => !['Resolved', 'Closed'].includes(i.status) && s.inBranch(i.branch))
  const overduePlans = s.clients.filter(c => c.carePlan === 'Overdue' && s.inBranch(c.branch))
  const refs = s.referrals.filter(r => s.inBranch(r.branch))
  const team = s.users.filter(u => u.status !== 'Switched off' && u.id !== 'u0' && s.inBranch(u.branch)).slice(0, 5)

  const coverage = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(i - 6)
    const day = visits.filter(v => v.date === d)
    return { d, covered: day.filter(v => v.caregiverId).length, open: day.filter(v => !v.caregiverId).length }
  }), [visits])
  const covTotal = coverage.reduce((a, c) => a + c.covered + c.open, 0)
  const covPct = covTotal ? Math.round(coverage.reduce((a, c) => a + c.covered, 0) / covTotal * 100) : 100
  const maxBar = Math.max(1, ...coverage.map(c => c.covered + c.open))

  type Q = { icon: typeof TriangleAlert; tone: ChipTone; title: string; sub: string; chip: string; action: string; to: string }
  const queue: Q[] = [
    ...(tomorrowOpen.length ? [{ icon: TriangleAlert, tone: 'danger' as const, title: `${tomorrowOpen.length} visit${tomorrowOpen.length > 1 ? 's' : ''} tomorrow ${tomorrowOpen.length > 1 ? 'have' : 'has'} no caregiver`, sub: `${s.branchName(s.branch)} · Owner: Care Coordinators`, chip: 'Unassigned', action: 'Find caregiver', to: '/schedule?show=open' }] : []),
    ...(waiting.length ? [{ icon: ClipboardCheck, tone: 'warning' as const, title: `${waiting.length} visit${waiting.length > 1 ? 's' : ''} waiting for approval`, sub: 'Owner: Care Supervisors · oldest ' + fmtDate(waiting.map(w => w.date).sort()[0]), chip: 'Waiting', action: 'Open queue', to: '/approvals' }] : []),
    ...blocked.map(c => ({ icon: UserX, tone: 'danger' as const, title: `${c.name}: ${c.issue?.toLowerCase()}`, sub: 'Caregiver · Owner: Lena Ortiz (HR) · can’t be given visits', chip: 'Not ready', action: 'View rule', to: '/rules' })),
    ...overduePlans.map(c => ({ icon: FileText, tone: 'warning' as const, title: `Care plan review overdue: ${c.name}`, sub: `Client · Owner: ${c.coordinator}`, chip: 'Overdue', action: 'Open client', to: `/clients?open=${c.id}` })),
  ]

  const exportDash = () => {
    downloadCsv(`corliva-dashboard-${TODAY}.csv`, ['Measure', 'Value'], [
      ['Visits today', today.length], ['Completed', count('Completed')], ['In progress', count('In progress')], ['Scheduled', count('Scheduled')], ['Unassigned', count('Unassigned')], ['Cancelled', count('Cancelled')],
      ['Visits waiting for approval', waiting.length], ['Caregivers not ready', blocked.length], ['Active clients', activeClients.length], ['Open incidents', openInc.length],
      ['Visit coverage, last 7 days', covPct + '%'],
    ], [`${s.agency.name} — Dashboard summary`, `Date: ${fmtDate(TODAY, { day: 'numeric', month: 'long', year: 'numeric' })}`, `Branch: ${s.branchName(s.branch)}`])
    s.toast('Report downloaded')
  }

  return (
    <>
      <PageHead title="Agency Dashboard" crumb="Dashboard" actions={<>
        <Button variant="secondary" icon={Download} onClick={exportDash}>Download report</Button>
        <Button icon={UserPlus} onClick={() => setInvite(true)}>Invite a person</Button>
      </>} />

      <section className="hero">
        <div className="t-display" style={{ fontSize: 24 }}>{greet}, {s.me.name.split(' ')[0]}</div>
        <div style={{ opacity: .92, marginTop: 4 }}>Here is how {s.agency.name} is doing today.</div>
        {tomorrowOpen.length > 0
          ? <button className="hero-note" onClick={() => nav('/schedule?show=open')}><TriangleAlert size={15} />Notice: {tomorrowOpen.length} visit{tomorrowOpen.length > 1 ? 's' : ''} tomorrow still {tomorrowOpen.length > 1 ? 'have' : 'has'} no caregiver.</button>
          : <span className="hero-note"><CheckCircle2 size={15} />Every visit tomorrow has a caregiver.</span>}
        <img src="./images/corliva-symbol-light.svg" alt="" aria-hidden />
      </section>

      <div className="grid g-4">
        <StatTile icon={CalendarDays} tone="info" label="Visits today" value={today.length} foot={`${today.filter(v => v.caregiverId).length} assigned · ${count('Unassigned')} unassigned`} chip={count('Unassigned') ? { tone: 'warning', text: 'Needs cover' } : { tone: 'info', text: 'On track' }} onClick={() => nav('/schedule')} />
        <StatTile icon={ClipboardCheck} tone="warning" label="Waiting for approval" value={waiting.length} foot="Submitted visits to review" chip={waiting.length ? { tone: 'warning', text: 'Review' } : { tone: 'success', text: 'All done' }} onClick={() => nav('/approvals')} />
        <StatTile icon={UserX} tone="danger" label="Caregivers not ready" value={blocked.length} foot="Blocking documents" chip={blocked.length ? { tone: 'danger', text: 'Action needed' } : { tone: 'success', text: 'All ready' }} onClick={() => nav('/rules')} />
        <StatTile icon={Home} tone="success" label="Active clients" value={activeClients.length} foot={`${s.clients.filter(c => c.status === 'On hold' && s.inBranch(c.branch)).length} on hold`} chip={{ tone: 'success', text: 'Active' }} onClick={() => nav('/clients')} />
      </div>

      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <div className="col" style={{ gap: 16 }}>
          <div className="grid g-2">
            <div className="card">
              <CardHead title="Today’s visits" action={<span className="t-caption t-muted">Total {today.length}</span>} />
              <div className="card-body row" style={{ gap: 20 }}>
                <Donut data={[
                  { v: count('Completed'), c: 'var(--status-success)' }, { v: count('In progress'), c: 'var(--blue-600)' }, { v: count('Scheduled'), c: '#22B5F4' },
                  { v: count('Unassigned'), c: 'var(--status-danger)' }, { v: count('Cancelled'), c: '#C9D3E3' },
                ]} total={today.length} />
                <div className="col grow" style={{ gap: 9 }}>
                  {[['Completed', 'var(--status-success)'], ['In progress', 'var(--blue-600)'], ['Scheduled', '#22B5F4'], ['Unassigned', 'var(--status-danger)'], ['Cancelled', '#C9D3E3']].map(([k, c]) => (
                    <button key={k} className="row between link-btn" style={{ color: 'var(--text-primary)', fontWeight: 400, fontSize: 12 }} onClick={() => nav('/schedule')}>
                      <span className="row" style={{ gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: c }} />{k}</span><b>{count(k)}</b>
                    </button>))}
                </div>
              </div>
            </div>
            <div className="card">
              <CardHead title="Visit coverage · last 7 days" action={<Chip tone={covPct >= 95 ? 'success' : 'warning'}>{covPct}% covered</Chip>} />
              <div className="card-body">
                <div className="row" style={{ alignItems: 'flex-end', height: 120, gap: 10 }} role="img" aria-label={`Coverage ${covPct} percent over the last 7 days`}>
                  {coverage.map(c => (
                    <div key={c.d} className="col grow" style={{ gap: 4, alignItems: 'center' }} title={`${fmtDate(c.d)}: ${c.covered} covered, ${c.open} no caregiver`}>
                      <div style={{ width: '100%', maxWidth: 24, height: 110, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        {c.open > 0 && <div style={{ height: c.open / maxBar * 110, background: 'var(--status-danger)', borderRadius: '4px 4px 0 0' }} />}
                        <div style={{ height: c.covered / maxBar * 110, background: c.d === TODAY ? 'var(--blue-600)' : '#7FB5F2', borderRadius: c.open ? 0 : '4px 4px 0 0' }} />
                      </div>
                    </div>))}
                </div>
                <div className="row" style={{ gap: 10, marginTop: 6 }}>{coverage.map(c => <span key={c.d} className="grow t-caption t-muted" style={{ textAlign: 'center', fontWeight: c.d === TODAY ? 700 : 400, color: c.d === TODAY ? 'var(--text-primary)' : undefined }}>{fmtDate(c.d, { weekday: 'short' })}</span>)}</div>
                <div className="row t-caption t-secondary" style={{ gap: 14, marginTop: 10 }}>
                  <span className="row" style={{ gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#7FB5F2' }} />Covered</span>
                  <span className="row" style={{ gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--status-danger)' }} />No caregiver</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <CardHead title="Priority work queue" sub="Things that need someone today. Each one shows who owns it." />
            <div className="card-body">
              {queue.length === 0 ? <div className="t-small t-muted">Nothing urgent right now.</div> : queue.slice(0, 5).map(q => (
                <div key={q.title} className="list-row">
                  <div className={`stat-icon tone-${q.tone}`} style={{ width: 34, height: 34 }}><q.icon size={16} /></div>
                  <div className="grow"><div className="t-medium">{q.title}</div><div className="t-caption t-muted">{q.sub}</div></div>
                  <Chip tone={q.tone}>{q.chip}</Chip>
                  <Button size="sm" onClick={() => nav(q.to)}>{q.action}</Button>
                </div>))}
            </div>
          </div>

          <div className="card">
            <CardHead title="Referral pipeline" action={<button className="link-btn" onClick={() => nav('/referrals')}>Open referrals</button>} />
            <div className="card-body grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 10 }}>
              {STAGES.map(st => {
                const list = refs.filter(r => r.stage === st.s)
                const sub = st.s === 'Enquiry' ? `New this week: ${list.length}` : st.s === 'Qualification' ? `No owner: ${list.filter(r => r.owner === 'Unassigned').length}` : st.s === 'Assessment' ? `Booked: ${list.length}` : st.s === 'Decision' ? `Over 3 days: ${list.filter(r => daysInStage(r) > 3).length}` : 'This month'
                return (
                  <button key={st.s} className="card card-pad col" style={{ gap: 6, background: 'var(--bg-subtle)', textAlign: 'left' }} onClick={() => nav(`/referrals?stage=${st.s}`)}>
                    <Chip tone={st.tone}>{st.s}</Chip><span className="t-kpi" style={{ fontSize: 24 }}>{list.length}</span><span className="t-caption t-muted">{sub}</span>
                  </button>)
              })}
            </div>
          </div>

          <div className="card">
            <CardHead title="Team members" action={<button className="link-btn" onClick={() => nav('/users')}>View all</button>} />
            <div className="table-wrap"><table className="tbl">
              <thead><tr><th>Name</th><th>Role</th><th>Branch</th><th>Status</th><th>Last active</th></tr></thead>
              <tbody>{team.map(u => (
                <tr key={u.id} className="clickable" onClick={() => nav(`/users?open=${u.id}`)}>
                  <td><span className="row"><Avatar name={u.name} />{u.name}</span></td><td>{u.role}</td><td>{s.branchName(u.branch).replace(' Branch', '')}</td>
                  <td><Chip tone={u.status === 'Active' ? 'success' : 'info'}>{u.status}</Chip></td><td className="t-muted">{u.lastActive}</td>
                </tr>))}</tbody>
            </table></div>
          </div>
        </div>

        <div className="col" style={{ gap: 16 }}>
          <ScheduleCard />
          <div className="card">
            <CardHead title="Caregiver readiness" action={<span className="t-caption t-muted">{cgs.length} caregivers</span>} />
            <div className="card-body col" style={{ gap: 14 }}>
              {([['Ready to work', 'Ready', 'var(--status-success)'], ['Ready with a warning', 'Warning', 'var(--status-warning)'], ['Not ready (blocked)', 'Blocked', 'var(--status-danger)']] as const).map(([label, k, c]) => {
                const n = cgs.filter(x => x.readiness === k).length
                return <div key={k}><div className="row between t-small" style={{ marginBottom: 6 }}><span>{label}</span><b>{n}</b></div><div className="bar"><span style={{ width: `${cgs.length ? n / cgs.length * 100 : 0}%`, background: c }} /></div></div>
              })}
              <div className="hint">Blocked caregivers can’t be given visits until HR verifies their documents.</div>
            </div>
          </div>
          <div className="card">
            <CardHead title="Recent activity" action={<button className="link-btn" onClick={() => nav('/audit')}>Audit history</button>} />
            <div className="card-body timeline">
              {s.audit.slice(0, 5).map(a => {
                const Icon = a.type === 'Visit' ? ClipboardCheck : a.type === 'Referral' ? UserPlus : a.type === 'Access' ? Users : a.type === 'Schedule' ? Clock : a.type === 'Settings' ? ShieldCheck : History
                return <div key={a.id} className="timeline-item"><div className="stat-icon tone-success"><Icon /></div><div><div className="t-small"><b>{a.actor === s.me.name ? 'You' : a.actor}</b> {a.action.charAt(0).toLowerCase() + a.action.slice(1)}{a.reason ? ', with a reason' : ''}</div><div className="t-caption t-muted">{a.record} · {a.at}</div></div></div>
              })}
            </div>
          </div>
        </div>
      </div>
      {invite && <InviteModal onClose={() => setInvite(false)} />}
    </>
  )
}

function Donut({ data, total }: { data: { v: number; c: string }[]; total: number }) {
  const r = 44, C = 2 * Math.PI * r
  let off = 0
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`${total} visits today`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--status-neutral-soft)" strokeWidth="14" />
      {total > 0 && data.filter(d => d.v > 0).map((d, i) => {
        const len = d.v / total * C
        const el = <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={d.c} strokeWidth="14" strokeDasharray={`${Math.max(len - 2, 0.5)} ${C}`} strokeDashoffset={-off} transform="rotate(-90 60 60)" />
        off += len
        return el
      })}
      <text x="60" y="60" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--text-primary)">{total}</text>
      <text x="60" y="78" textAnchor="middle" fontSize="11" fill="var(--text-muted)">visits</text>
    </svg>
  )
}

function ScheduleCard() {
  const s = useStore()
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [sel, setSel] = useState(TODAY)
  const [adding, setAdding] = useState(false)
  const first = month.getDay()
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysIn }, (_, i) => iso(new Date(month.getFullYear(), month.getMonth(), i + 1)))]
  const upcoming = s.events.filter(e => e.date >= sel).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3)
  return (
    <div className="card">
      <CardHead title="Schedule" action={<button className="link-btn" onClick={() => setAdding(true)}>Add event</button>} />
      <div className="card-body">
        <div className="row between" style={{ marginBottom: 10 }}>
          <span className="t-strong">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <span className="row" style={{ gap: 4 }}>
            <button className="icon-btn" style={{ width: 28, height: 28, border: 0 }} aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
            <button className="icon-btn" style={{ width: 28, height: 28, border: 0 }} aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
          </span>
        </div>
        <div className="cal">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="dow">{d}</div>)}
          {cells.map((d, i) => d ? (
            <button key={d} className={`${d === sel ? 'sel' : ''} ${d === TODAY ? 'today' : ''}`} onClick={() => setSel(d)} aria-label={fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}>
              {Number(d.slice(8))}{s.events.some(e => e.date === d) && <span className="ev" />}
            </button>) : <span key={'x' + i} />)}
        </div>
        <div className="t-strong" style={{ margin: '16px 0 10px' }}>{sel === TODAY ? 'Upcoming' : `From ${fmtDate(sel)}`}</div>
        <div className="col" style={{ gap: 8 }}>
          {upcoming.length === 0 ? <div className="t-small t-muted">No events from this day. Use “Add event” to plan one.</div> : upcoming.map(e => (
            <div key={e.id} className="event" style={{ borderLeftColor: `var(--status-${e.tone})` }}>
              <div className="t-medium">{e.title}</div>
              <div className="t-caption t-muted row" style={{ gap: 4 }}><Clock size={12} />{fmtDate(e.date)} · {e.time} · {e.note}</div>
            </div>))}
        </div>
      </div>
      {adding && <AddEvent date={sel} onClose={() => setAdding(false)} />}
    </div>
  )
}

function AddEvent({ date, onClose }: { date: string; onClose: () => void }) {
  const s = useStore()
  const [f, setF] = useState({ title: '', date, time: '09:00', note: 'All office staff' })
  const [tried, setTried] = useState(false)
  const save = () => {
    setTried(true); if (!f.title.trim() || !f.date) return
    const [h, m] = f.time.split(':').map(Number)
    s.setEvents(e => [...e, { id: 'e' + Date.now(), title: f.title.trim(), date: f.date, time: `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`, note: f.note, tone: 'info' }])
    s.toast('Event added to the agency calendar'); onClose()
  }
  return (
    <Modal title="Add an agency event" sub="Office events like meetings or training days. Visits are planned in Schedule." onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={Plus} onClick={save}>Add event</Button></>}>
      <Field label="What is it?" required error={tried && !f.title.trim() ? 'Please give the event a name.' : undefined}><Input autoFocus value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="For example: Staff meeting" error={tried && !f.title.trim()} /></Field>
      <div className="grid g-2">
        <Field label="Date" required><Input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Time"><Input type="time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /></Field>
      </div>
      <Field label="Who is it for?"><Select value={f.note} onChange={e => setF({ ...f, note: e.target.value })} options={['All office staff', 'All branches', ...s.branches.map(b => b.name), 'Caregivers']} /></Field>
    </Modal>
  )
}
