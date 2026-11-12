import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, UserPlus, XCircle, Ban, TriangleAlert, CheckCircle2, LayoutGrid, List, Clock, MapPin, X } from 'lucide-react'
import { useStore, fmtDate } from '../data/store'
import { Visit, TODAY, iso } from '../data/seed'
import { AlertBanner, Avatar, Button, Chip, ChipTone, Drawer, EmptyState, Field, Modal, PageHead, Select, Textarea } from '../components/ui'

const vTone = (v: Visit): ChipTone => v.status === 'Completed' ? 'success' : v.status === 'Unassigned' ? 'danger' : v.status === 'Cancelled' ? 'neutral' : v.status === 'In progress' ? 'info' : 'info'
const cls = (v: Visit) => v.status === 'Cancelled' ? 'cancel' : v.status === 'Unassigned' ? 'open' : v.status === 'Completed' ? 'done' : v.override ? 'warn' : 'ok'
const mondayOf = (d: Date) => { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x }

export default function Schedule() {
  const s = useStore()
  const [params, setParams] = useSearchParams()
  const [week, setWeek] = useState(() => mondayOf(new Date()))
  const [view, setView] = useState<'board' | 'list'>('board')
  const [show, setShow] = useState(params.get('show') === 'open' ? 'Needs a caregiver' : 'All visits')
  const [cgFilter, setCgFilter] = useState(params.get('caregiver') ?? 'all')
  const [clientFilter, setClientFilter] = useState(params.get('client') ?? 'all')
  const [openId, setOpenId] = useState<string | null>(params.get('visit'))
  useEffect(() => {
    if (params.get('show') === 'open') setShow('Needs a caregiver')
    if (params.get('caregiver')) setCgFilter(params.get('caregiver')!)
    if (params.get('client')) setClientFilter(params.get('client')!)
    if (params.get('visit')) { const v = s.visits.find(x => x.id === params.get('visit')); if (v) { setOpenId(v.id); setWeek(mondayOf(new Date(v.date + 'T12:00'))) } }
  }, [params])

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(week); d.setDate(d.getDate() + i); return iso(d) })
  const vis = useMemo(() => s.visits.filter(v => s.inBranch(v.branch) && days.includes(v.date) &&
    (show === 'All visits' || (show === 'Needs a caregiver' ? v.status === 'Unassigned' : v.status !== 'Cancelled')) &&
    (cgFilter === 'all' || v.caregiverId === cgFilter) && (clientFilter === 'all' || v.clientId === clientFilter)), [s.visits, s.branch, days.join(), show, cgFilter, clientFilter])
  const cgs = s.caregivers.filter(c => s.inBranch(c.branch) && (cgFilter === 'all' || c.id === cgFilter))
  const client = (id: string) => s.clients.find(c => c.id === id)?.name ?? ''
  const open = s.visits.find(v => v.id === openId)
  const openCount = s.visits.filter(v => s.inBranch(v.branch) && v.status === 'Unassigned' && v.date >= TODAY).length
  const clearUrl = () => { if ([...params.keys()].length) setParams({}) }
  const Shift = ({ v }: { v: Visit }) => (
    <button className={`shift ${cls(v)}`} onClick={() => setOpenId(v.id)} title={`${client(v.clientId)} ${v.start}–${v.end}`}>
      <b>{v.start}</b> {client(v.clientId)}<div className="t-caption" style={{ opacity: .8 }}>{v.service}</div>
    </button>)

  return (
    <>
      <PageHead title="Schedule" crumb="Schedule" sub={`All times in ${s.agency.timezone.split(' (')[1]?.replace(')', '') ?? 'agency time'}. Care Coordinators plan visits; you can step in when needed.`} />
      {openCount > 0 && show !== 'Needs a caregiver' && <AlertBanner tone="danger" title={`${openCount} upcoming visit${openCount > 1 ? 's' : ''} still need${openCount > 1 ? '' : 's'} a caregiver`} action={<Button size="sm" variant="secondary" onClick={() => setShow('Needs a caregiver')}>Show only these</Button>} />}
      <div className="card">
        <div className="toolbar">
          <div className="row" style={{ gap: 6 }}>
            <button className="icon-btn" aria-label="Previous week" onClick={() => { const d = new Date(week); d.setDate(d.getDate() - 7); setWeek(d) }}><ChevronLeft size={16} /></button>
            <Button size="sm" variant="secondary" onClick={() => setWeek(mondayOf(new Date()))}>This week</Button>
            <button className="icon-btn" aria-label="Next week" onClick={() => { const d = new Date(week); d.setDate(d.getDate() + 7); setWeek(d) }}><ChevronRight size={16} /></button>
            <span className="t-strong" style={{ marginLeft: 6 }}>{fmtDate(days[0], { day: 'numeric', month: 'short' })} – {fmtDate(days[6], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <span className="grow" />
          <select className="select-sm" aria-label="Which visits" value={show} onChange={e => setShow(e.target.value)}>{['All visits', 'Needs a caregiver', 'Hide cancelled'].map(o => <option key={o}>{o}</option>)}</select>
          <select className="select-sm" aria-label="Caregiver" value={cgFilter} onChange={e => { setCgFilter(e.target.value); clearUrl() }}><option value="all">All caregivers</option>{s.caregivers.filter(c => s.inBranch(c.branch)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select className="select-sm" aria-label="Client" value={clientFilter} onChange={e => { setClientFilter(e.target.value); clearUrl() }}><option value="all">All clients</option>{s.clients.filter(c => s.inBranch(c.branch) && c.status !== 'Discharged').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          {(cgFilter !== 'all' || clientFilter !== 'all' || show !== 'All visits') && <Button size="sm" variant="ghost" icon={X} onClick={() => { setCgFilter('all'); setClientFilter('all'); setShow('All visits'); clearUrl() }}>Clear</Button>}
          <div className="seg" role="group" aria-label="View">
            <button className={view === 'board' ? 'on' : ''} onClick={() => setView('board')}><LayoutGrid size={14} style={{ verticalAlign: -2 }} /> Week</button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><List size={14} style={{ verticalAlign: -2 }} /> List</button>
          </div>
        </div>
        <div className="row t-caption t-secondary" style={{ gap: 16, padding: '10px 16px', borderBottom: '1px solid var(--border-default)' }}>
          {[['ok', 'Planned'], ['done', 'Completed'], ['open', 'No caregiver'], ['warn', 'Allowed by override'], ['cancel', 'Cancelled']].map(([c, l]) => <span key={c} className="row" style={{ gap: 6 }}><span className={`shift ${c}`} style={{ width: 14, height: 10, padding: 0, margin: 0 }} />{l}</span>)}
        </div>
        {vis.length === 0 ? <EmptyState icon={CheckCircle2} title={show === 'Needs a caregiver' ? 'Every visit has a caregiver' : 'No visits this week'} text={show === 'Needs a caregiver' ? 'Nothing needs cover for this week and these filters.' : 'Try another week or clear the filters.'} />
          : view === 'board' ? (
            <div className="table-wrap"><div className="board">
              <div className="bh">Caregiver</div>
              {days.map(d => <div key={d} className={`bh ${d === TODAY ? 'today' : ''}`}>{fmtDate(d, { weekday: 'short', day: 'numeric' })}{d === TODAY && ' · Today'}</div>)}
              {cgFilter === 'all' && <>
                <div style={{ background: 'var(--status-danger-soft)' }}><div className="t-strong" style={{ color: 'var(--status-danger)' }}>No caregiver yet</div><div className="t-caption t-muted">{vis.filter(v => !v.caregiverId && v.status !== 'Cancelled').length} visits</div></div>
                {days.map(d => <div key={d}>{vis.filter(v => v.date === d && !v.caregiverId).map(v => <Shift key={v.id} v={v} />)}</div>)}
              </>}
              {show !== 'Needs a caregiver' && cgs.map(c => (
                <FragmentRow key={c.id}>
                  <div><div className="row" style={{ gap: 8 }}><Avatar name={c.name} size="sm" /><span className="t-medium">{c.name}</span></div>
                    {c.readiness !== 'Ready' && <div className="t-caption" style={{ color: c.readiness === 'Blocked' ? 'var(--status-danger)' : 'var(--status-warning)', marginTop: 4 }}>{c.readiness === 'Blocked' ? 'Not ready' : 'Warning'}</div>}</div>
                  {days.map(d => <div key={d}>{vis.filter(v => v.date === d && v.caregiverId === c.id).map(v => <Shift key={v.id} v={v} />)}</div>)}
                </FragmentRow>))}
            </div></div>
          ) : (
            <div className="table-wrap"><table className="tbl">
              <thead><tr><th>Date</th><th>Time</th><th>Client</th><th>Service</th><th>Caregiver</th><th>Branch</th><th>Status</th></tr></thead>
              <tbody>{vis.slice().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).map(v => (
                <tr key={v.id} className="clickable" onClick={() => setOpenId(v.id)}>
                  <td>{v.date === TODAY ? 'Today' : fmtDate(v.date)}</td><td>{v.start}–{v.end}</td><td className="t-medium">{client(v.clientId)}</td><td>{v.service}</td>
                  <td>{v.caregiverId ? s.caregivers.find(c => c.id === v.caregiverId)?.name : <span style={{ color: 'var(--status-danger)' }}>None yet</span>}</td>
                  <td>{s.branchName(v.branch)}</td><td><Chip tone={vTone(v)}>{v.status}</Chip></td>
                </tr>))}</tbody>
            </table></div>
          )}
      </div>
      {open && <VisitDrawer v={open} onClose={() => { setOpenId(null); if (params.get('visit')) setParams({}) }} />}
    </>
  )
}

function FragmentRow({ children }: { children: React.ReactNode }) { return <>{children}</> }

function VisitDrawer({ v, onClose }: { v: Visit; onClose: () => void }) {
  const s = useStore()
  const [act, setAct] = useState<'assign' | 'cancel' | null>(null)
  const c = s.clients.find(x => x.id === v.clientId)!
  const cg = s.caregivers.find(x => x.id === v.caregiverId)
  const editable = v.date >= TODAY && ['Scheduled', 'Unassigned'].includes(v.status)
  const history = s.audit.filter(a => a.record.includes('#' + v.id.slice(1)))
  return (
    <Drawer title={`Visit #${v.id.slice(1)}`} sub={<span className="row" style={{ gap: 8 }}><Chip tone={vTone(v)}>{v.status}</Chip>{v.date === TODAY ? 'Today' : fmtDate(v.date, { weekday: 'long', day: 'numeric', month: 'long' })}</span>} onClose={onClose} footer={editable ? <>
      <Button variant="danger" icon={XCircle} onClick={() => setAct('cancel')}>Cancel visit</Button>
      <Button icon={UserPlus} onClick={() => setAct('assign')}>{v.caregiverId ? 'Change caregiver' : 'Assign caregiver'}</Button>
    </> : <Button variant="secondary" onClick={onClose}>Close</Button>}>
      {v.status === 'Unassigned' && <AlertBanner tone="danger" title="This visit has no caregiver">Assign someone, or the client will be missed.</AlertBanner>}
      {!editable && v.status !== 'Unassigned' && <AlertBanner tone="info" title={v.status === 'Cancelled' ? 'This visit was cancelled' : v.status === 'Completed' ? 'This visit is finished' : 'This visit has started'}>{v.cancelReason ? `Reason: ${v.cancelReason}. ` : ''}It can’t be changed here. Corrections go through Visit Approvals.</AlertBanner>}
      {v.override && <AlertBanner tone="warning" title="Allowed by override">{v.override}</AlertBanner>}
      <dl className="kv">
        <dt>Client</dt><dd>{c.name}</dd>
        <dt>Time</dt><dd className="row" style={{ gap: 6 }}><Clock size={13} />{v.start} – {v.end}</dd>
        <dt>Service</dt><dd>{v.service}</dd>
        <dt>Address</dt><dd className="row" style={{ gap: 6 }}><MapPin size={13} />{c.address}</dd>
        <dt>Branch</dt><dd>{s.branchName(v.branch)}</dd>
        <dt>Caregiver</dt><dd>{cg ? <span className="row" style={{ gap: 8 }}><Avatar name={cg.name} size="sm" />{cg.name}</span> : <span style={{ color: 'var(--status-danger)' }}>Not assigned</span>}</dd>
        <dt>Coordinator</dt><dd>{c.coordinator}</dd>
      </dl>
      {history.length > 0 && <><div className="divider" /><div><div className="t-h3" style={{ marginBottom: 8 }}>Changes</div>{history.map(h => <div key={h.id} className="t-small" style={{ marginBottom: 8 }}><b>{h.action}</b> by {h.actor} · <span className="t-muted">{h.at}</span>{h.reason && <div className="t-caption t-muted">Reason: {h.reason}</div>}</div>)}</div></>}
      {act === 'assign' && <AssignModal v={v} onClose={() => setAct(null)} />}
      {act === 'cancel' && <CancelModal v={v} onClose={() => setAct(null)} />}
    </Drawer>
  )
}

function AssignModal({ v, onClose }: { v: Visit; onClose: () => void }) {
  const s = useStore()
  const [pick, setPick] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)
  const canOverride = s.rules.overrideAllowed && s.rules.overrideRoles.includes('Agency Admin')
  const overlap = (gid: string) => s.visits.some(x => x.id !== v.id && x.caregiverId === gid && x.date === v.date && x.status !== 'Cancelled' && x.start < v.end && v.start < x.end)
  const options = s.caregivers.filter(g => g.branch === v.branch && g.id !== v.caregiverId).map(g => {
    const busy = overlap(g.id)
    const blocking = g.readiness === 'Blocked' ? g.issue! : busy ? 'Already has a visit at this time' : ''
    const warning = g.readiness === 'Warning' ? g.issue! : ''
    return { g, blocking, warning }
  }).sort((a, b) => Number(!!a.blocking) - Number(!!b.blocking))
  const chosen = options.find(o => o.g.id === pick)
  const needsOverride = !!chosen?.blocking && !chosen.blocking.startsWith('Already')
  const save = () => {
    setTried(true)
    if (!chosen || (chosen.blocking && !needsOverride)) return
    if (needsOverride && (!canOverride || reason.trim().length < 5)) return
    const note = needsOverride ? `${chosen.g.name} assigned by override: ${chosen.blocking}. Reason: ${reason.trim()}` : undefined
    s.setVisits(x => x.map(y => y.id === v.id ? { ...y, caregiverId: chosen.g.id, status: 'Scheduled', override: note } : y))
    s.log({ type: 'Schedule', action: needsOverride ? 'Override on a visit' : v.caregiverId ? 'Reassigned a visit' : 'Assigned a visit', record: `Visit #${v.id.slice(1)}`, before: v.caregiverId ? s.caregivers.find(c => c.id === v.caregiverId)?.name : 'No caregiver', after: chosen.g.name, reason: needsOverride ? reason.trim() : undefined })
    s.toast(`${chosen.g.name} is now on this visit. They’ve been told.`); onClose()
  }
  return (
    <Modal wide title="Choose a caregiver" sub={`${fmtDate(v.date)} · ${v.start}–${v.end} · ${v.service}`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!chosen || (!!chosen.blocking && !needsOverride) || (needsOverride && !canOverride)} onClick={save}>{needsOverride ? 'Override and assign' : 'Assign'}</Button></>}>
      <div className="col" style={{ gap: 8 }}>
        {options.map(({ g, blocking, warning }) => (
          <button key={g.id} type="button" className="list-row" aria-pressed={pick === g.id} onClick={() => setPick(g.id)} style={{ marginTop: 0, textAlign: 'left', borderColor: pick === g.id ? 'var(--border-focus)' : undefined, background: pick === g.id ? 'var(--bg-selected)' : '#fff' }}>
            <Avatar name={g.name} />
            <span className="grow"><span className="t-medium" style={{ display: 'block' }}>{g.name}</span>
              {blocking ? <span className="row t-caption" style={{ gap: 4, color: 'var(--status-danger)' }}><Ban size={12} />{blocking}</span>
                : warning ? <span className="row t-caption" style={{ gap: 4, color: 'var(--status-warning)' }}><TriangleAlert size={12} />{warning}</span>
                  : <span className="row t-caption" style={{ gap: 4, color: 'var(--status-success)' }}><CheckCircle2 size={12} />Free and ready</span>}</span>
            <Chip tone={blocking ? 'danger' : warning ? 'warning' : 'success'}>{blocking ? 'Blocked' : warning ? 'Warning' : 'Ready'}</Chip>
          </button>))}
        {options.length === 0 && <div className="t-small t-muted">No other caregivers in this branch.</div>}
      </div>
      {chosen?.blocking && !needsOverride && <AlertBanner tone="danger" title="Can’t assign">{chosen.g.name} is already on another visit at this time.</AlertBanner>}
      {needsOverride && (canOverride ? <>
        <AlertBanner tone="warning" title="This needs an override">{chosen!.g.name}: {chosen!.blocking}. Only continue if there is no other option.</AlertBanner>
        <Field label="Reason for override" required error={tried && reason.trim().length < 5 ? 'Please explain why this is needed.' : undefined} helper="Saved in Audit History with your name."><Textarea value={reason} onChange={e => setReason(e.target.value)} error={tried && reason.trim().length < 5} /></Field>
      </> : <AlertBanner tone="danger" title="Overrides are switched off">Change this in Rules & Requirements → Overrides.</AlertBanner>)}
      {chosen?.warning && !chosen.blocking && <AlertBanner tone="warning" title="You can assign, but note:">{chosen.warning}</AlertBanner>}
    </Modal>
  )
}

function CancelModal({ v, onClose }: { v: Visit; onClose: () => void }) {
  const s = useStore()
  const reasons = s.lists.reasons.filter(r => r.active).map(r => r.name)
  const [reason, setReason] = useState(reasons[0] ?? '')
  const [scope, setScope] = useState<'one' | 'future'>('one')
  const [note, setNote] = useState('')
  const future = s.visits.filter(x => x.clientId === v.clientId && x.start === v.start && x.date >= v.date && ['Scheduled', 'Unassigned'].includes(x.status))
  const save = () => {
    const ids = scope === 'one' ? [v.id] : future.map(f => f.id)
    s.setVisits(x => x.map(y => ids.includes(y.id) ? { ...y, status: 'Cancelled', cancelReason: reason + (note.trim() ? ` — ${note.trim()}` : '') } : y))
    s.log({ type: 'Schedule', action: ids.length > 1 ? `Cancelled ${ids.length} visits` : 'Cancelled a visit', record: `Visit #${v.id.slice(1)}${ids.length > 1 ? ' and later repeats' : ''}`, reason: reason + (note.trim() ? ` — ${note.trim()}` : '') })
    s.toast(ids.length > 1 ? `${ids.length} visits cancelled` : 'Visit cancelled. Caregiver and family are told.'); onClose()
  }
  return (
    <Modal title="Cancel this visit?" sub="Finished visits are never changed." onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Keep visit</Button><Button variant="danger-solid" disabled={!reason} onClick={save}>Cancel visit</Button></>}>
      <Field label="Reason" required><Select value={reason} onChange={e => setReason(e.target.value)} options={reasons} /></Field>
      {future.length > 1 && <div className="field"><span className="label">Which visits?</span>
        <label className="check"><input type="radio" name="scope" checked={scope === 'one'} onChange={() => setScope('one')} />Just this one</label>
        <label className="check"><input type="radio" name="scope" checked={scope === 'future'} onChange={() => setScope('future')} />This and all later repeats ({future.length} visits)</label></div>}
      <Field label="Note" helper="Optional."><Textarea value={note} onChange={e => setNote(e.target.value)} /></Field>
    </Modal>
  )
}
