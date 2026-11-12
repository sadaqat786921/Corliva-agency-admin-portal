import { useMemo, useState } from 'react'
import { CheckCircle2, Undo2, TriangleAlert, ClipboardCheck, Lock } from 'lucide-react'
import { useStore, fmtDate } from '../data/store'
import { Approval } from '../data/seed'
import { AlertBanner, Avatar, Button, Chip, Drawer, EmptyState, PageHead, ReasonDialog, Tabs } from '../components/ui'

export default function Approvals() {
  const s = useStore()
  const [tab, setTab] = useState<Approval['status']>('Waiting')
  const [sel, setSel] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [returning, setReturning] = useState<Approval | null>(null)
  const allowed = s.rules.approvers.includes('Agency Admin')
  const rows = useMemo(() => s.approvals.filter(a => a.status === tab && s.inBranch(a.branch)).sort((a, b) => a.date.localeCompare(b.date)), [s.approvals, tab, s.branch])
  const clean = rows.filter(r => r.flags.length === 0)
  const open = s.approvals.find(a => a.id === openId)

  const approve = (ids: string[]) => {
    const list = s.approvals.filter(a => ids.includes(a.id))
    s.setApprovals(x => x.map(a => ids.includes(a.id) ? { ...a, status: 'Approved' } : a))
    s.log({ type: 'Visit', action: ids.length > 1 ? `Approved ${ids.length} visits` : 'Approved a visit', record: list.map(l => 'Visit ' + l.visitNo).join(', ') })
    s.toast(ids.length > 1 ? `${ids.length} visits approved. They’re ready for billing and payroll.` : 'Visit approved. It’s ready for billing and payroll.')
    setSel([]); setOpenId(null)
  }
  const count = (st: Approval['status']) => s.approvals.filter(a => a.status === st && s.inBranch(a.branch)).length

  return (
    <>
      <PageHead title="Visit Approvals" crumb="Visit Approvals" sub="Check finished visits before they go to billing and payroll. Care Supervisors usually do this." actions={tab === 'Waiting' && allowed ? <>
        {sel.length > 0 && <Button variant="secondary" onClick={() => setSel([])}>Clear selection</Button>}
        <Button icon={CheckCircle2} disabled={sel.length === 0} onClick={() => approve(sel)}>Approve selected ({sel.length})</Button>
      </> : undefined} />
      {!allowed && <AlertBanner tone="info" title="You can see approvals, but not approve them">Agency Admins aren’t on the approval list. Change this in Rules & Requirements → Visit checks & approval.</AlertBanner>}
      <div className="card">
        <div style={{ padding: '0 16px' }}><Tabs value={tab} onChange={t => { setTab(t); setSel([]) }} tabs={[{ id: 'Waiting', label: 'Waiting', count: count('Waiting') }, { id: 'Returned', label: 'Sent back', count: count('Returned') }, { id: 'Approved', label: 'Approved', count: count('Approved') }]} /></div>
        {tab === 'Waiting' && clean.length > 0 && allowed && <div className="row t-small" style={{ padding: '12px 16px', gap: 10, borderBottom: '1px solid var(--border-default)' }}>
          <CheckCircle2 size={16} color="var(--status-success)" />{clean.length} visit{clean.length > 1 ? 's match' : ' matches'} the plan with nothing flagged.
          <button className="link-btn" onClick={() => setSel(clean.map(c => c.id))}>Select them</button></div>}
        {rows.length === 0 ? <EmptyState icon={ClipboardCheck} title={tab === 'Waiting' ? 'All caught up' : 'Nothing here'} text={tab === 'Waiting' ? 'No finished visits are waiting for review.' : tab === 'Returned' ? 'No visits have been sent back.' : 'No visits approved yet for this branch.'} />
          : <div className="table-wrap"><table className="tbl">
            <thead><tr>{tab === 'Waiting' && allowed && <th style={{ width: 40 }}><input type="checkbox" aria-label="Select all" checked={sel.length === rows.length} onChange={e => setSel(e.target.checked ? rows.map(r => r.id) : [])} /></th>}
              <th>Visit</th><th>Client</th><th>Caregiver</th><th>Planned</th><th>Actual</th><th>Tasks</th><th>{tab === 'Returned' ? 'Reason' : 'Flags'}</th></tr></thead>
            <tbody>{rows.map(a => (
              <tr key={a.id} className="clickable" onClick={() => setOpenId(a.id)}>
                {tab === 'Waiting' && allowed && <td onClick={e => e.stopPropagation()}><input type="checkbox" aria-label={`Select visit ${a.visitNo}`} checked={sel.includes(a.id)} onChange={e => setSel(e.target.checked ? [...sel, a.id] : sel.filter(x => x !== a.id))} /></td>}
                <td><div className="t-medium">{a.visitNo}</div><div className="t-caption t-muted">{fmtDate(a.date)}</div></td>
                <td>{a.client}</td><td>{a.caregiver}</td><td>{a.scheduled}</td>
                <td style={{ color: a.flags.length ? 'var(--status-warning)' : undefined }}>{a.actual}</td><td>{a.tasks}</td>
                <td>{tab === 'Returned' ? <span className="t-secondary">{a.reason}</span> : a.flags.length ? <span className="col" style={{ gap: 4 }}>{a.flags.map(f => <Chip key={f} tone="warning">{f}</Chip>)}</span> : <Chip tone="success">All good</Chip>}</td>
              </tr>))}</tbody>
          </table></div>}
      </div>

      {open && <Drawer title={`Visit ${open.visitNo}`} sub={`${open.client} · ${fmtDate(open.date, { weekday: 'long', day: 'numeric', month: 'long' })}`} onClose={() => setOpenId(null)} footer={open.status === 'Waiting' && allowed ? <>
        <Button variant="danger" icon={Undo2} onClick={() => setReturning(open)}>Send back to fix</Button>
        <Button icon={CheckCircle2} onClick={() => approve([open.id])}>Approve</Button>
      </> : <Button variant="secondary" onClick={() => setOpenId(null)}>Close</Button>}>
        {open.flags.length > 0 && open.status === 'Waiting' && <AlertBanner tone="warning" title="Please check before approving">{open.flags.join(' · ')}</AlertBanner>}
        {open.status === 'Approved' && <AlertBanner tone="success" title="Approved">This visit is ready for billing and payroll. Any change now needs a correction, so the invoice and payroll stay right.</AlertBanner>}
        {open.status === 'Returned' && <AlertBanner tone="info" title="Sent back to the caregiver">Reason: {open.reason}</AlertBanner>}
        <div className="row"><Avatar name={open.caregiver} /><div><div className="t-medium">{open.caregiver}</div><div className="t-caption t-muted">Caregiver · {s.branchName(open.branch)}</div></div></div>
        <div className="table-wrap card"><table className="tbl">
          <thead><tr><th /><th>Planned</th><th>What happened</th></tr></thead>
          <tbody>
            <tr><td className="t-muted">Time</td><td>{open.scheduled}</td><td style={{ color: open.flags.some(f => /late|check-out/i.test(f)) ? 'var(--status-warning)' : undefined, fontWeight: 500 }}>{open.actual}</td></tr>
            <tr><td className="t-muted">Tasks</td><td>All tasks</td><td style={{ color: open.flags.some(f => /task/i.test(f)) ? 'var(--status-warning)' : undefined, fontWeight: 500 }}>{open.tasks}</td></tr>
            <tr><td className="t-muted">Location</td><td>Client’s home</td><td style={{ fontWeight: 500, color: open.flags.some(f => /location/i.test(f)) ? 'var(--status-warning)' : undefined }}>{open.flags.some(f => /location/i.test(f)) ? 'Not shared' : 'At client’s home'}</td></tr>
          </tbody>
        </table></div>
        <div className="row t-caption t-muted" style={{ gap: 6 }}><Lock size={13} />The caregiver’s original entries are kept. Any fix is saved next to them, with who changed it and why.</div>
        {open.flags.length > 0 && <div className="row t-caption" style={{ gap: 6, color: 'var(--status-warning)' }}><TriangleAlert size={13} />Flags use your rules: late after {s.rules.lateArrivalMins} min, time difference over {s.rules.timeDiffMins} min.</div>}
      </Drawer>}

      {returning && <ReasonDialog title="Send this visit back?" text={`${returning.caregiver} will be asked to fix it and send it again.`} label="What needs fixing?" placeholder="For example: please add the check-out time" confirm="Send back" onClose={() => setReturning(null)} onConfirm={reason => {
        s.setApprovals(x => x.map(a => a.id === returning.id ? { ...a, status: 'Returned', reason } : a))
        s.log({ type: 'Visit', action: 'Sent a visit back to fix', record: 'Visit ' + returning.visitNo, reason })
        s.toast(`Sent back to ${returning.caregiver}`); setReturning(null); setOpenId(null)
      }} />}
    </>
  )
}
