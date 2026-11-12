import { useState } from 'react'
import { Mail, UserRound } from 'lucide-react'
import { useStore } from '../data/store'
import { OFFICE_ROLES, ROLES, Role } from '../data/seed'
import { AlertBanner, Button, Field, Input, Modal, Select } from './ui'

export default function InviteModal({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const [f, setF] = useState({ name: '', email: '', role: 'Care Coordinator' as Role, branch: 'all' })
  const [tried, setTried] = useState(false)
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())
  const dupe = s.users.some(u => u.email.toLowerCase() === f.email.trim().toLowerCase())
  const errors = {
    name: f.name.trim().length < 2 ? 'Please enter their full name.' : '',
    email: !emailOk ? 'Please enter a valid email, like name@agency.com.' : dupe ? 'This email already has an account. Find them in the list instead.' : '',
  }
  const roleInfo = ROLES.find(r => r.role === f.role)!

  const send = () => {
    setTried(true)
    if (errors.name || errors.email) return
    const id = 'u' + Date.now()
    s.setUsers(u => [...u, { id, name: f.name.trim(), email: f.email.trim(), role: f.role, branch: f.branch, status: 'Invited', lastActive: 'Invite sent' }])
    s.log({ type: 'Access', action: 'Invited a person', record: f.name.trim(), after: `${f.role} · ${s.branchName(f.branch)}` })
    s.toast(`Invite sent to ${f.email.trim()}`)
    onClose()
  }

  return (
    <Modal title="Invite a person" sub="They get an email with a link to set their password. The link works for 7 days." onClose={onClose} footer={<>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button icon={Mail} onClick={send}>Send invite</Button>
    </>}>
      <Field label="Full name" required error={tried ? errors.name : undefined}>
        <Input icon={UserRound} autoFocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="For example: Sarah Collins" error={tried && !!errors.name} />
      </Field>
      <Field label="Work email" required error={tried ? errors.email : undefined}>
        <Input icon={Mail} type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="name@royalityhomecare.com" error={tried && !!errors.email} />
      </Field>
      <div className="grid g-2">
        <Field label="Role" required>
          <Select value={f.role} onChange={e => setF({ ...f, role: e.target.value as Role })} options={OFFICE_ROLES} />
        </Field>
        <Field label="Branch" required helper="They only see work for this branch.">
          <Select value={f.branch} onChange={e => setF({ ...f, branch: e.target.value })} options={[{ value: 'all', label: 'All branches' }, ...s.branches.filter(b => b.active).map(b => ({ value: b.id, label: b.name }))]} />
        </Field>
      </div>
      <AlertBanner tone="info" title={`What a ${f.role} can do`}>{roleInfo.does} {roleInfo.cannot}</AlertBanner>
      <div className="hint">Caregivers are added by your HR Officer, and family members by the Care Coordinator, so their records and documents are set up first.</div>
    </Modal>
  )
}
