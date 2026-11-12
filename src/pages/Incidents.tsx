import { useMemo, useState } from 'react'
import { Plus, MessageSquarePlus, UserRound, ArrowRight, CheckCircle2, Lock, TriangleAlert, Clock } from 'lucide-react'
import { useStore, fmtDate } from '../data/store'
import { Incident, IncidentStatus, TODAY, addDays } from '../data/seed'
import { AlertBanner, Avatar, Button, Chip, ChipTone, Drawer, EmptyState, Field, Input, Modal, PageHead, Select, Tabs, Textarea } from '../components/ui'

const sevTone = (s: Incident['severity']): ChipTone => s === 'High' ? 'danger' : s === 'Medium' ? 'warning' : 'neutral'
const stTone = (s: IncidentStatus): ChipTone => s === 'Resolved' || s === 'Closed' ? 'success' : s === 'Action required' ? 'danger' : s === 'Under review' ? 'warning' : 'info'
const FLOW: IncidentStatus[] = ['Reported', 'Under review', 'Action required', 'Resolved']
const stamp = () => { const d = new Date(); return `Today ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }

export default function Incidents() {
  const s = useStore()
  const [tab, setTab] = useState<'open' | 'Resolved' | 'Closed'>('open')
  const [openId, setOpenId] = useState<string | null>(null)
  const [report, setReport] = useState(false)
  const isOpen = (i: Incident) => !['Resolved', 'Closed'].includes(i.status)
  const rows = useMemo(() => s.incidents.filter(i => s.inBranch(i.branch) && (tab === 'open' ? isOpen(i) : i.status === tab)), [s.incidents, s.branch, tab])
  const n = (f: (i: Incident) => boolean) => s.incidents.filter(i => s.inBranch(i.branch) && f(i)).length
  const overdue = s.incidents.filter(i => s.inBranch(i.branch) && isOpen(i) && i.due < TODAY).length
  const open = s.incidents.find(i => i.id === openId)

  return (
    <>
      <PageHead title="Incidents" crumb="Incidents" sub="Falls, complaints and other problems — who owns each one and what’s being done." actions={<Button icon={Plus} onClick={() => setReport(true)}>Report an incident</Button>} />
      {overdue > 0 && <AlertBanner tone="danger" title={`${overdue} incident${overdue > 1 ? 's are' : ' is'} past the target date`} />}
      <div className="card">
        <div style={{ padding: '0 16px' }}><Tabs value={tab} onChange={setTab} tabs={[{ id: 'open', label: 'Open', count: n(isOpen) }, { id: 'Resolved', label: 'Resolved', count: n(i => i.status === 'Resolved') }, { id: 'Closed', label: 'Closed', count: n(i => i.status === 'Closed') }]} /></div>
        {rows.length === 0 ? <EmptyState icon={CheckCircle2} title={tab === 'open' ? 'No open incidents' : 'Nothing here'} text={tab === 'open' ? 'Nothing needs attention right now.' : 'Incidents appear here as they move along.'} />
          : <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Incident</th><th>Type</th><th>Severity</th><th>Client</th><th>Owner</th><th>Target date</th><th>Status</th></tr></thead>
            <tbody>{rows.map(i => (
              <tr key={i.id} className="clickable" onClick={() => setOpenId(i.id)}>
                <td><div className="t-medium row" style={{ gap: 6 }}>{i.sensitive && <Lock size={13} />}{i.title}</div><div className="t-caption t-muted">{i.id} · reported {fmtDate(i.date)} by {i.reportedBy}</div></td>
                <td>{i.category}</td><td><Chip tone={sevTone(i.severity)}>{i.severity}</Chip></td><td>{i.client}</td><td>{i.owner}</td>
                <td style={{ color: isOpen(i) && i.due < TODAY ? 'var(--status-danger)' : undefined, fontWeight: isOpen(i) && i.due < TODAY ? 600 : 400 }}>{i.due === TODAY ? 'Today' : fmtDate(i.due)}</td>
                <td><Chip tone={stTone(i.status)}>{i.status}</Chip></td>
              </tr>))}</tbody>
          </table></div>}
      </div>
      {open && <IncidentDrawer i={open} onClose={() => setOpenId(null)} />}
      {report && <ReportModal onClose={() => setReport(false)} onDone={id => { setReport(false); setTab('open'); setOpenId(id) }} />}
    </>
  )
}

function IncidentDrawer({ i, onClose }: { i: Incident; onClose: () => void }) {
  const s = useStore()
  const [act, setAct] = useState<'note' | 'owner' | 'move' | 'close' | null>(null)
  const next = FLOW[FLOW.indexOf(i.status) + 1]
  const upd = (patch: Partial<Incident>, note: string) => s.setIncidents(x => x.map(y => y.id === i.id ? { ...y, ...patch, notes: [...y.notes, { by: s.me.name, at: stamp(), text: note }] } : y))
  return (
    <Drawer title={i.title} sub={<span className="row" style={{ gap: 8 }}>{i.id}<Chip tone={stTone(i.status)}>{i.status}</Chip><Chip tone={sevTone(i.severity)}>{i.severity}</Chip></span>} onClose={onClose} footer={i.status === 'Closed' ? <Button variant="secondary" onClick={onClose}>Close</Button> : <>
      <Button variant="secondary" icon={MessageSquarePlus} onClick={() => setAct('note')}>Add note</Button>
      {i.status === 'Resolved' ? <Button icon={CheckCircle2} onClick={() => setAct('close')}>Close incident</Button> : <Button icon={ArrowRight} onClick={() => setAct('move')}>Move to {next}</Button>}
    </>}>
      {i.sensitive && <AlertBanner tone="info" title="Private incident">Only approved roles can see this.</AlertBanner>}
      {i.status === 'Resolved' && <AlertBanner tone="success" title="Resolved — ready to close">Closing needs a final note about what was done.</AlertBanner>}
      <dl className="kv">
        <dt>Type</dt><dd>{i.category}</dd>
        <dt>Client</dt><dd>{i.client}</dd>
        <dt>Happened</dt><dd>{fmtDate(i.date, { weekday: 'long', day: 'numeric', month: 'long' })}</dd>
        <dt>Reported by</dt><dd>{i.reportedBy}</dd>
        <dt>Owner</dt><dd className="row between">{i.owner}{i.status !== 'Closed' && <button className="link-btn" onClick={() => setAct('owner')}>Change</button>}</dd>
        <dt>Target date</dt><dd>{fmtDate(i.due, { day: 'numeric', month: 'long' })}</dd>
        <dt>Branch</dt><dd>{s.branchName(i.branch)}</dd>
      </dl>
      <div className="divider" />
      <div><div className="t-h3" style={{ marginBottom: 12 }}>Notes and actions</div>
        <div className="timeline">{i.notes.map((n, k) => (
          <div key={k} className="timeline-item"><Avatar name={n.by} size="sm" /><div><div className="t-small">{n.text}</div><div className="t-caption t-muted row" style={{ gap: 4 }}><Clock size={11} />{n.by} · {n.at}</div></div></div>))}</div></div>

      {act === 'note' && <TextModal title="Add a note" label="Note" confirm="Add note" onClose={() => setAct(null)} onSave={t => { upd({}, t); s.toast('Note added'); setAct(null) }} />}
      {act === 'move' && <TextModal title={`Move to “${next}”?`} label="What’s happening?" confirm={`Move to ${next}`} onClose={() => setAct(null)} onSave={t => {
        upd({ status: next }, `Moved to ${next}. ${t}`); s.log({ type: 'Incident', action: 'Changed incident status', record: `${i.id} ${i.title}`, before: i.status, after: next, reason: t }); s.toast(`Moved to ${next}`); setAct(null)
      }} />}
      {act === 'close' && <TextModal title="Close this incident?" sub="Closed incidents can’t be changed. They stay in history and reports." label="Final note — what was done?" confirm="Close incident" onClose={() => setAct(null)} onSave={t => {
        upd({ status: 'Closed' }, `Closed. ${t}`); s.log({ type: 'Incident', action: 'Closed an incident', record: `${i.id} ${i.title}`, before: 'Resolved', after: 'Closed', reason: t }); s.toast('Incident closed'); setAct(null)
      }} />}
      {act === 'owner' && <OwnerModal i={i} onClose={() => setAct(null)} onSave={(o, due) => {
        upd({ owner: o, due }, `Owner set to ${o}, target date ${fmtDate(due, { day: 'numeric', month: 'short' })}.`)
        s.log({ type: 'Incident', action: 'Changed incident owner', record: `${i.id} ${i.title}`, before: i.owner, after: o }); s.toast(`${o} now owns this incident`); setAct(null)
      }} />}
    </Drawer>
  )
}

function TextModal({ title, sub, label, confirm, onClose, onSave }: { title: string; sub?: string; label: string; confirm: string; onClose: () => void; onSave: (t: string) => void }) {
  const [t, setT] = useState(''); const [tried, setTried] = useState(false); const bad = t.trim().length < 5
  return <Modal title={title} sub={sub} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { setTried(true); if (!bad) onSave(t.trim()) }}>{confirm}</Button></>}>
    <Field label={label} required error={tried && bad ? 'Please write at least a few words.' : undefined}><Textarea autoFocus value={t} onChange={e => setT(e.target.value)} error={tried && bad} /></Field>
  </Modal>
}

function OwnerModal({ i, onClose, onSave }: { i: Incident; onClose: () => void; onSave: (o: string, due: string) => void }) {
  const s = useStore()
  const people = s.users.filter(u => u.status === 'Active' && ['Agency Admin', 'Care Supervisor', 'Care Coordinator'].includes(u.role)).map(u => u.name)
  const [o, setO] = useState(i.owner); const [due, setDue] = useState(i.due)
  return <Modal title="Owner and target date" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(o, due)}>Save</Button></>}>
    <Field label="Owner"><Select icon={UserRound} value={o} onChange={e => setO(e.target.value)} options={people.includes(i.owner) ? people : [i.owner, ...people]} /></Field>
    <Field label="Target date"><Input type="date" min={TODAY} value={due} onChange={e => setDue(e.target.value)} /></Field>
  </Modal>
}

function ReportModal({ onClose, onDone }: { onClose: () => void; onDone: (id: string) => void }) {
  const s = useStore()
  const cats = s.lists.incidents.filter(x => x.active)
  const clients = s.clients.filter(c => c.status !== 'Discharged' && s.inBranch(c.branch))
  const owners = s.users.filter(u => u.status === 'Active' && ['Care Supervisor', 'Agency Admin'].includes(u.role)).map(u => u.name)
  const [f, setF] = useState({ title: '', category: cats[0]?.name ?? '', severity: 'Medium' as Incident['severity'], client: clients[0]?.id ?? '', date: TODAY, text: '', owner: owners.find(o => o !== s.me.name) ?? owners[0] })
  const [tried, setTried] = useState(false)
  const errs = { title: !f.title.trim(), text: f.text.trim().length < 10 }
  const save = () => {
    setTried(true); if (errs.title || errs.text) return
    const c = s.clients.find(x => x.id === f.client)!
    const id = 'INC-' + (209 + s.incidents.length - 4)
    s.setIncidents(x => [{ id, title: f.title.trim(), category: f.category, severity: f.severity, client: c.name, reportedBy: s.me.name, date: f.date, owner: f.owner, due: addDays(f.severity === 'High' ? 1 : 3), status: 'Reported', branch: c.branch, sensitive: f.category === 'Safeguarding concern', notes: [{ by: s.me.name, at: stamp(), text: f.text.trim() }] }, ...x])
    s.log({ type: 'Incident', action: 'Reported an incident', record: `${id} ${f.title.trim()}`, after: `${f.severity} · owner ${f.owner}` })
    s.toast(`Incident ${id} reported. ${f.owner} has been told.`); onDone(id)
  }
  return (
    <Modal wide title="Report an incident" sub="Write what happened in plain words. You can add more notes later." onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Report incident</Button></>}>
      <Field label="Short title" required error={tried && errs.title ? 'Please add a short title.' : undefined}><Input autoFocus value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="For example: Client felt dizzy during visit" error={tried && errs.title} /></Field>
      <div className="grid g-3">
        <Field label="Type" required><Select value={f.category} onChange={e => setF({ ...f, category: e.target.value })} options={cats.map(c => c.name)} /></Field>
        <Field label="Severity" required><Select value={f.severity} onChange={e => setF({ ...f, severity: e.target.value as Incident['severity'] })} options={['Low', 'Medium', 'High']} /></Field>
        <Field label="When did it happen?" required><Input type="date" max={TODAY} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></Field>
      </div>
      <div className="grid g-2">
        <Field label="Client" required><Select value={f.client} onChange={e => setF({ ...f, client: e.target.value })} options={clients.map(c => ({ value: c.id, label: c.name }))} /></Field>
        <Field label="Owner" required helper="They’ll look into it."><Select value={f.owner} onChange={e => setF({ ...f, owner: e.target.value })} options={owners} /></Field>
      </div>
      <Field label="What happened?" required error={tried && errs.text ? 'Please describe what happened (a sentence or two).' : undefined}><Textarea value={f.text} onChange={e => setF({ ...f, text: e.target.value })} error={tried && errs.text} /></Field>
      {f.severity === 'High' && <AlertBanner tone="warning" title="High severity"><span className="row" style={{ gap: 6 }}><TriangleAlert size={14} />If someone is in danger, call 911 first.</span></AlertBanner>}
      {f.category === 'Safeguarding concern' && <AlertBanner tone="info" title="This will be private">Only approved roles will be able to see it.</AlertBanner>}
    </Modal>
  )
}
