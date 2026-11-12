import { useState } from 'react'
import { Plus, Pencil, Power, Ban, TriangleAlert, Lock, CheckCircle2, UserX } from 'lucide-react'
import { useStore } from '../data/store'
import { OFFICE_ROLES, Requirement, Role } from '../data/seed'
import { AlertBanner, Avatar, Button, CardHead, Chip, EmptyState, Field, Input, Modal, PageHead, RowMenu, Select, Tabs, Toggle } from '../components/ui'

export default function Rules() {
  const s = useStore()
  const [tab, setTab] = useState<'req' | 'ready' | 'visits' | 'override'>('req')
  const [edit, setEdit] = useState<Requirement | 'new' | null>(null)
  const [r, setR] = useState(s.rules)
  const dirty = JSON.stringify(r) !== JSON.stringify(s.rules)
  const notReady = s.caregivers.filter(c => c.readiness !== 'Ready' && s.inBranch(c.branch))

  const saveRules = () => {
    const diffs: string[] = []
    if (r.lateArrivalMins !== s.rules.lateArrivalMins) diffs.push(`Late arrival limit ${s.rules.lateArrivalMins} → ${r.lateArrivalMins} min`)
    if (r.timeDiffMins !== s.rules.timeDiffMins) diffs.push(`Time difference ${s.rules.timeDiffMins} → ${r.timeDiffMins} min`)
    if (r.locationCheck !== s.rules.locationCheck) diffs.push(`Location check ${r.locationCheck ? 'on' : 'off'}`)
    if (r.overrideAllowed !== s.rules.overrideAllowed) diffs.push(`Overrides ${r.overrideAllowed ? 'allowed' : 'not allowed'}`)
    if (r.overrideRoles.join() !== s.rules.overrideRoles.join()) diffs.push(`Who can override: ${r.overrideRoles.join(', ') || 'nobody'}`)
    if (r.approvers.join() !== s.rules.approvers.join()) diffs.push(`Who can approve: ${r.approvers.join(', ')}`)
    s.setRules(r)
    s.log({ type: 'Settings', action: 'Changed a rule', record: diffs.join('; ') })
    s.toast('Rules saved')
  }
  const toggleRole = (key: 'overrideRoles' | 'approvers', role: Role) =>
    setR(x => ({ ...x, [key]: x[key].includes(role) ? x[key].filter(y => y !== role) : [...x[key], role] }))
  const saveBar = (
    <div className="row" style={{ justifyContent: 'flex-end', padding: 16, borderTop: '1px solid var(--border-default)' }}>
      <Button variant="secondary" disabled={!dirty} onClick={() => setR(s.rules)}>Undo changes</Button>
      <Button disabled={!dirty || r.approvers.length === 0} onClick={saveRules}>Save rules</Button>
    </div>
  )

  return (
    <>
      <PageHead title="Rules & Requirements" crumb="Rules & Requirements" sub="What must be in place before someone can work, and how visits are checked." actions={tab === 'req' ? <Button icon={Plus} onClick={() => setEdit('new')}>Add requirement</Button> : undefined} />
      <div className="card">
        <div style={{ padding: '0 16px' }}><Tabs value={tab} onChange={setTab} tabs={[
          { id: 'req', label: 'Requirements', count: s.requirements.filter(x => x.active).length },
          { id: 'ready', label: 'Caregiver readiness', count: notReady.length },
          { id: 'visits', label: 'Visit checks & approval' },
          { id: 'override', label: 'Overrides' },
        ]} /></div>

        {tab === 'req' && <>
          <div className="card-body grid g-2" style={{ paddingBottom: 0 }}>
            <AlertBanner tone="danger" title="Blocking">The person can’t be given visits until this is verified.</AlertBanner>
            <AlertBanner tone="warning" title="Warning">They can still work, but the team is reminded to sort it out.</AlertBanner>
          </div>
          <div className="table-wrap mt-4"><table className="tbl">
            <thead><tr><th>Requirement</th><th>Applies to</th><th>Type</th><th>Renew every</th><th>Needs a document</th><th>Status</th><th style={{ width: 60 }} /></tr></thead>
            <tbody>{s.requirements.map(q => (
              <tr key={q.id} className={`clickable ${q.active ? '' : 'muted'}`} onClick={() => setEdit(q)}>
                <td className="t-medium">{q.name}</td><td>{q.appliesTo}</td>
                <td><Chip tone={q.level === 'Blocking' ? 'danger' : 'warning'}>{q.level}</Chip></td>
                <td>{q.renewMonths ? `${q.renewMonths} months` : 'Does not expire'}</td><td>{q.evidence ? 'Yes' : 'No'}</td>
                <td><Chip tone={q.active ? 'success' : 'neutral'}>{q.active ? 'On' : 'Off'}</Chip></td>
                <td><RowMenu items={[{ label: 'Edit', icon: Pencil, onClick: () => setEdit(q) }, {
                  label: q.active ? 'Switch off' : 'Switch on', icon: Power, danger: q.active, onClick: () => {
                    s.setRequirements(x => x.map(y => y.id === q.id ? { ...y, active: !y.active } : y))
                    s.log({ type: 'Settings', action: q.active ? 'Switched off a requirement' : 'Switched on a requirement', record: q.name })
                    s.toast(q.active ? `“${q.name}” switched off` : `“${q.name}” switched on`)
                  } }]} /></td>
              </tr>))}</tbody>
          </table></div>
        </>}

        {tab === 'ready' && (notReady.length === 0
          ? <EmptyState icon={CheckCircle2} title="All clear" text={`All ${s.caregivers.filter(c => s.inBranch(c.branch)).length} caregivers have their requirements checked. Nothing is due.`} />
          : <>
            <div className="card-body" style={{ paddingBottom: 0 }}><AlertBanner tone="info" title="Your HR Officer looks after these">This list shows who can’t work yet and why. HR checks and verifies the documents.</AlertBanner></div>
            <div className="table-wrap mt-4"><table className="tbl">
              <thead><tr><th>Caregiver</th><th>Branch</th><th>Status</th><th>What’s missing</th><th>Owner</th></tr></thead>
              <tbody>{notReady.map(c => (
                <tr key={c.id}><td><span className="row"><Avatar name={c.name} />{c.name}</span></td><td>{s.branchName(c.branch)}</td>
                  <td><Chip tone={c.readiness === 'Blocked' ? 'danger' : 'warning'}>{c.readiness === 'Blocked' ? 'Not ready' : 'Ready with warning'}</Chip></td>
                  <td>{c.issue}</td><td>Lena Ortiz (HR)</td></tr>))}</tbody>
            </table></div>
          </>)}

        {tab === 'visits' && <>
          <div className="card-body col" style={{ gap: 20, maxWidth: 760 }}>
            <div><div className="t-h3">When should a visit be flagged?</div><div className="t-small t-muted">Flagged visits show a warning in the approval queue.</div></div>
            <div className="grid g-2">
              <Field label="Caregiver is late after" helper="Minutes after the planned start time."><Input type="number" min={5} max={120} value={r.lateArrivalMins} onChange={e => setR({ ...r, lateArrivalMins: Math.max(5, Number(e.target.value) || 0) })} /></Field>
              <Field label="Visit length is different by more than" helper="Minutes, compared with the plan."><Input type="number" min={5} max={180} value={r.timeDiffMins} onChange={e => setR({ ...r, timeDiffMins: Math.max(5, Number(e.target.value) || 0) })} /></Field>
            </div>
            <div className="list-row" style={{ marginTop: 0 }}><div className="grow"><div className="t-medium">Check location at check-in and check-out</div><div className="t-caption t-muted">If the caregiver’s phone can’t share location, the visit is flagged — never blocked.</div></div><Toggle label="Location check" on={r.locationCheck} onChange={v => setR({ ...r, locationCheck: v })} /></div>
            <div className="divider" />
            <div><div className="t-h3">Who can approve finished visits?</div><div className="t-small t-muted">Approved visits move on to billing and payroll.</div></div>
            <div className="col" style={{ gap: 10 }}>{OFFICE_ROLES.filter(x => x === 'Agency Admin' || x === 'Care Supervisor').map(role => (
              <label key={role} className="check"><input type="checkbox" checked={r.approvers.includes(role)} onChange={() => toggleRole('approvers', role)} />{role}</label>))}</div>
            {r.approvers.length === 0 && <AlertBanner tone="danger" title="At least one role must be able to approve visits" />}
            <div className="list-row" style={{ marginTop: 0 }}><Lock size={16} color="var(--text-muted)" /><div className="grow t-small">Sending a visit back for correction always needs a reason.</div><Chip tone="neutral">Always on</Chip></div>
          </div>
          {saveBar}
        </>}

        {tab === 'override' && <>
          <div className="card-body col" style={{ gap: 20, maxWidth: 760 }}>
            <AlertBanner tone="warning" title="What is an override?">Sometimes a visit must go ahead even though a blocking rule says no — for example, the only free caregiver has training booked for next week. An override lets an approved person allow it once, with a reason.</AlertBanner>
            <div className="list-row" style={{ marginTop: 0 }}><div className="grow"><div className="t-medium">Allow overrides</div><div className="t-caption t-muted">If off, blocking rules can never be skipped.</div></div><Toggle label="Allow overrides" on={r.overrideAllowed} onChange={v => setR({ ...r, overrideAllowed: v })} /></div>
            {r.overrideAllowed && <div><div className="t-medium" style={{ marginBottom: 10 }}>Who can override?</div>
              <div className="col" style={{ gap: 10 }}>{(['Agency Admin', 'Care Supervisor', 'Care Coordinator'] as Role[]).map(role => (
                <label key={role} className="check"><input type="checkbox" checked={r.overrideRoles.includes(role)} onChange={() => toggleRole('overrideRoles', role)} />{role}</label>))}</div></div>}
            <div className="list-row" style={{ marginTop: 0 }}><Lock size={16} color="var(--text-muted)" /><div className="grow t-small">Every override needs a written reason and is saved in Audit History.</div><Chip tone="neutral">Always on</Chip></div>
          </div>
          {saveBar}
        </>}
      </div>
      {edit && <ReqModal req={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </>
  )
}

function ReqModal({ req, onClose }: { req: Requirement | null; onClose: () => void }) {
  const s = useStore()
  const [f, setF] = useState<Requirement>(req ?? { id: 'q' + Date.now(), name: '', appliesTo: 'Caregiver', level: 'Blocking', renewMonths: 12, evidence: true, active: true })
  const [tried, setTried] = useState(false)
  const err = !f.name.trim() ? 'Please enter a name.' : s.requirements.some(x => x.id !== f.id && x.name.toLowerCase() === f.name.trim().toLowerCase()) ? 'This requirement already exists.' : ''
  const save = () => {
    setTried(true); if (err) return
    const clean = { ...f, name: f.name.trim() }
    s.setRequirements(x => req ? x.map(y => y.id === f.id ? clean : y) : [...x, clean])
    s.log({ type: 'Settings', action: req ? 'Edited a requirement' : 'Added a requirement', record: clean.name, before: req ? `${req.level}, ${req.renewMonths ?? 'no'} months` : undefined, after: `${clean.level}, ${clean.renewMonths ?? 'no'} months` })
    s.toast(req ? 'Requirement saved' : `“${clean.name}” added`); onClose()
  }
  return (
    <Modal title={req ? `Edit “${req.name}”` : 'Add a requirement'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>{req ? 'Save' : 'Add requirement'}</Button></>}>
      <Field label="Requirement name" required error={tried ? err : undefined}><Input autoFocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="For example: CPR certificate" error={tried && !!err} /></Field>
      <div className="grid g-2">
        <Field label="Applies to"><Select value={f.appliesTo} onChange={e => setF({ ...f, appliesTo: e.target.value as Requirement['appliesTo'] })} options={['Caregiver', 'Client']} /></Field>
        <Field label="Renew every"><Select value={String(f.renewMonths ?? 0)} onChange={e => setF({ ...f, renewMonths: Number(e.target.value) || null })} options={[{ value: '0', label: 'Does not expire' }, ...[6, 12, 24, 36].map(m => ({ value: String(m), label: `${m} months` }))]} /></Field>
      </div>
      <div className="field"><span className="label">If it’s missing or expired</span>
        <div className="grid g-2">
          {(['Blocking', 'Warning'] as const).map(l => (
            <button key={l} type="button" className="list-row" style={{ marginTop: 0, textAlign: 'left', borderColor: f.level === l ? 'var(--border-focus)' : undefined, background: f.level === l ? 'var(--bg-selected)' : '#fff' }} onClick={() => setF({ ...f, level: l })} aria-pressed={f.level === l}>
              {l === 'Blocking' ? <Ban size={18} color="var(--status-danger)" /> : <TriangleAlert size={18} color="var(--status-warning)" />}
              <span><span className="t-medium" style={{ display: 'block' }}>{l}</span><span className="t-caption t-muted">{l === 'Blocking' ? 'Stops visits being given' : 'Reminds the team only'}</span></span>
            </button>))}
        </div>
      </div>
      <label className="check"><input type="checkbox" checked={f.evidence} onChange={e => setF({ ...f, evidence: e.target.checked })} />A document must be uploaded and checked</label>
      {f.level === 'Blocking' && f.appliesTo === 'Caregiver' && <div className="row t-caption t-muted" style={{ gap: 6 }}><UserX size={14} />Caregivers missing this will show as “Not ready”.</div>}
    </Modal>
  )
}
