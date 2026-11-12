import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Download, PauseCircle, PlayCircle, UserRound, Phone, MapPin, Users, CalendarDays, Home } from 'lucide-react'
import { useStore, fmtDate, downloadCsv } from '../data/store'
import { Client, TODAY } from '../data/seed'
import { AlertBanner, Avatar, Button, Chip, ChipTone, Drawer, EmptyState, Field, Modal, PageHead, Pager, Select, Textarea, usePaged } from '../components/ui'

const stTone = (s: Client['status']): ChipTone => s === 'Active' ? 'success' : s === 'On hold' ? 'warning' : 'neutral'
const planTone = (p: Client['carePlan']): ChipTone => p === 'Up to date' ? 'success' : p === 'Review due' ? 'warning' : 'danger'

export default function Clients() {
  const s = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('Active')
  const [plan, setPlan] = useState('Any care plan')
  const [openId, setOpenId] = useState<string | null>(params.get('open'))
  useEffect(() => { const o = params.get('open'); if (o) { setOpenId(o); setStatus('All statuses') } }, [params])

  const nextVisit = (c: Client) => s.visits.filter(v => v.clientId === c.id && v.date >= TODAY && !['Cancelled', 'Completed'].includes(v.status)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
  const rows = useMemo(() => s.clients.filter(c => s.inBranch(c.branch) &&
    (status === 'All statuses' || c.status === status) && (plan === 'Any care plan' || c.carePlan === plan) &&
    (!q.trim() || c.name.toLowerCase().includes(q.trim().toLowerCase()))), [s.clients, s.branch, status, plan, q])
  const pg = usePaged(rows, 8)
  const open = s.clients.find(c => c.id === openId)
  const counts = (st: string) => s.clients.filter(c => s.inBranch(c.branch) && c.status === st).length

  const exp = () => {
    downloadCsv(`corliva-clients-${TODAY}.csv`, ['Name', 'Branch', 'Status', 'Coordinator', 'Services', 'Care plan', 'Client since'], rows.map(c => [c.name, s.branchName(c.branch), c.status, c.coordinator, c.services, c.carePlan, c.since]), [`${s.agency.name} — Clients`, `Branch: ${s.branchName(s.branch)}`, `Filters: ${status}, ${plan}`, `Downloaded: ${fmtDate(TODAY, { day: 'numeric', month: 'long', year: 'numeric' })}`])
    s.toast('Client list downloaded')
  }

  return (
    <>
      <PageHead title="Clients" crumb="Clients" sub="Everyone your agency cares for. Care Coordinators keep the details up to date." actions={<Button variant="secondary" icon={Download} onClick={exp}>Download list</Button>} />
      <div className="grid g-4">
        {(['Active', 'On hold', 'Discharged'] as const).map(st => (
          <button key={st} className="card stat" onClick={() => { setStatus(st); pg.setPage(1) }} style={{ borderColor: status === st ? 'var(--border-focus)' : undefined }}>
            <div className="t-small t-secondary">{st}</div><div className="t-kpi">{counts(st)}</div></button>))}
        <button className="card stat" onClick={() => { setPlan('Overdue'); setStatus('All statuses') }} style={{ borderColor: plan === 'Overdue' ? 'var(--border-focus)' : undefined }}>
          <div className="t-small t-secondary">Care plan overdue</div><div className="t-kpi" style={{ color: 'var(--status-danger)' }}>{s.clients.filter(c => s.inBranch(c.branch) && c.carePlan === 'Overdue').length}</div></button>
      </div>
      <div className="card">
        <div className="toolbar">
          <div className="search"><Search /><input aria-label="Search clients" placeholder="Search by name" value={q} onChange={e => { setQ(e.target.value); pg.setPage(1) }} /></div>
          <select className="select-sm" aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}>{['All statuses', 'Active', 'On hold', 'Discharged'].map(o => <option key={o}>{o}</option>)}</select>
          <select className="select-sm" aria-label="Filter by care plan" value={plan} onChange={e => setPlan(e.target.value)}>{['Any care plan', 'Up to date', 'Review due', 'Overdue'].map(o => <option key={o}>{o}</option>)}</select>
          <span className="grow" /><span className="t-caption t-muted">{rows.length} client{rows.length === 1 ? '' : 's'}</span>
        </div>
        {rows.length === 0 ? <EmptyState icon={Home} tone="neutral" title="No clients match" text="Try a different name or clear the filters." action={<Button variant="secondary" onClick={() => { setQ(''); setStatus('All statuses'); setPlan('Any care plan') }}>Clear filters</Button>} /> : <>
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Client</th><th>Branch</th><th>Coordinator</th><th>Services</th><th>Next visit</th><th>Care plan</th><th>Status</th></tr></thead>
            <tbody>{pg.slice.map(c => { const n = nextVisit(c); return (
              <tr key={c.id} className="clickable" onClick={() => setOpenId(c.id)}>
                <td><span className="row"><Avatar name={c.name} /><span><span className="t-medium" style={{ display: 'block' }}>{c.name}</span><span className="t-caption t-muted">Since {c.since}</span></span></span></td>
                <td>{s.branchName(c.branch)}</td><td>{c.coordinator}</td><td>{c.services}</td>
                <td>{n ? <>{n.date === TODAY ? 'Today' : fmtDate(n.date)} {n.start}{!n.caregiverId && <div className="t-caption" style={{ color: 'var(--status-danger)' }}>No caregiver yet</div>}</> : <span className="t-muted">—</span>}</td>
                <td><Chip tone={planTone(c.carePlan)}>{c.carePlan}</Chip></td><td><Chip tone={stTone(c.status)}>{c.status}</Chip></td>
              </tr>) })}</tbody>
          </table></div>
          <Pager {...pg} onPage={pg.setPage} />
        </>}
      </div>
      {open && <ClientDrawer c={open} onClose={() => { setOpenId(null); if (params.get('open')) setParams({}) }} />}
    </>
  )
}

function ClientDrawer({ c, onClose }: { c: Client; onClose: () => void }) {
  const s = useStore()
  const nav = useNavigate()
  const [act, setAct] = useState<'hold' | 'coord' | null>(null)
  const upcoming = s.visits.filter(v => v.clientId === c.id && v.date >= TODAY && v.status !== 'Cancelled' && v.status !== 'Completed').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 5)
  const cg = (id: string | null) => s.caregivers.find(g => g.id === id)?.name
  return (
    <Drawer title={<span className="row"><Avatar name={c.name} size="lg" />{c.name}</span>} sub={<span className="row" style={{ gap: 8 }}><Chip tone={stTone(c.status)}>{c.status}</Chip>{s.branchName(c.branch)}</span>} onClose={onClose} footer={c.status === 'Discharged' ? <Button variant="secondary" onClick={onClose}>Close</Button> : <>
      <Button variant="secondary" icon={UserRound} onClick={() => setAct('coord')}>Change coordinator</Button>
      <Button variant={c.status === 'On hold' ? 'primary' : 'danger'} icon={c.status === 'On hold' ? PlayCircle : PauseCircle} onClick={() => setAct('hold')}>{c.status === 'On hold' ? 'Restart care' : 'Put on hold'}</Button>
    </>}>
      {c.carePlan !== 'Up to date' && c.status !== 'Discharged' && <AlertBanner tone={c.carePlan === 'Overdue' ? 'danger' : 'warning'} title={`Care plan ${c.carePlan.toLowerCase()}`}>{c.coordinator} and the Care Supervisor have been reminded.</AlertBanner>}
      {c.fromReferral && <AlertBanner tone="info" title={`Came from referral ${c.fromReferral}`} action={<button className="link-btn" onClick={() => nav(`/referrals?open=${c.fromReferral}`)}>Open</button>} />}
      <dl className="kv">
        <dt>Coordinator</dt><dd>{c.coordinator}</dd>
        <dt>Services</dt><dd>{c.services}</dd>
        <dt>Phone</dt><dd className="row" style={{ gap: 6 }}><Phone size={13} />{c.phone}</dd>
        <dt>Address</dt><dd className="row" style={{ gap: 6 }}><MapPin size={13} />{c.address}</dd>
        <dt>Family linked</dt><dd className="row" style={{ gap: 6 }}><Users size={13} />{c.family}</dd>
        <dt>Client since</dt><dd>{c.since}</dd>
      </dl>
      <div className="divider" />
      <div>
        <div className="row between" style={{ marginBottom: 10 }}><span className="t-h3">Upcoming visits</span><button className="link-btn" onClick={() => nav(`/schedule?client=${c.id}`)}>Open in Schedule</button></div>
        {upcoming.length === 0 ? <div className="t-small t-muted">No visits planned.</div> : upcoming.map(v => (
          <div key={v.id} className="list-row"><CalendarDays size={16} color="var(--text-muted)" /><div className="grow"><div className="t-medium t-small">{v.date === TODAY ? 'Today' : fmtDate(v.date)} · {v.start}–{v.end}</div><div className="t-caption t-muted">{v.service}</div></div>
            {v.caregiverId ? <span className="t-small">{cg(v.caregiverId)}</span> : <Chip tone="danger">No caregiver</Chip>}</div>))}
      </div>
      <div className="hint">Care notes and documents are managed by the Care Coordinator and Care Supervisor.</div>

      {act === 'hold' && <HoldModal c={c} onClose={() => setAct(null)} />}
      {act === 'coord' && <CoordModal c={c} onClose={() => setAct(null)} />}
    </Drawer>
  )
}

function HoldModal({ c, onClose }: { c: Client; onClose: () => void }) {
  const s = useStore()
  const restart = c.status === 'On hold'
  const [t, setT] = useState(''); const [tried, setTried] = useState(false)
  const bad = t.trim().length < 5
  const future = s.visits.filter(v => v.clientId === c.id && v.date >= TODAY && ['Scheduled', 'Unassigned'].includes(v.status))
  const save = () => {
    setTried(true); if (bad) return
    s.setClients(x => x.map(y => y.id === c.id ? { ...y, status: restart ? 'Active' : 'On hold' } : y))
    if (!restart) s.setVisits(x => x.map(v => future.some(f => f.id === v.id) ? { ...v, status: 'Cancelled', cancelReason: 'Client on hold' } : v))
    s.log({ type: 'Client', action: restart ? 'Restarted care for a client' : 'Put a client on hold', record: c.name, before: c.status, after: restart ? 'Active' : 'On hold', reason: t.trim() })
    s.toast(restart ? `${c.name}’s care restarted. Ask the coordinator to plan visits.` : `${c.name} is on hold`); onClose()
  }
  return <Modal title={restart ? `Restart care for ${c.name}?` : `Put ${c.name} on hold?`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant={restart ? 'primary' : 'danger-solid'} onClick={save}>{restart ? 'Restart care' : 'Put on hold'}</Button></>}>
    {!restart && future.length > 0 && <AlertBanner tone="warning" title={`${future.length} upcoming visit${future.length > 1 ? 's' : ''} will be cancelled`}>Caregivers and family are told. Past visits are not changed.</AlertBanner>}
    <Field label="Reason" required error={tried && bad ? 'Please write a short reason.' : undefined} helper="Saved in Audit History."><Textarea autoFocus value={t} onChange={e => setT(e.target.value)} placeholder={restart ? 'For example: home from hospital' : 'For example: in hospital from 12 Nov'} error={tried && bad} /></Field>
  </Modal>
}

function CoordModal({ c, onClose }: { c: Client; onClose: () => void }) {
  const s = useStore()
  const list = s.users.filter(u => u.role === 'Care Coordinator' && u.status === 'Active' && u.name !== c.coordinator).map(u => u.name)
  const [o, setO] = useState(list[0] ?? ''); const [t, setT] = useState(''); const [tried, setTried] = useState(false)
  const bad = t.trim().length < 5
  return <Modal title="Change coordinator" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!o} onClick={() => {
    setTried(true); if (bad) return
    s.setClients(x => x.map(y => y.id === c.id ? { ...y, coordinator: o } : y))
    s.log({ type: 'Client', action: 'Changed a client’s coordinator', record: c.name, before: c.coordinator, after: o, reason: t.trim() })
    s.toast(`${o} now coordinates ${c.name}’s care`); onClose()
  }}>Save</Button></>}>
    {list.length === 0 ? <AlertBanner tone="warning" title="No other active Care Coordinators">Invite one in Users & Roles first.</AlertBanner> : <>
      <Field label="New coordinator" required><Select value={o} onChange={e => setO(e.target.value)} options={list} /></Field>
      <Field label="Reason" required error={tried && bad ? 'Please write a short reason.' : undefined}><Textarea value={t} onChange={e => setT(e.target.value)} error={tried && bad} /></Field>
    </>}
  </Modal>
}
