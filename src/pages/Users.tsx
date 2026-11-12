import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UserPlus, Search, Pencil, Mail, UserX, UserCheck, ShieldCheck, Smartphone, Monitor, Users as UsersIcon, X } from 'lucide-react'
import { useStore } from '../data/store'
import { OFFICE_ROLES, ROLES, Role, User } from '../data/seed'
import { AlertBanner, Avatar, Button, Chip, Drawer, EmptyState, Field, Modal, PageHead, Pager, ReasonDialog, RowMenu, Select, Tabs, usePaged } from '../components/ui'
import InviteModal from '../components/InviteModal'

const tone = (st: User['status']) => st === 'Active' ? 'success' : st === 'Invited' ? 'info' : 'neutral'

export default function UsersPage() {
  const s = useStore()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<'people' | 'roles'>('people')
  const [q, setQ] = useState('')
  const [role, setRole] = useState('All roles')
  const [status, setStatus] = useState('All statuses')
  const [invite, setInvite] = useState(false)
  const [openId, setOpenId] = useState<string | null>(params.get('open'))
  const [editing, setEditing] = useState<User | null>(null)
  const [switching, setSwitching] = useState<User | null>(null)

  useEffect(() => { const o = params.get('open'); if (o) setOpenId(o) }, [params])
  const closeDrawer = () => { setOpenId(null); if (params.get('open')) setParams({}) }

  const rows = useMemo(() => s.users.filter(u =>
    s.inBranch(u.branch) &&
    (role === 'All roles' || u.role === role) &&
    (status === 'All statuses' || u.status === status) &&
    (!q.trim() || (u.name + u.email).toLowerCase().includes(q.trim().toLowerCase()))
  ), [s.users, s.branch, role, status, q])
  const pg = usePaged(rows, 8)
  const open = s.users.find(u => u.id === openId) ?? null

  const resend = (u: User) => { s.log({ type: 'Access', action: 'Resent an invite', record: u.name }); s.toast(`Invite sent again to ${u.email}`) }
  const switchOn = (u: User) => {
    s.setUsers(x => x.map(y => y.id === u.id ? { ...y, status: 'Active', lastActive: 'Just now' } : y))
    s.log({ type: 'Access', action: 'Switched an account back on', record: u.name, before: 'Switched off', after: 'Active' })
    s.toast(`${u.name} can sign in again`)
  }
  const menu = (u: User) => [
    { label: 'View details', icon: ShieldCheck, onClick: () => setOpenId(u.id) },
    { label: 'Change role or branch', icon: Pencil, onClick: () => setEditing(u) },
    ...(u.status === 'Invited' ? [{ label: 'Resend invite', icon: Mail, onClick: () => resend(u) }] : []),
    ...(u.id === 'u0' ? [] : ['sep' as const, u.status === 'Switched off'
      ? { label: 'Switch back on', icon: UserCheck, onClick: () => switchOn(u) }
      : { label: 'Switch off account', icon: UserX, danger: true, onClick: () => setSwitching(u) }]),
  ]

  return (
    <>
      <PageHead title="Users & Roles" crumb="Users & Roles" sub="Invite office staff, choose what they can do, and switch off people who leave." actions={<Button icon={UserPlus} onClick={() => setInvite(true)}>Invite a person</Button>} />
      <div className="card">
        <div style={{ padding: '0 16px' }}><Tabs value={tab} onChange={setTab} tabs={[{ id: 'people', label: 'People', count: s.users.filter(u => s.inBranch(u.branch)).length }, { id: 'roles', label: 'Roles', count: ROLES.length }]} /></div>
        {tab === 'people' ? <>
          <div className="toolbar">
            <div className="search"><Search /><input aria-label="Search people" placeholder="Search by name or email" value={q} onChange={e => { setQ(e.target.value); pg.setPage(1) }} />{q && <button className="link-btn" aria-label="Clear search" onClick={() => setQ('')}><X size={14} /></button>}</div>
            <select className="select-sm" aria-label="Filter by role" value={role} onChange={e => { setRole(e.target.value); pg.setPage(1) }}>{['All roles', ...OFFICE_ROLES].map(r => <option key={r}>{r}</option>)}</select>
            <select className="select-sm" aria-label="Filter by status" value={status} onChange={e => { setStatus(e.target.value); pg.setPage(1) }}>{['All statuses', 'Active', 'Invited', 'Switched off'].map(r => <option key={r}>{r}</option>)}</select>
            <span className="grow" />
            <span className="t-caption t-muted">{rows.length} {rows.length === 1 ? 'person' : 'people'}</span>
          </div>
          {rows.length === 0 ? <EmptyState icon={UsersIcon} tone="neutral" title="No one matches" text="Try a different name, or clear the filters." action={<Button variant="secondary" onClick={() => { setQ(''); setRole('All roles'); setStatus('All statuses') }}>Clear filters</Button>} /> : <>
            <div className="table-wrap"><table className="tbl">
              <thead><tr><th>Name</th><th>Role</th><th>Branch</th><th>Status</th><th>Last active</th><th style={{ width: 60 }} /></tr></thead>
              <tbody>{pg.slice.map(u => (
                <tr key={u.id} className={`clickable ${u.status === 'Switched off' ? 'muted' : ''}`} onClick={() => setOpenId(u.id)}>
                  <td><span className="row"><Avatar name={u.name} /><span><span style={{ display: 'block', fontWeight: 500, color: 'var(--text-primary)' }}>{u.name}{u.id === 'u0' && <span className="t-caption t-muted"> (you)</span>}</span><span className="t-caption t-muted">{u.email}</span></span></span></td>
                  <td>{u.role}</td><td>{s.branchName(u.branch)}</td><td><Chip tone={tone(u.status)}>{u.status}</Chip></td><td className="t-muted">{u.lastActive}</td>
                  <td><RowMenu items={menu(u)} /></td>
                </tr>))}</tbody>
            </table></div>
            <Pager {...pg} onPage={pg.setPage} />
          </>}
        </> : (
          <div className="card-body grid g-2">
            {ROLES.map(r => {
              const n = s.users.filter(u => u.role === r.role && u.status !== 'Switched off').length
              const Icon = r.area === 'Office' ? Monitor : Smartphone
              return (
                <div key={r.role} className="card card-pad col" style={{ gap: 10 }}>
                  <div className="row between"><span className="row"><span className="stat-icon tone-info" style={{ width: 34, height: 34 }}><Icon size={16} /></span><span><span className="t-h3" style={{ display: 'block' }}>{r.role}</span><span className="t-caption t-muted">{r.area}</span></span></span>
                    {OFFICE_ROLES.includes(r.role) ? <Chip tone="neutral">{n} {n === 1 ? 'person' : 'people'}</Chip> : <Chip tone="info">Added by {r.role === 'Caregiver' ? 'HR' : 'Coordinator'}</Chip>}</div>
                  <div className="t-small"><b>Can:</b> {r.does}</div>
                  <div className="t-small t-secondary"><b>Can’t:</b> {r.cannot}</div>
                  {OFFICE_ROLES.includes(r.role) && <div><Button size="sm" variant="secondary" onClick={() => { setRole(r.role); setStatus('All statuses'); setTab('people') }}>See people</Button></div>}
                </div>)
            })}
            <div className="hint" style={{ gridColumn: '1 / -1' }}>Roles are fixed so everyone’s access stays safe. A person only sees work for their branch. Every change to someone’s access is saved in Audit History.</div>
          </div>
        )}
      </div>

      {open && (
        <Drawer title={<span className="row"><Avatar name={open.name} size="lg" />{open.name}</span>} sub={`${open.role} · ${s.branchName(open.branch)}`} onClose={closeDrawer} footer={<>
          {open.status === 'Invited' && <Button variant="secondary" icon={Mail} onClick={() => resend(open)}>Resend invite</Button>}
          {open.id !== 'u0' && (open.status === 'Switched off' ? <Button variant="secondary" icon={UserCheck} onClick={() => switchOn(open)}>Switch back on</Button> : <Button variant="danger" icon={UserX} onClick={() => setSwitching(open)}>Switch off</Button>)}
          <Button icon={Pencil} onClick={() => setEditing(open)}>Change role or branch</Button>
        </>}>
          {open.status === 'Switched off' && <AlertBanner tone="warning" title="This account is switched off">They can’t sign in. Their past work keeps their name.</AlertBanner>}
          {open.status === 'Invited' && <AlertBanner tone="info" title="Invite not accepted yet">They haven’t set a password. You can send the invite again.</AlertBanner>}
          <dl className="kv">
            <dt>Email</dt><dd>{open.email}</dd>
            <dt>Role</dt><dd>{open.role}</dd>
            <dt>Branch</dt><dd>{s.branchName(open.branch)}</dd>
            <dt>Status</dt><dd><Chip tone={tone(open.status)}>{open.status}</Chip></dd>
            <dt>Last active</dt><dd>{open.lastActive}</dd>
          </dl>
          <div className="divider" />
          <div><div className="t-h3" style={{ marginBottom: 8 }}>What they can do</div>
            <div className="t-small">{ROLES.find(r => r.role === open.role)?.does}</div>
            <div className="t-small t-secondary mt-2">{ROLES.find(r => r.role === open.role)?.cannot}</div></div>
          <div className="divider" />
          <div><div className="t-h3" style={{ marginBottom: 10 }}>Access history</div>
            <div className="timeline">{s.audit.filter(a => a.record.includes(open.name)).slice(0, 6).map(a => (
              <div key={a.id} className="t-small"><b>{a.action}</b> by {a.actor} · <span className="t-muted">{a.at}</span>{a.after && <div className="t-caption t-muted">{a.before ? `${a.before} → ` : ''}{a.after}</div>}{a.reason && <div className="t-caption t-muted">Reason: {a.reason}</div>}</div>))}
              {!s.audit.some(a => a.record.includes(open.name)) && <div className="t-small t-muted">No access changes yet.</div>}</div></div>
        </Drawer>
      )}
      {editing && <EditAccess user={editing} onClose={() => setEditing(null)} />}
      {switching && <ReasonDialog title={`Switch off ${switching.name}?`} text="They won’t be able to sign in, and any open sessions end. Their past work and history stay with their name." confirm="Switch off" danger onClose={() => setSwitching(null)} onConfirm={reason => {
        s.setUsers(x => x.map(y => y.id === switching.id ? { ...y, status: 'Switched off', lastActive: 'Switched off today' } : y))
        s.log({ type: 'Access', action: 'Switched off an account', record: switching.name, before: switching.status, after: 'Switched off', reason })
        s.toast(`${switching.name} is switched off`); setSwitching(null)
      }} />}
      {invite && <InviteModal onClose={() => setInvite(false)} />}
    </>
  )
}

function EditAccess({ user, onClose }: { user: User; onClose: () => void }) {
  const s = useStore()
  const [role, setRole] = useState<Role>(user.role)
  const [branch, setBranch] = useState(user.branch)
  const self = user.id === 'u0'
  const changed = role !== user.role || branch !== user.branch
  const save = () => {
    s.setUsers(x => x.map(y => y.id === user.id ? { ...y, role, branch } : y))
    s.log({ type: 'Access', action: 'Changed role or branch', record: user.name, before: `${user.role} · ${s.branchName(user.branch)}`, after: `${role} · ${s.branchName(branch)}` })
    s.toast(`${user.name}’s access is updated`); onClose()
  }
  return (
    <Modal title={`Change access for ${user.name}`} sub="The change works straight away and is saved in Audit History." onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!changed} onClick={save}>Save changes</Button></>}>
      <Field label="Role" helper={self ? 'You can’t change your own role. Ask another Agency Admin.' : undefined}><Select disabled={self} value={role} onChange={e => setRole(e.target.value as Role)} options={OFFICE_ROLES} /></Field>
      <Field label="Branch"><Select value={branch} onChange={e => setBranch(e.target.value)} options={[{ value: 'all', label: 'All branches' }, ...s.branches.filter(b => b.active).map(b => ({ value: b.id, label: b.name }))]} /></Field>
      {role !== user.role && <AlertBanner tone="info" title={`As a ${role}, ${user.name.split(' ')[0]} will be able to:`}>{ROLES.find(r => r.role === role)?.does}</AlertBanner>}
    </Modal>
  )
}
