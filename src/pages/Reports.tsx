import { useMemo, useState } from 'react'
import { Download, Info, UserPlus, CalendarCheck, Clock, Users, ShieldCheck, Receipt } from 'lucide-react'
import { useStore, fmtDate, downloadCsv } from '../data/store'
import { TODAY, addDays } from '../data/seed'
import { Button, CardHead, Chip, EmptyState, Field, Input, PageHead, Select } from '../components/ui'

const REPORTS = [
  { id: 'referrals', name: 'Referrals', icon: UserPlus, desc: 'New enquiries by stage and outcome.', basis: 'Counts every referral in the chosen branch by its current stage. “Converted” means it became a client.', dated: false },
  { id: 'coverage', name: 'Visit coverage', icon: CalendarCheck, desc: 'How many visits had a caregiver.', basis: 'Covered = the visit had a caregiver. No caregiver = still unassigned, or cancelled because nobody was free. Other cancellations are not counted.', dated: true },
  { id: 'hours', name: 'Service hours', icon: Clock, desc: 'Planned hours against hours delivered.', basis: 'Planned = all visits not cancelled. Delivered = visits marked completed. Hours come from the planned start and end times.', dated: true },
  { id: 'utilization', name: 'Caregiver use', icon: Users, desc: 'Visits and hours per caregiver.', basis: 'Counts visits each caregiver is assigned to (not cancelled) in the period, and their planned hours.', dated: true },
  { id: 'readiness', name: 'Requirements', icon: ShieldCheck, desc: 'Who is ready to work, and what’s missing.', basis: 'Uses each caregiver’s current readiness from their checked documents. Blocking items stop visits being given.', dated: false },
  { id: 'billing', name: 'Billing & payroll readiness', icon: Receipt, desc: 'Finished visits and whether they’re approved.', basis: 'Only approved visits can be billed or paid. Waiting and sent-back visits are not ready yet.', dated: true },
] as const
type RId = typeof REPORTS[number]['id']
const hrs = (a: string, b: string) => { const [h1, m1] = a.split(':').map(Number); const [h2, m2] = b.split(':').map(Number); return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 }

export default function Reports() {
  const s = useStore()
  const [rid, setRid] = useState<RId>('coverage')
  const [range, setRange] = useState('Last 7 days')
  const [from, setFrom] = useState(addDays(-6))
  const [to, setTo] = useState(TODAY)
  const [branch, setBranch] = useState(s.branch)
  const meta = REPORTS.find(r => r.id === rid)!
  const period = range === 'Custom' ? [from, to] : range === 'Today' ? [TODAY, TODAY] : range === 'Next 7 days' ? [TODAY, addDays(6)] : range === 'Last 30 days' ? [addDays(-29), TODAY] : [addDays(-6), TODAY]
  const inB = (b: string) => branch === 'all' || b === branch
  const inP = (d: string) => d >= period[0] && d <= period[1]
  const visits = s.visits.filter(v => inB(v.branch) && inP(v.date))
  const cname = (id: string) => s.clients.find(c => c.id === id)?.name ?? ''

  const data = useMemo((): { tiles: [string, string | number][]; head: string[]; rows: (string | number)[][] } => {
    if (rid === 'referrals') {
      const r = s.referrals.filter(x => inB(x.branch))
      return { tiles: [['Total', r.length], ['In progress', r.filter(x => !['Converted', 'Closed'].includes(x.stage)).length], ['Converted', r.filter(x => x.stage === 'Converted').length], ['Closed', r.filter(x => x.stage === 'Closed').length]],
        head: ['Number', 'Name', 'Stage', 'Source', 'Owner', 'Days in stage'], rows: r.map(x => [x.id, x.name, x.stage, x.source, x.owner, x.days]) }
    }
    if (rid === 'coverage') {
      const days: string[] = []; for (let d = period[0]; d <= period[1]; d = addDaysFrom(d, 1)) days.push(d)
      const rows = days.map(d => { const v = visits.filter(x => x.date === d && !(x.status === 'Cancelled' && x.cancelReason !== 'No caregiver available')); const cov = v.filter(x => x.caregiverId).length; return [fmtDate(d), v.length, cov, v.length - cov, v.length ? Math.round(cov / v.length * 100) + '%' : '—'] })
      const tot = rows.reduce((a, r) => a + (r[1] as number), 0), cov = rows.reduce((a, r) => a + (r[2] as number), 0)
      return { tiles: [['Visits', tot], ['Covered', cov], ['No caregiver', tot - cov], ['Coverage', tot ? Math.round(cov / tot * 100) + '%' : '—']], head: ['Day', 'Visits', 'Covered', 'No caregiver', 'Coverage'], rows }
    }
    if (rid === 'hours') {
      const ids = Array.from(new Set(visits.map(v => v.clientId)))
      const rows = ids.map(id => { const v = visits.filter(x => x.clientId === id && x.status !== 'Cancelled'); const p = v.reduce((a, x) => a + hrs(x.start, x.end), 0); const d = v.filter(x => x.status === 'Completed').reduce((a, x) => a + hrs(x.start, x.end), 0); return [cname(id), v.length, p.toFixed(1), d.toFixed(1)] })
      const p = rows.reduce((a, r) => a + Number(r[2]), 0), d = rows.reduce((a, r) => a + Number(r[3]), 0)
      return { tiles: [['Clients', rows.length], ['Planned hours', p.toFixed(1)], ['Delivered hours', d.toFixed(1)], ['Still to deliver', (p - d).toFixed(1)]], head: ['Client', 'Visits', 'Planned hours', 'Delivered hours'], rows }
    }
    if (rid === 'utilization') {
      const rows = s.caregivers.filter(c => inB(c.branch)).map(c => { const v = visits.filter(x => x.caregiverId === c.id && x.status !== 'Cancelled'); return [c.name, s.branchName(c.branch), v.length, v.reduce((a, x) => a + hrs(x.start, x.end), 0).toFixed(1), c.readiness] })
      return { tiles: [['Caregivers', rows.length], ['With visits', rows.filter(r => (r[2] as number) > 0).length], ['Total hours', rows.reduce((a, r) => a + Number(r[3]), 0).toFixed(1)], ['Not ready', rows.filter(r => r[4] === 'Blocked').length]], head: ['Caregiver', 'Branch', 'Visits', 'Hours', 'Readiness'], rows }
    }
    if (rid === 'readiness') {
      const c = s.caregivers.filter(x => inB(x.branch))
      return { tiles: [['Caregivers', c.length], ['Ready', c.filter(x => x.readiness === 'Ready').length], ['Ready with warning', c.filter(x => x.readiness === 'Warning').length], ['Not ready', c.filter(x => x.readiness === 'Blocked').length]],
        head: ['Caregiver', 'Branch', 'Readiness', 'What’s missing'], rows: c.map(x => [x.name, s.branchName(x.branch), x.readiness === 'Blocked' ? 'Not ready' : x.readiness, x.issue ?? 'Nothing']) }
    }
    const a = s.approvals.filter(x => inB(x.branch) && inP(x.date))
    return { tiles: [['Finished visits', a.length], ['Approved — ready', a.filter(x => x.status === 'Approved').length], ['Waiting', a.filter(x => x.status === 'Waiting').length], ['Sent back', a.filter(x => x.status === 'Returned').length]],
      head: ['Visit', 'Date', 'Client', 'Caregiver', 'Actual time', 'Status', 'Ready to bill and pay'], rows: a.map(x => [x.visitNo, fmtDate(x.date), x.client, x.caregiver, x.actual, x.status === 'Returned' ? 'Sent back' : x.status, x.status === 'Approved' ? 'Yes' : 'No']) }
  }, [rid, s, branch, period[0], period[1]])

  const download = () => {
    downloadCsv(`corliva-${rid}-${period[0]}-to-${period[1]}.csv`, data.head, data.rows, [`${s.agency.name} — ${meta.name} report`, meta.dated ? `Period: ${fmtDate(period[0], { day: 'numeric', month: 'short', year: 'numeric' })} to ${fmtDate(period[1], { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Period: as of today', `Branch: ${s.branchName(branch)}`, `How it’s counted: ${meta.basis}`])
    s.log({ type: 'Settings', action: 'Downloaded a report', record: `${meta.name} · ${s.branchName(branch)}` })
    s.toast(`${meta.name} report downloaded`)
  }

  return (
    <>
      <PageHead title="Reports" crumb="Reports" sub="Pick a report, choose the dates and branch, then download it." actions={<Button icon={Download} disabled={data.rows.length === 0} onClick={download}>Download CSV</Button>} />
      <div className="grid g-3">
        {REPORTS.map(r => (
          <button key={r.id} className="card card-pad row" style={{ textAlign: 'left', borderColor: rid === r.id ? 'var(--border-focus)' : undefined, background: rid === r.id ? 'var(--bg-selected)' : '#fff' }} onClick={() => setRid(r.id)} aria-pressed={rid === r.id}>
            <span className="stat-icon tone-info"><r.icon /></span><span><span className="t-medium" style={{ display: 'block' }}>{r.name}</span><span className="t-caption t-muted">{r.desc}</span></span>
          </button>))}
      </div>
      <div className="card">
        <CardHead title={meta.name} sub={meta.dated ? `${fmtDate(period[0], { day: 'numeric', month: 'short' })} – ${fmtDate(period[1], { day: 'numeric', month: 'short', year: 'numeric' })} · ${s.branchName(branch)}` : `As of today · ${s.branchName(branch)}`} />
        <div className="toolbar" style={{ alignItems: 'flex-end' }}>
          {meta.dated && <div style={{ width: 170 }}><Field label="Dates"><Select value={range} onChange={e => setRange(e.target.value)} options={['Today', 'Last 7 days', 'Last 30 days', 'Next 7 days', 'Custom']} /></Field></div>}
          {meta.dated && range === 'Custom' && <>
            <div style={{ width: 160 }}><Field label="From"><Input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} /></Field></div>
            <div style={{ width: 160 }}><Field label="To"><Input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} /></Field></div>
          </>}
          <div style={{ width: 190 }}><Field label="Branch"><Select value={branch} onChange={e => setBranch(e.target.value)} options={[{ value: 'all', label: 'All branches' }, ...s.branches.map(b => ({ value: b.id, label: b.name }))]} /></Field></div>
        </div>
        <div className="card-body grid g-4">{data.tiles.map(([k, v]) => <div key={k} className="card card-pad" style={{ background: 'var(--bg-subtle)' }}><div className="t-small t-secondary">{k}</div><div className="t-kpi" style={{ fontSize: 24 }}>{v}</div></div>)}</div>
        <div className="row t-small t-secondary" style={{ gap: 8, padding: '0 16px 12px' }}><Info size={15} color="var(--status-info)" style={{ flexShrink: 0 }} /><span><b>How this is counted:</b> {meta.basis}</span></div>
        {data.rows.length === 0 ? <EmptyState icon={Info} tone="neutral" title="No data for these filters" text="Try a longer date range or another branch." /> :
          <div className="table-wrap"><table className="tbl">
            <thead><tr>{data.head.map((h, i) => <th key={h} className={i > 0 && typeof data.rows[0][i] === 'number' ? 'num' : ''}>{h}</th>)}</tr></thead>
            <tbody>{data.rows.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k} className={typeof c === 'number' ? 'num' : ''}>{['Not ready', 'Blocked'].includes(String(c)) ? <Chip tone="danger">Not ready</Chip> : c === 'Warning' ? <Chip tone="warning">Warning</Chip> : c}</td>)}</tr>)}</tbody>
          </table></div>}
      </div>
    </>
  )
}

function addDaysFrom(isoDate: string, n: number) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const x = new Date(y, m - 1, d + n)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
