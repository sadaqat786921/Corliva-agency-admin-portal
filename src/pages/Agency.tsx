import { useState } from 'react'
import { Building2, Mail, Phone, MapPin, Clock, Plus, Pencil, Power, FileBadge, UserRound } from 'lucide-react'
import { useStore } from '../data/store'
import { Branch } from '../data/seed'
import { AlertBanner, Button, CardHead, Chip, Field, Input, Modal, PageHead, ReasonDialog, RowMenu, Select, Tabs } from '../components/ui'

const TZ = ['America/New_York (Eastern Time)', 'America/Chicago (Central Time)', 'America/Denver (Mountain Time)', 'America/Los_Angeles (Pacific Time)']
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

export default function Agency() {
  const s = useStore()
  const [tab, setTab] = useState<'agency' | 'branches'>('agency')
  const [f, setF] = useState(s.agency)
  const [tried, setTried] = useState(false)
  const [edit, setEdit] = useState<Branch | 'new' | null>(null)
  const [off, setOff] = useState<Branch | null>(null)
  const [blocked, setBlocked] = useState<{ b: Branch; n: number } | null>(null)
  const dirty = JSON.stringify(f) !== JSON.stringify(s.agency)
  const errs = { name: !f.name.trim(), email: !emailOk(f.email), phone: !f.phone.trim() }

  const save = () => {
    setTried(true)
    if (errs.name || errs.email || errs.phone) return
    const changed = (Object.keys(f) as (keyof typeof f)[]).filter(k => f[k] !== s.agency[k])
    s.setAgency(f)
    s.log({ type: 'Settings', action: 'Updated agency details', record: changed.join(', ') })
    s.toast('Agency details saved'); setTried(false)
  }
  const tryOff = (b: Branch) => {
    const n = s.clients.filter(c => c.branch === b.id && c.status === 'Active').length
    if (n) setBlocked({ b, n }); else setOff(b)
  }

  return (
    <>
      <PageHead title="Agency & Branches" crumb="Agency & Branches" sub="Your agency’s details and the office locations your teams work from." actions={tab === 'branches' ? <Button icon={Plus} onClick={() => setEdit('new')}>Add a branch</Button> : undefined} />
      <div className="card">
        <div style={{ padding: '0 16px' }}><Tabs value={tab} onChange={setTab} tabs={[{ id: 'agency', label: 'Agency details' }, { id: 'branches', label: 'Branches', count: s.branches.length }]} /></div>
        {tab === 'agency' ? (
          <div className="card-body col" style={{ gap: 16, maxWidth: 760 }}>
            {tried && (errs.name || errs.email || errs.phone) && <AlertBanner tone="danger" title="Please fix the fields in red" />}
            <div className="grid g-2">
              <Field label="Agency name" required helper="Shown to your team, caregivers and families."><Input icon={Building2} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} error={tried && errs.name} /></Field>
              <Field label="Legal name"><Input value={f.legalName} onChange={e => setF({ ...f, legalName: e.target.value })} /></Field>
              <Field label="Office email" required error={tried && errs.email ? 'Please enter a valid email.' : undefined}><Input icon={Mail} value={f.email} onChange={e => setF({ ...f, email: e.target.value })} error={tried && errs.email} /></Field>
              <Field label="Office phone" required><Input icon={Phone} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} error={tried && errs.phone} /></Field>
            </div>
            <Field label="Office address"><Input icon={MapPin} value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></Field>
            <div className="grid g-2">
              <Field label="Time zone" required helper="All visit times and reports use this time zone."><Select icon={Clock} value={f.timezone} onChange={e => setF({ ...f, timezone: e.target.value })} options={TZ} /></Field>
              <Field label="Agency licence number"><Input icon={FileBadge} value={f.licence} onChange={e => setF({ ...f, licence: e.target.value })} /></Field>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button variant="secondary" disabled={!dirty} onClick={() => { setF(s.agency); setTried(false) }}>Undo changes</Button>
              <Button disabled={!dirty} onClick={save}>Save changes</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="card-body" style={{ paddingBottom: 0 }}><AlertBanner tone="info" title="What is a branch?">A branch is one of your office locations. Each client, caregiver and visit belongs to a branch, and staff only see work for their own branch.</AlertBanner></div>
            <div className="table-wrap mt-2"><table className="tbl">
              <thead><tr><th>Branch</th><th>Address</th><th>Phone</th><th>Manager</th><th className="num">Clients</th><th className="num">Caregivers</th><th>Status</th><th style={{ width: 60 }} /></tr></thead>
              <tbody>{s.branches.map(b => (
                <tr key={b.id} className={`clickable ${b.active ? '' : 'muted'}`} onClick={() => setEdit(b)}>
                  <td className="t-medium">{b.name}</td><td>{b.address || '—'}</td><td>{b.phone || '—'}</td><td>{b.manager || '—'}</td>
                  <td className="num">{s.clients.filter(c => c.branch === b.id && c.status === 'Active').length}</td>
                  <td className="num">{s.caregivers.filter(c => c.branch === b.id).length}</td>
                  <td><Chip tone={b.active ? 'success' : 'neutral'}>{b.active ? 'Open' : 'Switched off'}</Chip></td>
                  <td><RowMenu items={[{ label: 'Edit details', icon: Pencil, onClick: () => setEdit(b) }, 'sep', b.active
                    ? { label: 'Switch off branch', icon: Power, danger: true, onClick: () => tryOff(b) }
                    : { label: 'Switch back on', icon: Power, onClick: () => { s.setBranches(x => x.map(y => y.id === b.id ? { ...y, active: true } : y)); s.log({ type: 'Settings', action: 'Switched a branch back on', record: b.name }); s.toast(`${b.name} is open again`) } }]} /></td>
                </tr>))}</tbody>
            </table></div>
          </>
        )}
      </div>
      {edit && <BranchModal branch={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
      {blocked && <Modal title={`${blocked.b.name} can’t be switched off yet`} onClose={() => setBlocked(null)} footer={<Button onClick={() => setBlocked(null)}>OK</Button>}>
        <AlertBanner tone="danger" title={`${blocked.n} active client${blocked.n > 1 ? 's' : ''} still belong to this branch`}>Move them to another branch first, so no visits are lost.</AlertBanner>
      </Modal>}
      {off && <ReasonDialog title={`Switch off ${off.name}?`} text="No new clients or visits can be added to it. Its history stays. You can switch it back on later." confirm="Switch off branch" danger onClose={() => setOff(null)} onConfirm={reason => {
        s.setBranches(x => x.map(y => y.id === off.id ? { ...y, active: false } : y))
        if (s.branch === off.id) s.setBranch('all')
        s.log({ type: 'Settings', action: 'Switched off a branch', record: off.name, before: 'Open', after: 'Switched off', reason })
        s.toast(`${off.name} is switched off`); setOff(null)
      }} />}
    </>
  )
}

function BranchModal({ branch, onClose }: { branch: Branch | null; onClose: () => void }) {
  const s = useStore()
  const [f, setF] = useState<Branch>(branch ?? { id: 'b' + Date.now(), name: '', address: '', phone: '', manager: '', active: true })
  const [tried, setTried] = useState(false)
  const dupe = s.branches.some(b => b.id !== f.id && b.name.trim().toLowerCase() === f.name.trim().toLowerCase())
  const nameErr = !f.name.trim() ? 'Please give the branch a name.' : dupe ? 'You already have a branch with this name.' : ''
  const managers = s.users.filter(u => u.status === 'Active' && u.role !== 'Finance Officer').map(u => u.name)
  const save = () => {
    setTried(true); if (nameErr) return
    const clean = { ...f, name: f.name.trim() }
    if (branch) s.setBranches(x => x.map(y => y.id === f.id ? clean : y)); else s.setBranches(x => [...x, clean])
    s.log({ type: 'Settings', action: branch ? 'Edited a branch' : 'Added a branch', record: clean.name })
    s.toast(branch ? 'Branch saved' : `${clean.name} added`); onClose()
  }
  return (
    <Modal title={branch ? `Edit ${branch.name}` : 'Add a branch'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>{branch ? 'Save changes' : 'Add branch'}</Button></>}>
      <Field label="Branch name" required error={tried ? nameErr : undefined}><Input icon={Building2} autoFocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="For example: East Branch" error={tried && !!nameErr} /></Field>
      <Field label="Address"><Input icon={MapPin} value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></Field>
      <div className="grid g-2">
        <Field label="Phone"><Input icon={Phone} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Branch manager"><Select icon={UserRound} value={f.manager} onChange={e => setF({ ...f, manager: e.target.value })} options={[{ value: '', label: 'Not chosen' }, ...managers.map(m => ({ value: m, label: m }))]} /></Field>
      </div>
    </Modal>
  )
}
