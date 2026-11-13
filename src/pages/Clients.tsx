import { useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Download, Home } from 'lucide-react'
import { useStore, fmtDate, downloadCsv } from '../data/store'
import { Client, TODAY } from '../data/seed'
import { Avatar, Button, Chip, ChipTone, EmptyState, PageHead, Pager, usePaged } from '../components/ui'

const stTone = (s: Client['status']): ChipTone => s === 'Active' ? 'success' : s === 'On hold' ? 'warning' : 'neutral'
const planTone = (p: Client['carePlan']): ChipTone => p === 'Up to date' ? 'success' : p === 'Review due' ? 'warning' : 'danger'

export default function Clients() {
  const s = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('Active')
  const [plan, setPlan] = useState('Any care plan')
  const nav = useNavigate()

  const nextVisit = (c: Client) => s.visits.filter(v => v.clientId === c.id && v.date >= TODAY && !['Cancelled', 'Completed'].includes(v.status)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
  const rows = useMemo(() => s.clients.filter(c => s.inBranch(c.branch) &&
    (status === 'All statuses' || c.status === status) && (plan === 'Any care plan' || c.carePlan === plan) &&
    (!q.trim() || c.name.toLowerCase().includes(q.trim().toLowerCase()))), [s.clients, s.branch, status, plan, q])
  const pg = usePaged(rows, 8)
  const counts = (st: string) => s.clients.filter(c => s.inBranch(c.branch) && c.status === st).length

  // Old links like /clients?open=c1 go straight to the client's screen
  const legacy = params.get('open')
  if (legacy) return <Navigate to={`/clients/${legacy}`} replace />

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
              <tr key={c.id} className="clickable" onClick={() => nav(`/clients/${c.id}`)}>
                <td><span className="row"><Avatar name={c.name} /><span><span className="t-medium" style={{ display: 'block' }}>{c.name}</span><span className="t-caption t-muted">Since {c.since}</span></span></span></td>
                <td>{s.branchName(c.branch)}</td><td>{c.coordinator}</td><td>{c.services}</td>
                <td>{n ? <>{n.date === TODAY ? 'Today' : fmtDate(n.date)} {n.start}{!n.caregiverId && <div className="t-caption" style={{ color: 'var(--status-danger)' }}>No caregiver yet</div>}</> : <span className="t-muted">—</span>}</td>
                <td><Chip tone={planTone(c.carePlan)}>{c.carePlan}</Chip></td><td><Chip tone={stTone(c.status)}>{c.status}</Chip></td>
              </tr>) })}</tbody>
          </table></div>
          <Pager {...pg} onPage={pg.setPage} />
        </>}
      </div>
    </>
  )
}
