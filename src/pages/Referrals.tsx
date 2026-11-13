import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, LayoutGrid, List, UserRound, TriangleAlert, CheckCircle2, PhoneCall } from 'lucide-react'
import { useStore, fmtDate } from '../data/store'
import { Referral, Stage, TODAY } from '../data/seed'
import { STAGES, blockers, daysInStage, isOpen, ready, stageTone, urgTone } from '../data/referrals'
import { AlertBanner, Button, Chip, EmptyState, PageHead } from '../components/ui'

const lastContact = (r: Referral) => [...r.contacts].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0]
const dueFollowUp = (r: Referral) => isOpen(r) && r.contacts.some(c => c.followUp && c.followUp <= TODAY)

export default function Referrals() {
  const s = useStore()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<'board' | 'list'>('board')
  const [q, setQ] = useState('')
  const [owner, setOwner] = useState('All owners')
  const [stage, setStage] = useState(params.get('stage') ?? 'All stages')
  useEffect(() => { const st = params.get('stage'); if (st) setStage(st) }, [params])

  const rows = useMemo(() => s.referrals.filter(r => s.inBranch(r.branch) &&
    (owner === 'All owners' || r.owner === owner) &&
    (stage === 'All stages' || r.stage === stage) &&
    (!q.trim() || (r.name + r.id + r.source).toLowerCase().includes(q.trim().toLowerCase()))), [s.referrals, s.branch, owner, stage, q])
  const owners = ['All owners', ...Array.from(new Set(s.referrals.map(r => r.owner)))]
  const stuck = rows.filter(r => isOpen(r) && daysInStage(r) > 3).length
  const follow = rows.filter(dueFollowUp).length
  const open = (r: Referral) => nav(`/referrals/${r.id}`)

  // Old links like /referrals?open=R-1042 go straight to the referral's screen
  const legacy = params.get('open')
  if (legacy) return <Navigate to={`/referrals/${legacy}`} replace />

  const Card = ({ r }: { r: Referral }) => {
    const b = blockers(r); const lc = lastContact(r)
    return (
      <button className="lane-card" onClick={() => open(r)}>
        <span className="row between"><span className="t-medium">{r.name}</span><Chip tone={urgTone(r.urgency)}>{r.urgency}</Chip></span>
        <span className="t-caption t-muted">{r.id} · {r.services.join(', ')}</span>
        <span className="row between t-caption"><span className="row" style={{ gap: 6, color: r.owner === 'Unassigned' ? 'var(--status-danger)' : undefined }}><UserRound size={12} />{r.owner === 'Unassigned' ? 'No owner' : r.owner}</span>
          {isOpen(r) && <span className={daysInStage(r) > 3 ? 't-strong' : 't-muted'} style={{ color: daysInStage(r) > 3 ? 'var(--status-warning)' : undefined }}>{daysInStage(r) === 0 ? 'Today' : `${daysInStage(r)}d in stage`}</span>}</span>
        {lc && <span className="row t-caption t-muted" style={{ gap: 6 }}><PhoneCall size={12} />Last contact {fmtDate(lc.date, { day: 'numeric', month: 'short' })}: {lc.outcome.toLowerCase()}</span>}
        {isOpen(r) && (ready(r)
          ? <span className="row t-caption" style={{ gap: 6, color: 'var(--status-success)' }}><CheckCircle2 size={12} />Ready to move on</span>
          : <span className="row t-caption" style={{ gap: 6, color: 'var(--status-danger)' }}><TriangleAlert size={12} />Needs: {b.map(x => x.label.toLowerCase()).join(', ')}</span>)}
      </button>)
  }

  return (
    <>
      <PageHead title="Referrals" crumb="Referrals" sub="Every new client enquiry and where it’s up to. Open one to see every call, message, check and assessment." />
      {(stuck > 0 || follow > 0) && <div className="grid g-2">
        {stuck > 0 && <AlertBanner tone="warning" title={`${stuck} referral${stuck > 1 ? 's have' : ' has'} not moved for over 3 days`} action={<Button size="sm" variant="secondary" onClick={() => setView('list')}>Show them</Button>} />}
        {follow > 0 && <AlertBanner tone="info" title={`${follow} follow-up call${follow > 1 ? 's are' : ' is'} due today or overdue`}>Open the referral to see who needs a call back.</AlertBanner>}
      </div>}
      <div className="card">
        <div className="toolbar">
          <div className="search"><Search /><input aria-label="Search referrals" placeholder="Search by name or number" value={q} onChange={e => setQ(e.target.value)} /></div>
          <select className="select-sm" aria-label="Filter by owner" value={owner} onChange={e => setOwner(e.target.value)}>{owners.map(o => <option key={o}>{o}</option>)}</select>
          <select className="select-sm" aria-label="Filter by stage" value={stage} onChange={e => { setStage(e.target.value); setParams({}) }}>{['All stages', ...STAGES, 'Closed'].map(o => <option key={o}>{o}</option>)}</select>
          <span className="grow" />
          <div className="seg" role="group" aria-label="View">
            <button className={view === 'board' ? 'on' : ''} onClick={() => setView('board')} aria-pressed={view === 'board'}><LayoutGrid size={14} style={{ verticalAlign: -2 }} /> Board</button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-pressed={view === 'list'}><List size={14} style={{ verticalAlign: -2 }} /> List</button>
          </div>
        </div>
        {rows.length === 0 ? <EmptyState icon={Search} tone="neutral" title="No referrals match" text="Try clearing the filters." action={<Button variant="secondary" onClick={() => { setQ(''); setOwner('All owners'); setStage('All stages') }}>Clear filters</Button>} />
          : view === 'board' ? (
            <div className="card-body pipeline">
              {(stage === 'Closed' ? [] : STAGES).filter(l => stage === 'All stages' || stage === l).map(l => {
                const list = rows.filter(r => r.stage === l)
                return (
                  <div key={l} className="lane">
                    <div className="row between"><Chip tone={stageTone(l)}>{l}</Chip><span className="t-caption t-muted">{list.length}</span></div>
                    {list.map(r => <Card key={r.id} r={r} />)}
                    {list.length === 0 && <div className="t-caption t-muted" style={{ textAlign: 'center', padding: 16 }}>Nothing here</div>}
                  </div>)
              })}
              {(stage === 'All stages' || stage === 'Closed') && rows.some(r => r.stage === 'Closed') && (
                <div className="lane" style={{ gridColumn: stage === 'Closed' ? 'span 1' : '1 / -1', minHeight: 0 }}>
                  <div className="row between"><Chip tone="neutral">Closed</Chip><span className="t-caption t-muted">{rows.filter(r => r.stage === 'Closed').length} · records kept</span></div>
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                    {rows.filter(r => r.stage === 'Closed').map(r => (
                      <button key={r.id} className="lane-card" onClick={() => open(r)}>
                        <span className="t-medium">{r.name}</span><span className="t-caption t-muted">{r.id} · closed at {r.closedAt}</span><span className="t-caption">{r.outcome}</span>
                      </button>))}
                  </div>
                </div>)}
            </div>
          ) : (
            <div className="table-wrap"><table className="tbl">
              <thead><tr><th>Person</th><th>Stage</th><th>Urgency</th><th>Owner</th><th>In stage</th><th>Last contact</th><th>Still needed</th></tr></thead>
              <tbody>{rows.slice().sort((a, b) => Number(isOpen(b)) - Number(isOpen(a)) || daysInStage(b) - daysInStage(a)).map(r => {
                const lc = lastContact(r); const b = blockers(r)
                return (
                  <tr key={r.id} className="clickable" onClick={() => open(r)}>
                    <td><div className="t-medium">{r.name}</div><div className="t-caption t-muted">{r.id} · {r.source}</div></td>
                    <td><Chip tone={stageTone(r.stage as Stage)}>{r.stage}</Chip></td><td><Chip tone={urgTone(r.urgency)}>{r.urgency}</Chip></td>
                    <td style={{ color: r.owner === 'Unassigned' ? 'var(--status-danger)' : undefined }}>{r.owner === 'Unassigned' ? 'No owner' : r.owner}</td>
                    <td style={{ color: isOpen(r) && daysInStage(r) > 3 ? 'var(--status-warning)' : undefined, fontWeight: isOpen(r) && daysInStage(r) > 3 ? 600 : 400 }}>{isOpen(r) ? (daysInStage(r) === 0 ? 'Today' : `${daysInStage(r)} days`) : '—'}</td>
                    <td>{lc ? <><div>{fmtDate(lc.date, { day: 'numeric', month: 'short' })} · {lc.type}</div><div className="t-caption t-muted">{lc.outcome}</div></> : <span className="t-muted">None yet</span>}</td>
                    <td>{!isOpen(r) ? <span className="t-muted">{r.stage === 'Closed' ? r.outcome?.split(':')[0] : 'Now a client'}</span> : b.length ? <span style={{ color: 'var(--status-danger)' }}>{b.map(x => x.label).join(', ')}</span> : <span style={{ color: 'var(--status-success)' }}>Ready to move on</span>}</td>
                  </tr>)
              })}</tbody>
            </table></div>
          )}
      </div>
    </>
  )
}
