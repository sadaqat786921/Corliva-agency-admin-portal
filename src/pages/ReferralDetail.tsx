import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, Phone, MessageSquare, Mail, Home, FileText, PhoneCall, XCircle,
  UserCheck, UserRound, Undo2, CalendarDays, Clock, MapPin, TriangleAlert, Lock, Pencil, FastForward, Search, History,
} from 'lucide-react'
import { useStore, fmtDate } from '../data/store'
import { CONTACT_OUTCOMES, ContactRecord, ContactType, FUNDING, Referral, Stage, TODAY } from '../data/seed'
import { STAGES, STAGE_HELP, age, blockers, daysInStage, isOpen, nextStage, nowStamp, nowTime, prevStage, ready, requirements, stageTone, urgTone } from '../data/referrals'
import { AlertBanner, Avatar, Button, CardHead, Chip, EmptyState, Field, Input, Modal, Select, Textarea } from '../components/ui'

const TYPE_ICON: Record<ContactType, typeof Phone> = { 'Phone call': Phone, 'Text message': MessageSquare, Email: Mail, 'Home visit': Home, Letter: FileText }
const short = (d: string) => d ? fmtDate(d, { day: 'numeric', month: 'short' }) : ''
const long = (d: string) => d ? fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default function ReferralDetail() {
  const { id } = useParams()
  const s = useStore()
  const nav = useNavigate()
  const r = s.referrals.find(x => x.id === id)
  const homeStage: Stage = r ? (r.stage === 'Closed' ? (r.closedAt ?? 'Enquiry') : r.stage) : 'Enquiry'
  const [view, setView] = useState<Stage>(homeStage)
  const [act, setAct] = useState<null | 'contact' | 'owner' | 'skip' | 'back' | 'close' | 'convert'>(null)
  useEffect(() => { setView(homeStage) }, [id, r?.stage])

  if (!r) return <div className="card"><EmptyState icon={Search} tone="neutral" title="We can’t find this referral" text="It may have a different number. Go back to the list to find it." action={<Button onClick={() => nav('/referrals')}>All referrals</Button>} /></div>

  const open = isOpen(r)
  const next = nextStage(r.stage)
  const prev = prevStage(r.stage)
  const missing = blockers(r)

  /** Save a change to this referral. Optional note goes to the activity history. */
  const update = (patch: Partial<Referral> | ((x: Referral) => Partial<Referral>), note?: string) =>
    s.setReferrals(list => list.map(x => {
      if (x.id !== r.id) return x
      const p = typeof patch === 'function' ? patch(x) : patch
      return { ...x, ...p, history: note ? [...x.history, { by: s.me.name, at: nowStamp(), text: note }] : x.history }
    }))

  const moveTo = (to: Stage, note: string, reason?: string) => {
    update(x => ({ stage: to, stageLog: [...x.stageLog, { stage: to, date: TODAY, time: nowTime(), by: s.me.name, note: reason }] }), reason ? `${note} Reason: ${reason}` : note)
    s.log({ type: 'Referral', action: reason ? 'Stepped in on a referral' : 'Moved a referral', record: `${r.id} ${r.name}`, before: r.stage, after: to, reason })
    s.toast(`${r.name} moved to ${to}`)
  }

  return (
    <>
      {/* Header */}
      <div className="page-head">
        <div>
          <Link to="/referrals" className="row t-small t-medium" style={{ gap: 6, marginBottom: 8 }}><ArrowLeft size={15} />All referrals</Link>
          <div className="row wrap" style={{ gap: 10 }}>
            <h1 className="t-h1">{r.name}</h1>
            <Chip tone={stageTone(r.stage)}>{r.stage}</Chip>
            <Chip tone={urgTone(r.urgency)}>{r.urgency}</Chip>
          </div>
          <div className="t-small t-muted" style={{ marginTop: 4 }}>{r.id} · {r.source} · {s.branchName(r.branch)} · Owner: <b style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.owner}</b>{open && <> · {daysInStage(r) === 0 ? 'In this stage since today' : `${daysInStage(r)} day${daysInStage(r) > 1 ? 's' : ''} in this stage`}</>}</div>
          <div className="crumbs"><Link to="/">Home</Link><span>/</span><Link to="/referrals">Referrals</Link><span>/</span><span>{r.id}</span></div>
        </div>
        <div className="actions">
          {open && <Button variant="secondary" icon={PhoneCall} onClick={() => setAct('contact')}>Log a contact</Button>}
          {open && <Button variant="danger" icon={XCircle} onClick={() => setAct('close')}>{r.stage === 'Decision' ? 'Decline' : 'Close referral'}</Button>}
          {open && r.stage === 'Decision' && <Button icon={UserCheck} disabled={!ready(r)} onClick={() => setAct('convert')}>Accept & make client</Button>}
          {open && next && <Button icon={ArrowRight} disabled={!ready(r)} onClick={() => moveTo(next, `Moved to ${next}.`)}>Move to {next}</Button>}
          {r.stage === 'Converted' && <Button icon={UserCheck} onClick={() => { const c = s.clients.find(c => c.fromReferral === r.id); nav(c ? `/clients/${c.id}` : '/clients') }}>Open client record</Button>}
        </div>
      </div>

      {r.stage === 'Closed' && <AlertBanner tone="info" title={`Closed at the ${r.closedAt} stage`}>{r.outcome}. All records below are kept.</AlertBanner>}
      {r.stage === 'Converted' && <AlertBanner tone="success" title={`Became a client on ${long(r.decision.date ?? '')}`}>Care starts {long(r.decision.startDate)}. Every record from the referral is kept below.</AlertBanner>}
      {open && missing.length > 0 && daysInStage(r) > 3 && <AlertBanner tone="warning" title={`No change for ${daysInStage(r)} days`}>Still needed: {missing.map(m => m.label.toLowerCase()).join(', ')}.</AlertBanner>}

      {/* Stage tracker */}
      <div className="card card-pad">
        <div className="stepper" role="tablist" aria-label="Referral stages">
          {STAGES.map((st, i) => {
            const curIdx = STAGES.indexOf(homeStage)
            const closedHere = r.stage === 'Closed' && st === r.closedAt
            const done = r.stage === 'Converted' ? true : i < curIdx
            const current = !done && st === homeStage
            const entered = [...r.stageLog].reverse().find(l => l.stage === st)
            const left = r.stageLog[r.stageLog.findIndex(l => l === entered) + 1]
            const state = closedHere ? 'closed' : done ? 'done' : current ? 'current' : 'todo'
            const sub = closedHere ? `Closed ${short(r.stageLog[r.stageLog.length - 1].date)}`
              : st === 'Converted' && done ? `On ${short(entered?.date ?? '')}`
                : done ? `Done ${short(left?.date ?? entered?.date ?? '')}`
                  : current ? `Since ${short(entered?.date ?? TODAY)}` : 'Not started'
            return (
              <button key={st} role="tab" aria-selected={view === st} className={`stp ${state} ${view === st ? 'sel' : ''}`} onClick={() => setView(st)}>
                <span className="stp-dot">{state === 'done' ? <Check size={15} /> : state === 'closed' ? <XCircle size={15} /> : i + 1}</span>
                <span className="stp-txt"><span className="stp-name">{st}</span><span className="stp-sub">{sub}</span></span>
              </button>)
          })}
        </div>
      </div>

      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <div className="col" style={{ gap: 16 }}>
          <StageRecord r={r} stage={view} update={update} />
          <ContactLog r={r} view={view} onLog={() => setAct('contact')} />
        </div>

        <div className="col" style={{ gap: 16 }}>
          {open && (
            <div className="card">
              <CardHead title={r.stage === 'Decision' ? 'Ready to decide?' : `To move to ${next}`} sub="Everything here must be done first." />
              <div className="card-body col" style={{ gap: 10 }}>
                {requirements(r).map(q => (
                  <div key={q.label} className="row" style={{ gap: 10 }}>
                    {q.done ? <CheckCircle2 size={18} color="var(--status-success)" /> : <Circle size={18} color="var(--border-strong)" />}
                    <span className={`t-small grow ${q.done ? '' : 't-strong'}`}>{q.label}</span>
                    {!q.done && q.where === 'details' && <button className="link-btn" onClick={() => setAct('owner')}>Choose</button>}
                    {!q.done && q.where === 'contacts' && <button className="link-btn" onClick={() => setAct('contact')}>Log</button>}
                    {!q.done && q.where === 'record' && view !== r.stage && <button className="link-btn" onClick={() => setView(r.stage)}>Fill in</button>}
                  </div>))}
                {ready(r)
                  ? <AlertBanner tone="success" title={r.stage === 'Decision' ? 'Ready to accept' : `Ready for ${next}`}>Use the button {r.stage === 'Decision' ? '“Accept & make client”' : `“Move to ${next}”`}.</AlertBanner>
                  : <div className="hint">{missing.length} thing{missing.length > 1 ? 's' : ''} still to do. The owner fills these in as the work happens.</div>}
                <div className="row wrap" style={{ gap: 14, marginTop: 4 }}>
                  {!ready(r) && next && <button className="link-btn row" style={{ gap: 4 }} onClick={() => setAct('skip')}><FastForward size={14} />Move on anyway</button>}
                  {prev && <button className="link-btn row" style={{ gap: 4 }} onClick={() => setAct('back')}><Undo2 size={14} />Go back to {prev}</button>}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <CardHead title="Person" action={open ? <button className="link-btn" onClick={() => setView('Enquiry')}>See full details</button> : undefined} />
            <div className="card-body">
              <dl className="kv" style={{ gridTemplateColumns: '110px 1fr' }}>
                <dt>Age</dt><dd>{r.dob ? `${age(r.dob)} (born ${fmtDate(r.dob, { day: 'numeric', month: 'short', year: 'numeric' })})` : '—'}</dd>
                <dt>Phone</dt><dd>{r.phone || '—'}</dd>
                <dt>Address</dt><dd>{r.address || <span style={{ color: 'var(--status-danger)' }}>Not given yet</span>}</dd>
                <dt>Contact</dt><dd>{r.contact}<div className="t-caption t-muted">{r.relationship} · {r.contactPhone}</div></dd>
                <dt>Needs</dt><dd>{r.services.join(', ') || '—'}</dd>
                <dt>Times</dt><dd>{r.preferredTimes || '—'}</dd>
                <dt>Owner</dt><dd className="row between">{r.owner === 'Unassigned' ? <span style={{ color: 'var(--status-danger)' }}>No owner</span> : r.owner}{open && <button className="link-btn" onClick={() => setAct('owner')}>Change</button>}</dd>
              </dl>
            </div>
          </div>

          <div className="card">
            <CardHead title="Activity" sub="Every change, newest first. Nothing is removed." />
            <div className="card-body timeline">
              {[...r.history].reverse().map((h, i) => (
                <div key={i} className="timeline-item"><div className="stat-icon tone-neutral"><History /></div>
                  <div><div className="t-small">{h.text}</div><div className="t-caption t-muted">{h.by} · {h.at}</div></div></div>))}
            </div>
          </div>
        </div>
      </div>

      {act === 'contact' && <LogContact r={r} onClose={() => setAct(null)} onSave={c => {
        update(x => ({ contacts: [...x.contacts, c] }))
        s.toast(`${c.type} recorded`); setAct(null)
      }} />}
      {act === 'owner' && <OwnerModal r={r} onClose={() => setAct(null)} onSave={(o, reason) => {
        update({ owner: o }, `Owner changed from ${r.owner} to ${o}. Reason: ${reason}`)
        s.log({ type: 'Referral', action: 'Changed a referral owner', record: `${r.id} ${r.name}`, before: r.owner, after: o, reason })
        s.toast(`${o} now owns this referral`); setAct(null)
      }} />}
      {act === 'skip' && next && <TextModal title={`Move to ${next} anyway?`} sub={`These are not done yet: ${missing.map(m => m.label.toLowerCase()).join(', ')}. They stay on the list to finish.`} label="Why does it need to move now?" confirm={`Move to ${next}`} onClose={() => setAct(null)} onSave={reason => { moveTo(next, `Moved to ${next} before everything was done.`, reason); setAct(null) }} />}
      {act === 'back' && prev && <TextModal title={`Go back to ${prev}?`} sub="Nothing is deleted. Everything recorded so far stays." label="Why go back?" confirm={`Go back to ${prev}`} onClose={() => setAct(null)} onSave={reason => { moveTo(prev, `Moved back to ${prev}.`, reason); setAct(null) }} />}
      {act === 'close' && <CloseModal r={r} onClose={() => setAct(null)} onSave={(outcome, reason) => {
        update(x => ({ stage: 'Closed', closedAt: x.stage, outcome: `${outcome}: ${reason}`, decision: x.stage === 'Decision' ? { ...x.decision, result: 'Declined', reason, by: s.me.name, date: TODAY } : x.decision, stageLog: [...x.stageLog, { stage: 'Closed', date: TODAY, time: nowTime(), by: s.me.name, note: outcome }] }), `Closed (${outcome.toLowerCase()}). Reason: ${reason}`)
        s.log({ type: 'Referral', action: `Closed a referral (${outcome.toLowerCase()})`, record: `${r.id} ${r.name}`, before: r.stage, after: 'Closed', reason })
        s.toast('Referral closed. All records are kept.'); setAct(null)
      }} />}
      {act === 'convert' && <ConvertModal r={r} onClose={() => setAct(null)} onSave={() => {
        const cid = 'c' + Date.now()
        s.setClients(x => [...x, { id: cid, name: r.name, branch: r.branch, status: 'Active', coordinator: r.owner === 'Unassigned' ? 'Aisha Rahman' : r.owner, services: r.services.join(', '), nextVisit: 'Not planned yet', carePlan: 'Review due', since: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), phone: r.phone || r.contactPhone, address: r.address, family: `${r.contact} (${r.relationship.toLowerCase()})`, fromReferral: r.id, payer: r.qualification.funding || undefined }])
        update(x => ({ stage: 'Converted', outcome: 'Accepted and set up as a client', decision: { ...x.decision, result: 'Accepted', by: s.me.name, date: TODAY }, stageLog: [...x.stageLog, { stage: 'Converted', date: TODAY, time: nowTime(), by: s.me.name }] }), 'Accepted and converted to a client.')
        s.log({ type: 'Referral', action: 'Converted a referral to a client', record: `${r.id} → ${r.name}`, before: 'Decision', after: 'Client' })
        s.toast(`${r.name} is now a client`); setAct(null)
      }} />}
    </>
  )
}

/* ---------------- Stage records ---------------- */

function StageRecord({ r, stage, update }: { r: Referral; stage: Stage; update: (p: Partial<Referral>, note?: string) => void }) {
  const curIdx = STAGES.indexOf(r.stage === 'Closed' ? (r.closedAt ?? 'Enquiry') : r.stage)
  const idx = STAGES.indexOf(stage)
  const editable = isOpen(r) && stage === r.stage
  const notStarted = r.stage !== 'Converted' && (idx > curIdx || (r.stage === 'Closed' && idx > curIdx))
  const badge = editable ? <Chip tone="info">Current stage</Chip> : r.stage === 'Closed' && stage === r.closedAt ? <Chip tone="neutral">Closed here</Chip> : notStarted ? <Chip tone="neutral">Not started</Chip> : <Chip tone="success">Done</Chip>
  return (
    <div className="card">
      <CardHead title={`${stage} record`} sub={STAGE_HELP[stage]} action={badge} />
      <div className="card-body">
        {!editable && !notStarted && <div className="row t-caption t-muted" style={{ gap: 6, marginBottom: 12 }}><Lock size={12} />Kept as it was recorded. {isOpen(r) ? `To change it, go back to ${stage}.` : ''}</div>}
        {notStarted ? <div className="t-small t-muted">This stage hasn’t started yet. Its record will appear here once the referral gets to {stage}.</div>
          : stage === 'Enquiry' ? <EnquiryRecord r={r} editable={editable} update={update} />
            : stage === 'Qualification' ? <QualificationRecord r={r} editable={editable} update={update} />
              : stage === 'Assessment' ? <AssessmentRecord r={r} editable={editable} update={update} />
                : stage === 'Decision' ? <DecisionRecord r={r} editable={editable} update={update} />
                  : <ConvertedRecord r={r} />}
      </div>
    </div>
  )
}

function SaveBar({ dirty, onSave, onUndo, label = 'Save' }: { dirty: boolean; onSave: () => void; onUndo: () => void; label?: string }) {
  return <div className="row" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
    {dirty && <span className="t-caption" style={{ color: 'var(--status-warning)', marginRight: 'auto' }}>You have changes that are not saved yet.</span>}
    <Button variant="secondary" disabled={!dirty} onClick={onUndo}>Undo</Button>
    <Button disabled={!dirty} onClick={onSave}>{label}</Button>
  </div>
}

function EnquiryRecord({ r, editable, update }: { r: Referral; editable: boolean; update: (p: Partial<Referral>, note?: string) => void }) {
  const s = useStore()
  const pick = (x: Referral) => ({ name: x.name, dob: x.dob, phone: x.phone, email: x.email, address: x.address, contact: x.contact, relationship: x.relationship, contactPhone: x.contactPhone, source: x.source, urgency: x.urgency, services: x.services, preferredTimes: x.preferredTimes, reasonForCare: x.reasonForCare })
  const [f, setF] = useState(pick(r))
  useEffect(() => setF(pick(r)), [r.id, r.stage])
  const dirty = JSON.stringify(f) !== JSON.stringify(pick(r))
  const services = s.lists.services.filter(x => x.active || f.services.includes(x.name)).map(x => x.name)
  if (!editable) return (
    <dl className="kv">
      <dt>Full name</dt><dd>{r.name}</dd>
      <dt>Date of birth</dt><dd>{r.dob ? `${fmtDate(r.dob, { day: 'numeric', month: 'long', year: 'numeric' })} (age ${age(r.dob)})` : '—'}</dd>
      <dt>Phone / email</dt><dd>{r.phone || '—'}{r.email && ` · ${r.email}`}</dd>
      <dt>Home address</dt><dd>{r.address || '—'}</dd>
      <dt>Contact person</dt><dd>{r.contact} ({r.relationship}) · {r.contactPhone}</dd>
      <dt>Referred by</dt><dd>{r.source}</dd>
      <dt>Urgency</dt><dd><Chip tone={urgTone(r.urgency)}>{r.urgency}</Chip></dd>
      <dt>Services needed</dt><dd>{r.services.join(', ') || '—'}</dd>
      <dt>Preferred times</dt><dd>{r.preferredTimes || '—'}</dd>
      <dt>Why care is needed</dt><dd>{r.reasonForCare || '—'}</dd>
    </dl>)
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="grid g-2">
        <Field label="Full name" required><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} error={!f.name.trim()} /></Field>
        <Field label="Date of birth"><Input type="date" max={TODAY} value={f.dob} onChange={e => setF({ ...f, dob: e.target.value })} /></Field>
        <Field label="Phone" required><Input icon={Phone} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Email"><Input icon={Mail} value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
      </div>
      <Field label="Home address" required helper={!f.address.trim() ? 'Needed before this can move on.' : undefined}><Input icon={MapPin} value={f.address} onChange={e => setF({ ...f, address: e.target.value })} placeholder="Street, town, ZIP code" /></Field>
      <div className="grid g-3">
        <Field label="Contact person"><Input value={f.contact} onChange={e => setF({ ...f, contact: e.target.value })} /></Field>
        <Field label="Relationship"><Input value={f.relationship} onChange={e => setF({ ...f, relationship: e.target.value })} placeholder="e.g. Daughter" /></Field>
        <Field label="Contact phone"><Input value={f.contactPhone} onChange={e => setF({ ...f, contactPhone: e.target.value })} /></Field>
      </div>
      <div className="grid g-2">
        <Field label="Referred by"><Select value={f.source} onChange={e => setF({ ...f, source: e.target.value })} options={Array.from(new Set([f.source, ...s.lists.sources.filter(x => x.active).map(x => x.name)]))} /></Field>
        <Field label="Urgency"><Select value={f.urgency} onChange={e => setF({ ...f, urgency: e.target.value as Referral['urgency'] })} options={['Routine', 'Soon', 'Urgent']} /></Field>
      </div>
      <div className="field"><span className="label">Services needed <span className="req">*</span></span>
        <div className="row wrap" style={{ gap: 8 }}>{services.map(sv => {
          const on = f.services.includes(sv)
          return <button key={sv} type="button" aria-pressed={on} className="chip nodot" onClick={() => setF({ ...f, services: on ? f.services.filter(x => x !== sv) : [...f.services, sv] })}
            style={{ height: 32, padding: '0 12px', cursor: 'pointer', border: `1px solid ${on ? 'var(--border-focus)' : 'var(--border-strong)'}`, background: on ? 'var(--bg-selected)' : '#fff', color: on ? 'var(--text-link)' : 'var(--text-secondary)', fontSize: 13 }}>{on && <Check size={13} />}{sv}</button>
        })}</div></div>
      <Field label="Preferred days and times"><Input icon={Clock} value={f.preferredTimes} onChange={e => setF({ ...f, preferredTimes: e.target.value })} /></Field>
      <Field label="Why is care needed?"><Textarea value={f.reasonForCare} onChange={e => setF({ ...f, reasonForCare: e.target.value })} /></Field>
      <SaveBar dirty={dirty} onUndo={() => setF(pick(r))} label="Save enquiry details" onSave={() => { if (!f.name.trim()) return; update(f, 'Enquiry details updated.'); }} />
    </div>
  )
}

function QualificationRecord({ r, editable, update }: { r: Referral; editable: boolean; update: (p: Partial<Referral>, note?: string) => void }) {
  const [q, setQ] = useState(r.qualification)
  useEffect(() => setQ(r.qualification), [r.id, r.stage])
  const dirty = JSON.stringify(q) !== JSON.stringify(r.qualification)
  const checks: [keyof typeof q, string, string][] = [
    ['area', 'We cover their area', `${r.address || 'Address not given'} — ${r.branch === 'north' ? 'North' : 'South'} Branch`],
    ['service', 'We offer the services they need', r.services.join(', ') || 'No services chosen yet'],
    ['times', 'We can staff their preferred times', r.preferredTimes || 'No times given yet'],
  ]
  if (!editable) return (
    <div className="col" style={{ gap: 10 }}>
      {checks.map(([k, label, hint]) => <div key={k} className="row" style={{ gap: 10 }}>{q[k] ? <CheckCircle2 size={18} color="var(--status-success)" /> : <XCircle size={18} color="var(--status-danger)" />}<span><span className="t-medium" style={{ display: 'block' }}>{label}</span><span className="t-caption t-muted">{hint}</span></span></div>)}
      <dl className="kv mt-2"><dt>How care is paid</dt><dd>{r.qualification.funding || 'Not known'}</dd><dt>Notes</dt><dd>{r.qualification.notes || '—'}</dd></dl>
    </div>)
  return (
    <div className="col" style={{ gap: 12 }}>
      {checks.map(([k, label, hint]) => (
        <label key={k} className="list-row" style={{ marginTop: 0, cursor: 'pointer', borderColor: q[k] ? '#B5E2C8' : undefined, background: q[k] ? 'var(--status-success-soft)' : '#fff' }}>
          <input type="checkbox" checked={q[k] as boolean} onChange={e => setQ({ ...q, [k]: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--status-success)' }} />
          <span className="grow"><span className="t-medium" style={{ display: 'block' }}>{label}</span><span className="t-caption t-muted">{hint}</span></span>
        </label>))}
      <Field label="How will care be paid for?" required><Select value={q.funding} onChange={e => setQ({ ...q, funding: e.target.value })} options={[{ value: '', label: 'Not known yet' }, ...FUNDING.map(x => ({ value: x, label: x }))]} /></Field>
      <Field label="Notes"><Textarea value={q.notes} onChange={e => setQ({ ...q, notes: e.target.value })} placeholder="Anything that affects whether we can help" /></Field>
      <SaveBar dirty={dirty} onUndo={() => setQ(r.qualification)} label="Save checks" onSave={() => update({ qualification: q }, 'Qualification checks updated.')} />
    </div>
  )
}

function AssessmentRecord({ r, editable, update }: { r: Referral; editable: boolean; update: (p: Partial<Referral>, note?: string) => void }) {
  const s = useStore()
  const a = r.assessment
  const [b, setB] = useState({ date: a.date || '', time: a.time || '10:00', assessor: a.assessor, where: a.where })
  const [res, setRes] = useState({ needs: a.needs, risks: a.risks, mobility: a.mobility, hours: a.hours, recommended: a.recommended, notes: a.notes })
  const [rebook, setRebook] = useState(false)
  const [tried, setTried] = useState(false)
  useEffect(() => { setB({ date: a.date || '', time: a.time || '10:00', assessor: a.assessor, where: a.where }); setRes({ needs: a.needs, risks: a.risks, mobility: a.mobility, hours: a.hours, recommended: a.recommended, notes: a.notes }); setRebook(false) }, [r.id, r.stage, a.status])
  const assessors = s.users.filter(u => u.status === 'Active' && ['Care Supervisor', 'Care Coordinator', 'Agency Admin'].includes(u.role)).map(u => u.name)
  const resDirty = JSON.stringify(res) !== JSON.stringify({ needs: a.needs, risks: a.risks, mobility: a.mobility, hours: a.hours, recommended: a.recommended, notes: a.notes })

  const results = (
    <dl className="kv">
      <dt>Care needs</dt><dd>{a.needs || '—'}</dd>
      <dt>Risks at home</dt><dd>{a.risks || '—'}</dd>
      <dt>Getting around</dt><dd>{a.mobility || '—'}</dd>
      <dt>Recommended hours</dt><dd>{a.hours ? `${a.hours} hours a week` : '—'}</dd>
      <dt>Recommended services</dt><dd>{a.recommended || '—'}</dd>
      <dt>Notes</dt><dd>{a.notes || '—'}</dd>
      {a.doneBy && <><dt>Recorded by</dt><dd>{a.doneBy} · {long(a.doneDate ?? '')}</dd></>}
    </dl>)
  const booking = (
    <div className="list-row" style={{ marginTop: 0 }}>
      <CalendarDays size={18} color="var(--action-primary)" />
      <div className="grow"><div className="t-medium">{a.status === 'Done' ? 'Visit done' : 'Visit booked'}: {long(a.date)} at {a.time}</div><div className="t-caption t-muted">{a.where} · with {a.assessor}</div></div>
      <Chip tone={a.status === 'Done' ? 'success' : 'info'}>{a.status === 'Done' ? 'Done' : 'Booked'}</Chip>
      {editable && a.status === 'Booked' && !rebook && <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setRebook(true)}>Change</Button>}
    </div>)

  if (!editable) return a.status === 'Not booked' ? <div className="t-small t-muted">No assessment was booked.</div> : <div className="col" style={{ gap: 14 }}>{booking}{a.status === 'Done' ? results : <div className="t-small t-muted">Results were not recorded.</div>}</div>

  const bookOk = !!b.date && !!b.time && !!b.assessor
  const resOk = res.needs.trim().length > 0 && !!res.hours
  return (
    <div className="col" style={{ gap: 18 }}>
      <div>
        <div className="t-h3" style={{ marginBottom: 10 }}>1. Book the home visit</div>
        {a.status !== 'Not booked' && !rebook ? booking : (
          <div className="col" style={{ gap: 12 }}>
            <div className="grid g-2">
              <Field label="Date" required><Input type="date" min={TODAY} value={b.date} onChange={e => setB({ ...b, date: e.target.value })} error={tried && !b.date} /></Field>
              <Field label="Time" required><Input type="time" value={b.time} onChange={e => setB({ ...b, time: e.target.value })} /></Field>
              <Field label="Who will visit?" required><Select value={b.assessor} onChange={e => setB({ ...b, assessor: e.target.value })} options={[{ value: '', label: 'Choose a person' }, ...assessors.map(x => ({ value: x, label: x }))]} error={tried && !b.assessor} /></Field>
              <Field label="Where"><Select value={b.where} onChange={e => setB({ ...b, where: e.target.value })} options={['Client’s home', 'Hospital', 'Video call', 'Agency office']} /></Field>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              {rebook && <Button variant="secondary" onClick={() => setRebook(false)}>Cancel</Button>}
              <Button icon={CalendarDays} onClick={() => {
                setTried(true); if (!bookOk) return
                update({ assessment: { ...a, ...b, status: 'Booked' } }, `${rebook ? 'Assessment moved' : 'Assessment booked'} for ${long(b.date)} at ${b.time} with ${b.assessor}.`)
                s.setEvents(ev => [...ev.filter(e => e.id !== 'as-' + r.id), { id: 'as-' + r.id, date: b.date, title: `Home assessment: ${r.name}`, time: b.time, tone: 'info', note: b.assessor }])
                s.toast(rebook ? 'Assessment moved. It’s on the calendar.' : 'Assessment booked and added to the calendar.'); setRebook(false); setTried(false)
              }}>{rebook ? 'Save new time' : 'Book assessment'}</Button>
            </div>
          </div>)}
      </div>
      <div className="divider" />
      <div>
        <div className="t-h3" style={{ marginBottom: 10 }}>2. Record what was found</div>
        {a.status === 'Not booked' ? <div className="t-small t-muted">Book the visit first. The results form opens here after that.</div> : (
          <div className="col" style={{ gap: 12 }}>
            <Field label="Care needs" required error={tried && !res.needs.trim() ? 'Please describe their care needs.' : undefined}><Textarea value={res.needs} onChange={e => setRes({ ...res, needs: e.target.value })} placeholder="What help do they need day to day?" error={tried && !res.needs.trim()} /></Field>
            <Field label="Risks at home"><Textarea value={res.risks} onChange={e => setRes({ ...res, risks: e.target.value })} placeholder="e.g. loose rugs, stairs, pets, smoke alarm" /></Field>
            <div className="grid g-3">
              <Field label="Getting around"><Select value={res.mobility} onChange={e => setRes({ ...res, mobility: e.target.value })} options={['', 'Walks without help', 'Walks with a stick', 'Walks with a frame', 'Uses a wheelchair', 'Stays in bed']} /></Field>
              <Field label="Hours a week" required><Input type="number" min={1} max={168} value={res.hours ?? ''} onChange={e => setRes({ ...res, hours: e.target.value ? Number(e.target.value) : null })} error={tried && !res.hours} /></Field>
              <Field label="Recommended services"><Input value={res.recommended} onChange={e => setRes({ ...res, recommended: e.target.value })} placeholder={r.services.join(', ')} /></Field>
            </div>
            <Field label="Notes"><Textarea value={res.notes} onChange={e => setRes({ ...res, notes: e.target.value })} /></Field>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              {a.status === 'Done' && <span className="t-caption t-muted" style={{ marginRight: 'auto' }}>Saved by {a.doneBy} · {long(a.doneDate ?? '')}</span>}
              <Button variant="secondary" disabled={!resDirty} onClick={() => setRes({ needs: a.needs, risks: a.risks, mobility: a.mobility, hours: a.hours, recommended: a.recommended, notes: a.notes })}>Undo</Button>
              <Button disabled={a.status === 'Done' && !resDirty} onClick={() => {
                setTried(true); if (!resOk) return
                const early = a.status !== 'Done' && a.date > TODAY
                update({ assessment: { ...a, ...res, status: 'Done', doneBy: s.me.name, doneDate: TODAY, date: early ? TODAY : a.date } }, a.status === 'Done' ? 'Assessment results updated.' : early ? `Assessment results saved. The visit happened today instead of ${long(a.date)}.` : 'Assessment results saved.')
                s.toast('Assessment results saved'); setTried(false)
              }}>{a.status === 'Done' ? 'Update results' : 'Save assessment results'}</Button>
            </div>
          </div>)}
      </div>
    </div>
  )
}

function DecisionRecord({ r, editable, update }: { r: Referral; editable: boolean; update: (p: Partial<Referral>, note?: string) => void }) {
  const [d, setD] = useState({ agreementSigned: r.decision.agreementSigned, startDate: r.decision.startDate })
  useEffect(() => setD({ agreementSigned: r.decision.agreementSigned, startDate: r.decision.startDate }), [r.id, r.stage])
  const dirty = d.agreementSigned !== r.decision.agreementSigned || d.startDate !== r.decision.startDate
  const a = r.assessment
  const summary = (
    <div className="card card-pad" style={{ background: 'var(--bg-subtle)' }}>
      <div className="t-caption t-muted" style={{ marginBottom: 6 }}>From the assessment</div>
      <div className="grid g-3">
        <div><div className="t-caption t-muted">Hours a week</div><div className="t-h3">{a.hours ?? '—'}</div></div>
        <div><div className="t-caption t-muted">Services</div><div className="t-medium">{a.recommended || r.services.join(', ')}</div></div>
        <div><div className="t-caption t-muted">Paid by</div><div className="t-medium">{r.qualification.funding || '—'}</div></div>
      </div>
      {a.risks && <div className="t-small mt-2"><b>Risks:</b> {a.risks}</div>}
    </div>)
  if (!editable) return (
    <div className="col" style={{ gap: 14 }}>
      {summary}
      <dl className="kv">
        <dt>Service agreement</dt><dd>{r.decision.agreementSigned ? 'Signed' : 'Not signed'}</dd>
        <dt>Start date</dt><dd>{long(r.decision.startDate)}</dd>
        <dt>Decision</dt><dd>{r.decision.result ? <Chip tone={r.decision.result === 'Accepted' ? 'success' : 'danger'}>{r.decision.result}</Chip> : 'Not decided'}</dd>
        {r.decision.reason && <><dt>Reason</dt><dd>{r.decision.reason}</dd></>}
        {r.decision.by && <><dt>Decided by</dt><dd>{r.decision.by} · {long(r.decision.date ?? '')}</dd></>}
      </dl>
    </div>)
  return (
    <div className="col" style={{ gap: 14 }}>
      {summary}
      <label className="list-row" style={{ marginTop: 0, cursor: 'pointer', borderColor: d.agreementSigned ? '#B5E2C8' : undefined, background: d.agreementSigned ? 'var(--status-success-soft)' : '#fff' }}>
        <input type="checkbox" checked={d.agreementSigned} onChange={e => setD({ ...d, agreementSigned: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--status-success)' }} />
        <span className="grow"><span className="t-medium" style={{ display: 'block' }}>Service agreement signed</span><span className="t-caption t-muted">By the client or the person who looks after their affairs</span></span>
      </label>
      <Field label="Care start date" required><Input type="date" min={TODAY} value={d.startDate} onChange={e => setD({ ...d, startDate: e.target.value })} /></Field>
      <SaveBar dirty={dirty} onUndo={() => setD({ agreementSigned: r.decision.agreementSigned, startDate: r.decision.startDate })} onSave={() => update({ decision: { ...r.decision, ...d } }, `Decision details updated${d.agreementSigned && !r.decision.agreementSigned ? ': service agreement signed' : ''}.`)} />
      <div className="hint">When both are done, use “Accept & make client” at the top. To say no, use “Decline” and give a reason.</div>
    </div>
  )
}

function ConvertedRecord({ r }: { r: Referral }) {
  const s = useStore()
  const nav = useNavigate()
  const c = s.clients.find(x => x.fromReferral === r.id)
  return (
    <div className="col" style={{ gap: 12 }}>
      <dl className="kv">
        <dt>Accepted by</dt><dd>{r.decision.by ?? '—'} · {long(r.decision.date ?? '')}</dd>
        <dt>Care starts</dt><dd>{long(r.decision.startDate)}</dd>
        <dt>Client record</dt><dd>{c ? `${c.name} · ${c.status} · coordinator ${c.coordinator}` : '—'}</dd>
      </dl>
      {c && <div><Button variant="secondary" icon={UserCheck} onClick={() => nav(`/clients/${c.id}`)}>Open client record</Button></div>}
    </div>
  )
}

/* ---------------- Contact log ---------------- */

function ContactLog({ r, view, onLog }: { r: Referral; view: Stage; onLog: () => void }) {
  const [only, setOnly] = useState(false)
  const list = useMemo(() => [...r.contacts].filter(c => !only || c.stage === view).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)), [r.contacts, only, view])
  return (
    <div className="card">
      <CardHead title={`Contact log (${r.contacts.length})`} sub="Every call, message and visit, with what they said. Newest first." action={<div className="row">
        <div className="seg" role="group" aria-label="Show contacts"><button className={!only ? 'on' : ''} onClick={() => setOnly(false)}>All stages</button><button className={only ? 'on' : ''} onClick={() => setOnly(true)}>{view} only</button></div>
        {isOpen(r) && <Button size="sm" icon={PhoneCall} onClick={onLog}>Log a contact</Button>}
      </div>} />
      <div className="card-body col" style={{ gap: 0 }}>
        {list.length === 0 ? <div className="t-small t-muted">No contacts recorded {only ? `during ${view}` : 'yet'}.</div> : list.map((c, i) => {
          const Icon = TYPE_ICON[c.type]
          const late = c.followUp && c.followUp < TODAY && isOpen(r)
          const tone = c.outcome === 'Spoke to them' ? 'success' : c.outcome === 'Not interested' ? 'danger' : c.outcome === 'Sent information' ? 'info' : 'warning'
          return (
            <div key={c.id} className="row" style={{ alignItems: 'flex-start', gap: 12, padding: '14px 0', borderTop: i ? '1px solid var(--border-default)' : 0 }}>
              <div className={`stat-icon tone-${c.direction === 'Incoming' ? 'success' : 'info'}`} style={{ width: 36, height: 36 }}><Icon size={17} /></div>
              <div className="grow col" style={{ gap: 6 }}>
                <div className="row wrap between" style={{ gap: 8 }}>
                  <span className="t-medium">{c.type} {c.direction === 'Outgoing' ? 'to' : 'from'} {c.withWhom}</span>
                  <span className="row" style={{ gap: 6 }}><Chip tone={tone}>{c.outcome}</Chip><Chip tone={stageTone(c.stage)}>{c.stage}</Chip></span>
                </div>
                <div className="t-small"><span className="t-muted">What was said: </span>{c.summary}</div>
                <div className="t-small" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '8px 10px' }}><span className="t-muted">Their response: </span>{c.response}</div>
                {c.followUp && <div className="row t-caption" style={{ gap: 6, color: late ? 'var(--status-danger)' : 'var(--status-warning)' }}>{late ? <TriangleAlert size={12} /> : <Clock size={12} />}Follow up by {long(c.followUp)}{late ? ' — overdue' : ''}</div>}
                <div className="t-caption t-muted">{c.by} · {long(c.date)}, {c.time}</div>
              </div>
            </div>)
        })}
      </div>
    </div>
  )
}

function LogContact({ r, onClose, onSave }: { r: Referral; onClose: () => void; onSave: (c: ContactRecord) => void }) {
  const s = useStore()
  const people = Array.from(new Set([`${r.contact}${r.relationship && r.relationship !== 'Self' ? ` (${r.relationship.toLowerCase()})` : ''}`, r.name]))
  const [f, setF] = useState({ type: 'Phone call' as ContactType, direction: 'Outgoing' as ContactRecord['direction'], withWhom: people[0], date: TODAY, time: nowTime(), summary: '', outcome: 'Spoke to them', response: '', followUp: '' })
  const [tried, setTried] = useState(false)
  const errs = { summary: f.summary.trim().length < 3, response: f.response.trim().length < 2, withWhom: !f.withWhom.trim() }
  const save = () => {
    setTried(true); if (errs.summary || errs.response || errs.withWhom) return
    onSave({ id: 'k' + Date.now(), date: f.date, time: f.time, by: s.me.name, type: f.type, direction: f.direction, withWhom: f.withWhom.trim(), summary: f.summary.trim(), outcome: f.outcome, response: f.response.trim(), followUp: f.followUp || undefined, stage: r.stage })
  }
  return (
    <Modal wide title="Log a contact" sub={`Saved under the ${r.stage} stage of ${r.name}’s referral.`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save contact</Button></>}>
      <div className="field"><span className="label">How</span>
        <div className="row wrap" style={{ gap: 8 }}>{(Object.keys(TYPE_ICON) as ContactType[]).map(t => {
          const I = TYPE_ICON[t]; const on = f.type === t
          return <button key={t} type="button" aria-pressed={on} className="btn btn-sm" onClick={() => setF({ ...f, type: t })} style={{ border: `1px solid ${on ? 'var(--border-focus)' : 'var(--border-strong)'}`, background: on ? 'var(--bg-selected)' : '#fff', color: on ? 'var(--text-link)' : 'var(--text-primary)' }}><I />{t}</button>
        })}</div></div>
      <div className="grid g-2">
        <Field label="Who started it?"><Select value={f.direction} onChange={e => setF({ ...f, direction: e.target.value as ContactRecord['direction'] })} options={[{ value: 'Outgoing', label: 'We contacted them' }, { value: 'Incoming', label: 'They contacted us' }]} /></Field>
        <Field label="With whom" required><Input list="ref-people" value={f.withWhom} onChange={e => setF({ ...f, withWhom: e.target.value })} error={tried && errs.withWhom} /><datalist id="ref-people">{people.map(p => <option key={p} value={p} />)}</datalist></Field>
        <Field label="Date"><Input type="date" max={TODAY} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Time"><Input type="time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /></Field>
      </div>
      <Field label={f.type === 'Phone call' || f.type === 'Home visit' ? 'What did you talk about?' : 'What did the message say?'} required error={tried && errs.summary ? 'Please write a short summary.' : undefined}><Textarea value={f.summary} onChange={e => setF({ ...f, summary: e.target.value })} error={tried && errs.summary} /></Field>
      <div className="grid g-2">
        <Field label="Result"><Select value={f.outcome} onChange={e => setF({ ...f, outcome: e.target.value })} options={CONTACT_OUTCOMES} /></Field>
        <Field label="Follow up by" helper="Optional. Shows as a reminder."><Input type="date" min={TODAY} value={f.followUp} onChange={e => setF({ ...f, followUp: e.target.value })} /></Field>
      </div>
      <Field label="Their response" required error={tried && errs.response ? 'Please write what they said, or “No reply”.' : undefined}><Textarea value={f.response} onChange={e => setF({ ...f, response: e.target.value })} placeholder="What did they say or decide?" error={tried && errs.response} /></Field>
    </Modal>
  )
}

/* ---------------- Small dialogs ---------------- */

function TextModal({ title, sub, label, confirm, onClose, onSave }: { title: string; sub?: string; label: string; confirm: string; onClose: () => void; onSave: (t: string) => void }) {
  const [t, setT] = useState(''); const [tried, setTried] = useState(false); const bad = t.trim().length < 5
  return <Modal title={title} sub={sub} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { setTried(true); if (!bad) onSave(t.trim()) }}>{confirm}</Button></>}>
    <Field label={label} required error={tried && bad ? 'Please write at least a few words.' : undefined} helper="Saved in Audit History with your name."><Textarea autoFocus value={t} onChange={e => setT(e.target.value)} error={tried && bad} /></Field>
  </Modal>
}

function OwnerModal({ r, onClose, onSave }: { r: Referral; onClose: () => void; onSave: (o: string, reason: string) => void }) {
  const s = useStore()
  const list = s.users.filter(u => u.status === 'Active' && (u.role === 'Care Coordinator' || u.role === 'Agency Admin')).map(u => u.name).filter(n => n !== r.owner)
  const [o, setO] = useState(list[0] ?? ''); const [t, setT] = useState(''); const [tried, setTried] = useState(false)
  const bad = t.trim().length < 5
  return <Modal title="Choose an owner" sub="The owner keeps in touch with the family and moves the referral along. They’re told straight away." onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={UserRound} onClick={() => { setTried(true); if (!bad && o) onSave(o, t.trim()) }}>Save owner</Button></>}>
    <Field label="New owner" required><Select value={o} onChange={e => setO(e.target.value)} options={list} /></Field>
    <Field label="Reason" required error={tried && bad ? 'Please write a short reason.' : undefined}><Textarea value={t} onChange={e => setT(e.target.value)} placeholder="For example: Daniel is on leave this week" error={tried && bad} /></Field>
  </Modal>
}

function CloseModal({ r, onClose, onSave }: { r: Referral; onClose: () => void; onSave: (outcome: string, reason: string) => void }) {
  const [o, setO] = useState(r.stage === 'Decision' ? 'Declined by agency' : 'Withdrawn by family'); const [t, setT] = useState(''); const [tried, setTried] = useState(false)
  const bad = t.trim().length < 5
  return <Modal title={r.stage === 'Decision' ? `Decline ${r.name}?` : `Close ${r.name}’s referral?`} sub="All records, contacts and notes are kept. It still shows in reports." onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger-solid" onClick={() => { setTried(true); if (!bad) onSave(o, t.trim()) }}>{r.stage === 'Decision' ? 'Decline' : 'Close referral'}</Button></>}>
    <Field label="Outcome" required><Select value={o} onChange={e => setO(e.target.value)} options={['Declined by agency', 'Withdrawn by family', 'No longer needed', 'Could not contact']} /></Field>
    <Field label="Reason" required error={tried && bad ? 'Please write a short reason.' : undefined}><Textarea autoFocus value={t} onChange={e => setT(e.target.value)} error={tried && bad} /></Field>
  </Modal>
}

function ConvertModal({ r, onClose, onSave }: { r: Referral; onClose: () => void; onSave: () => void }) {
  const s = useStore()
  const dupe = s.clients.find(c => c.name.toLowerCase() === r.name.toLowerCase() && c.fromReferral !== r.id)
  const [ok, setOk] = useState(!dupe)
  return <Modal title={`Make ${r.name} a client?`} sub="A client record is created and linked to this referral. Every record from the referral is kept." onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={UserCheck} disabled={!ok} onClick={onSave}>Create client</Button></>}>
    {dupe ? <>
      <AlertBanner tone="warning" title="This might be a duplicate">A client called {dupe.name} already exists in {s.branchName(dupe.branch)} (phone {dupe.phone}). Check it isn’t the same person.</AlertBanner>
      <label className="check"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} />I’ve checked — this is a different person</label>
    </> : <AlertBanner tone="success" title="No duplicates found">No existing client has this name.</AlertBanner>}
    <dl className="kv"><dt>Services</dt><dd>{r.assessment.recommended || r.services.join(', ')}</dd><dt>Hours a week</dt><dd>{r.assessment.hours ?? '—'}</dd><dt>Care starts</dt><dd>{long(r.decision.startDate)}</dd><dt>Coordinator</dt><dd>{r.owner === 'Unassigned' ? 'Aisha Rahman' : r.owner}</dd></dl>
  </Modal>
}
