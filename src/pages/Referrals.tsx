import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, LayoutGrid, List, UserRound, ArrowRight, XCircle, MessageSquarePlus, UserCheck, TriangleAlert, Clock, Phone } from 'lucide-react'
import { useStore } from '../data/store'
import { Referral, Stage } from '../data/seed'
import { AlertBanner, Avatar, Button, Chip, ChipTone, Drawer, EmptyState, Field, Modal, PageHead, Select, Textarea } from '../components/ui'

const LANES: Stage[] = ['Enquiry', 'Qualification', 'Assessment', 'Decision', 'Converted']
const urgTone = (u: Referral['urgency']): ChipTone => u === 'Urgent' ? 'danger' : u === 'Soon' ? 'warning' : 'neutral'
const stageTone = (st: Stage): ChipTone => st === 'Converted' ? 'success' : st === 'Closed' ? 'neutral' : st === 'Decision' ? 'warning' : st === 'Enquiry' ? 'neutral' : 'info'

export default function Referrals() {
  const s = useStore()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<'board' | 'list'>('board')
  const [q, setQ] = useState('')
  const [owner, setOwner] = useState('All owners')
  const [stage, setStage] = useState(params.get('stage') ?? 'All stages')
  const [openId, setOpenId] = useState<string | null>(params.get('open'))
  useEffect(() => { const o = params.get('open'); if (o) setOpenId(o); const st = params.get('stage'); if (st) setStage(st) }, [params])

  const rows = useMemo(() => s.referrals.filter(r => s.inBranch(r.branch) &&
    (owner === 'All owners' || r.owner === owner) &&
    (stage === 'All stages' || r.stage === stage) &&
    (!q.trim() || (r.name + r.id + r.source).toLowerCase().includes(q.trim().toLowerCase()))), [s.referrals, s.branch, owner, stage, q])
  const owners = ['All owners', ...Array.from(new Set(s.referrals.map(r => r.owner)))]
  const stuck = rows.filter(r => r.days > 3 && !['Converted', 'Closed'].includes(r.stage)).length
  const open = s.referrals.find(r => r.id === openId)

  return (
    <>
      <PageHead title="Referrals" crumb="Referrals" sub="See every new client enquiry and where it’s up to. Your Care Coordinators do the day-to-day work." />
      {stuck > 0 && <AlertBanner tone="warning" title={`${stuck} referral${stuck > 1 ? 's have' : ' has'} not moved for over 3 days`} action={<Button size="sm" variant="secondary" onClick={() => setView('list')}>Show them</Button>}>Open one to see what’s holding it up.</AlertBanner>}
      <div className="card">
        <div className="toolbar">
          <div className="search"><Search /><input aria-label="Search referrals" placeholder="Search by name or number" value={q} onChange={e => setQ(e.target.value)} /></div>
          <select className="select-sm" aria-label="Filter by owner" value={owner} onChange={e => setOwner(e.target.value)}>{owners.map(o => <option key={o}>{o}</option>)}</select>
          <select className="select-sm" aria-label="Filter by stage" value={stage} onChange={e => { setStage(e.target.value); setParams({}) }}>{['All stages', ...LANES, 'Closed'].map(o => <option key={o}>{o}</option>)}</select>
          <span className="grow" />
          <div className="seg" role="group" aria-label="View">
            <button className={view === 'board' ? 'on' : ''} onClick={() => setView('board')} aria-pressed={view === 'board'}><LayoutGrid size={14} style={{ verticalAlign: -2 }} /> Board</button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-pressed={view === 'list'}><List size={14} style={{ verticalAlign: -2 }} /> List</button>
          </div>
        </div>
        {rows.length === 0 ? <EmptyState icon={Search} tone="neutral" title="No referrals match" text="Try clearing the filters." action={<Button variant="secondary" onClick={() => { setQ(''); setOwner('All owners'); setStage('All stages') }}>Clear filters</Button>} />
          : view === 'board' ? (
            <div className="card-body pipeline">
              {LANES.filter(l => stage === 'All stages' || stage === l).map(l => {
                const list = rows.filter(r => r.stage === l)
                return (
                  <div key={l} className="lane">
                    <div className="row between"><Chip tone={stageTone(l)}>{l}</Chip><span className="t-caption t-muted">{list.length}</span></div>
                    {list.map(r => (
                      <button key={r.id} className="lane-card" onClick={() => setOpenId(r.id)}>
                        <span className="row between"><span className="t-medium">{r.name}</span><Chip tone={urgTone(r.urgency)}>{r.urgency}</Chip></span>
                        <span className="t-caption t-muted">{r.id} · {r.services}</span>
                        <span className="row between t-caption"><span className="row" style={{ gap: 6 }}><UserRound size={12} />{r.owner}</span><span className={r.days > 3 ? 't-strong' : 't-muted'} style={{ color: r.days > 3 ? 'var(--status-warning)' : undefined }}>{r.days === 0 ? 'Today' : `${r.days}d in stage`}</span></span>
                        {r.missing.length > 0 && <span className="row t-caption" style={{ gap: 6, color: 'var(--status-danger)' }}><TriangleAlert size={12} />Missing: {r.missing.join(', ')}</span>}
                      </button>))}
                    {list.length === 0 && <div className="t-caption t-muted" style={{ textAlign: 'center', padding: 16 }}>Nothing here</div>}
                  </div>)
              })}
            </div>
          ) : (
            <div className="table-wrap"><table className="tbl">
              <thead><tr><th>Person</th><th>Stage</th><th>Urgency</th><th>Source</th><th>Owner</th><th>Branch</th><th>In stage</th><th>What’s missing</th></tr></thead>
              <tbody>{rows.slice().sort((a, b) => b.days - a.days).map(r => (
                <tr key={r.id} className="clickable" onClick={() => setOpenId(r.id)}>
                  <td><div className="t-medium">{r.name}</div><div className="t-caption t-muted">{r.id}</div></td>
                  <td><Chip tone={stageTone(r.stage)}>{r.stage}</Chip></td><td><Chip tone={urgTone(r.urgency)}>{r.urgency}</Chip></td>
                  <td>{r.source}</td><td>{r.owner}</td><td>{s.branchName(r.branch)}</td>
                  <td style={{ color: r.days > 3 ? 'var(--status-warning)' : undefined, fontWeight: r.days > 3 ? 600 : 400 }}>{r.days === 0 ? 'Today' : `${r.days} days`}</td>
                  <td>{r.missing.length ? <span style={{ color: 'var(--status-danger)' }}>{r.missing.join(', ')}</span> : <span className="t-muted">Nothing</span>}</td>
                </tr>))}</tbody>
            </table></div>
          )}
      </div>
      {open && <ReferralDrawer r={open} onClose={() => { setOpenId(null); if (params.get('open')) setParams({}) }} />}
    </>
  )
}

type Act = 'owner' | 'move' | 'close' | 'note' | 'convert' | null

function ReferralDrawer({ r, onClose }: { r: Referral; onClose: () => void }) {
  const s = useStore()
  const nav = useNavigate()
  const [act, setAct] = useState<Act>(null)
  const done = r.stage === 'Converted' || r.stage === 'Closed'
  const nextStage = LANES[LANES.indexOf(r.stage) + 1] as Stage | undefined
  const canMove = !done && r.stage !== 'Decision' && r.missing.length === 0
  const canConvert = r.stage === 'Decision' && r.missing.length === 0
  const stamp = () => { const d = new Date(); return `Today ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
  const update = (patch: Partial<Referral>, note: string) => s.setReferrals(x => x.map(y => y.id === r.id ? { ...y, ...patch, history: [{ by: s.me.name, at: stamp(), text: note }, ...y.history] } : y))

  return (
    <Drawer title={r.name} sub={<span className="row" style={{ gap: 8 }}>{r.id}<Chip tone={stageTone(r.stage)}>{r.stage}</Chip><Chip tone={urgTone(r.urgency)}>{r.urgency}</Chip></span>} onClose={onClose} footer={done ? (
      r.stage === 'Converted' ? <Button icon={UserCheck} onClick={() => { const c = s.clients.find(c => c.fromReferral === r.id || c.name === r.name); nav(c ? `/clients?open=${c.id}` : '/clients') }}>Open client record</Button> : <Button variant="secondary" onClick={onClose}>Close</Button>
    ) : <>
      <Button variant="secondary" icon={MessageSquarePlus} onClick={() => setAct('note')}>Add note</Button>
      <Button variant="danger" icon={XCircle} onClick={() => setAct('close')}>Close referral</Button>
      {r.stage === 'Decision' ? <Button icon={UserCheck} disabled={!canConvert} onClick={() => setAct('convert')}>Accept & make client</Button>
        : <Button icon={ArrowRight} disabled={!canMove} onClick={() => setAct('move')}>Move to {nextStage}</Button>}
    </>}>
      {!done && r.missing.length > 0 && <AlertBanner tone="danger" title="Can’t move on yet">Missing: {r.missing.join(', ')}. {r.owner === 'Unassigned' ? 'Give it an owner first.' : `${r.owner} has been told.`}</AlertBanner>}
      {!done && r.missing.length === 0 && r.days > 3 && <AlertBanner tone="warning" title={`No change for ${r.days} days`}>Check in with {r.owner}, or step in yourself.</AlertBanner>}
      {r.stage === 'Converted' && <AlertBanner tone="success" title="Now a client">{r.outcome}</AlertBanner>}
      {r.stage === 'Closed' && <AlertBanner tone="info" title="Closed">{r.outcome}</AlertBanner>}
      <dl className="kv">
        <dt>Services asked for</dt><dd>{r.services}</dd>
        <dt>Preferred times</dt><dd>{r.preferredTimes}</dd>
        <dt>Referred by</dt><dd>{r.source}</dd>
        <dt>Contact</dt><dd>{r.contact}<div className="t-caption t-muted row" style={{ gap: 4 }}><Phone size={12} />{r.phone}</div></dd>
        <dt>Branch</dt><dd>{s.branchName(r.branch)}</dd>
        <dt>Owner</dt><dd className="row between">{r.owner}{!done && <button className="link-btn" onClick={() => setAct('owner')}>Change</button>}</dd>
      </dl>
      <div className="divider" />
      <div><div className="t-h3" style={{ marginBottom: 12 }}>Activity</div>
        <div className="timeline">{r.history.map((h, i) => (
          <div key={i} className="timeline-item"><Avatar name={h.by} size="sm" /><div><div className="t-small">{h.text}</div><div className="t-caption t-muted row" style={{ gap: 4 }}><Clock size={11} />{h.by} · {h.at}</div></div></div>))}</div></div>

      {act === 'owner' && <OwnerModal r={r} onClose={() => setAct(null)} onSave={(o, reason) => {
        update({ owner: o, missing: r.missing.filter(m => m !== 'Owner') }, `Owner changed from ${r.owner} to ${o}. Reason: ${reason}`)
        s.log({ type: 'Referral', action: 'Changed a referral owner', record: `${r.id} ${r.name}`, before: r.owner, after: o, reason }); s.toast(`${o} now owns this referral`); setAct(null)
      }} />}
      {act === 'move' && nextStage && <ReasonModal title={`Move to ${nextStage}?`} text={`This is ${r.owner}’s referral. Stepping in is saved with your reason.`} confirm={`Move to ${nextStage}`} onClose={() => setAct(null)} onSave={reason => {
        update({ stage: nextStage, days: 0 }, `Moved from ${r.stage} to ${nextStage}. Reason: ${reason}`)
        s.log({ type: 'Referral', action: 'Moved a referral', record: `${r.id} ${r.name}`, before: r.stage, after: nextStage, reason }); s.toast(`Moved to ${nextStage}`); setAct(null)
      }} />}
      {act === 'note' && <ReasonModal title="Add a note" text="Notes are kept with the referral history." label="Note" confirm="Add note" onClose={() => setAct(null)} onSave={note => { update({}, note); s.toast('Note added'); setAct(null) }} />}
      {act === 'close' && <CloseModal r={r} onClose={() => setAct(null)} onSave={(outcome, reason) => {
        update({ stage: 'Closed', outcome: `${outcome}: ${reason}` }, `${outcome}. Reason: ${reason}`)
        s.log({ type: 'Referral', action: `Closed a referral (${outcome.toLowerCase()})`, record: `${r.id} ${r.name}`, before: r.stage, after: 'Closed', reason }); s.toast('Referral closed'); setAct(null)
      }} />}
      {act === 'convert' && <ConvertModal r={r} onClose={() => setAct(null)} onSave={() => {
        const id = 'c' + Date.now()
        s.setClients(x => [...x, { id, name: r.name, branch: r.branch, status: 'Active', coordinator: r.owner === 'Unassigned' ? 'Aisha Rahman' : r.owner, services: r.services, nextVisit: 'Not planned yet', carePlan: 'Review due', since: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), phone: r.phone, address: '—', family: r.contact, fromReferral: r.id }])
        update({ stage: 'Converted', days: 0, outcome: 'Accepted and set up as a client' }, 'Accepted and converted to a client.')
        s.log({ type: 'Referral', action: 'Converted a referral to a client', record: `${r.id} → ${r.name}`, before: 'Decision', after: 'Client' }); s.toast(`${r.name} is now a client`); setAct(null)
      }} />}
    </Drawer>
  )
}

function ReasonModal({ title, text, confirm, label = 'Reason', onClose, onSave }: { title: string; text: string; confirm: string; label?: string; onClose: () => void; onSave: (t: string) => void }) {
  const [t, setT] = useState(''); const [tried, setTried] = useState(false)
  const bad = t.trim().length < 5
  return <Modal title={title} sub={text} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { setTried(true); if (!bad) onSave(t.trim()) }}>{confirm}</Button></>}>
    <Field label={label} required error={tried && bad ? 'Please write at least a few words.' : undefined}><Textarea autoFocus value={t} onChange={e => setT(e.target.value)} error={tried && bad} /></Field>
  </Modal>
}

function OwnerModal({ r, onClose, onSave }: { r: Referral; onClose: () => void; onSave: (o: string, reason: string) => void }) {
  const s = useStore()
  const coords = s.users.filter(u => u.status === 'Active' && (u.role === 'Care Coordinator' || u.role === 'Agency Admin')).map(u => u.name).filter(n => n !== r.owner)
  const [o, setO] = useState(coords[0] ?? ''); const [t, setT] = useState(''); const [tried, setTried] = useState(false)
  const bad = t.trim().length < 5
  return <Modal title="Change owner" sub="The new owner is told straight away." onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { setTried(true); if (!bad && o) onSave(o, t.trim()) }}>Change owner</Button></>}>
    <Field label="New owner" required><Select value={o} onChange={e => setO(e.target.value)} options={coords} /></Field>
    <Field label="Reason" required error={tried && bad ? 'Please write a short reason.' : undefined} helper="Saved in Audit History."><Textarea value={t} onChange={e => setT(e.target.value)} placeholder="For example: Aisha is on leave this week" error={tried && bad} /></Field>
  </Modal>
}

function CloseModal({ r, onClose, onSave }: { r: Referral; onClose: () => void; onSave: (outcome: string, reason: string) => void }) {
  const [o, setO] = useState('Declined by agency'); const [t, setT] = useState(''); const [tried, setTried] = useState(false)
  const bad = t.trim().length < 5
  return <Modal title={`Close ${r.name}’s referral?`} sub="It stays in the history and in reports. You can’t undo this." onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger-solid" onClick={() => { setTried(true); if (!bad) onSave(o, t.trim()) }}>Close referral</Button></>}>
    <Field label="Outcome" required><Select value={o} onChange={e => setO(e.target.value)} options={['Declined by agency', 'Withdrawn by family', 'No longer needed', 'Could not contact']} /></Field>
    <Field label="Reason" required error={tried && bad ? 'Please write a short reason.' : undefined}><Textarea autoFocus value={t} onChange={e => setT(e.target.value)} error={tried && bad} /></Field>
  </Modal>
}

function ConvertModal({ r, onClose, onSave }: { r: Referral; onClose: () => void; onSave: () => void }) {
  const s = useStore()
  const dupe = s.clients.find(c => c.name.toLowerCase() === r.name.toLowerCase())
  const [ok, setOk] = useState(!dupe)
  return <Modal title={`Make ${r.name} a client?`} sub="A client record is created and linked to this referral. All history is kept." onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={UserCheck} disabled={!ok} onClick={onSave}>Create client</Button></>}>
    {dupe ? <>
      <AlertBanner tone="warning" title="This might be a duplicate">A client called {dupe.name} already exists in {s.branchName(dupe.branch)} (phone {dupe.phone}). Check it isn’t the same person.</AlertBanner>
      <label className="check"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} />I’ve checked — this is a different person</label>
    </> : <AlertBanner tone="success" title="No duplicates found">No existing client has this name.</AlertBanner>}
    <dl className="kv"><dt>Services</dt><dd>{r.services}</dd><dt>Coordinator</dt><dd>{r.owner === 'Unassigned' ? 'Aisha Rahman' : r.owner}</dd><dt>Branch</dt><dd>{s.branchName(r.branch)}</dd></dl>
  </Modal>
}
