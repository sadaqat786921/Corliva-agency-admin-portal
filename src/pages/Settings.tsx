import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UserRound, Phone, Mail, Lock, Eye, EyeOff, Monitor, LogOut } from 'lucide-react'
import { useStore } from '../data/store'
import { AlertBanner, Button, Field, Input, PageHead, Tabs } from '../components/ui'

export default function Settings() {
  const s = useStore()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') === 'security' ? 'security' : 'profile') as 'profile' | 'security'
  const [f, setF] = useState({ name: s.me.name, phone: s.me.phone })
  const [pw, setPw] = useState({ now: '', next: '', again: '' })
  const [show, setShow] = useState(false)
  const [tried, setTried] = useState(false)
  const dirty = f.name !== s.me.name || f.phone !== s.me.phone
  const pwErr = !pw.now ? 'Enter your current password.' : pw.next.length < 8 ? 'Your new password needs at least 8 characters.' : !/[0-9]/.test(pw.next) || !/[A-Za-z]/.test(pw.next) ? 'Use at least one letter and one number.' : pw.next !== pw.again ? 'The two new passwords don’t match.' : ''

  return (
    <>
      <PageHead title="Settings" crumb="Settings" sub="Your own profile and sign-in. Agency settings are in the Agency Setup menu." />
      <div className="card">
        <div style={{ padding: '0 16px' }}><Tabs value={tab} onChange={t => setParams(t === 'security' ? { tab: 'security' } : {})} tabs={[{ id: 'profile', label: 'My profile' }, { id: 'security', label: 'Password & security' }]} /></div>
        {tab === 'profile' ? (
          <div className="card-body col" style={{ gap: 16, maxWidth: 620 }}>
            <div className="row"><span className="avatar lg">{s.me.initials}</span><div><div className="t-h3">{s.me.name}</div><div className="t-small t-muted">Agency Admin · {s.agency.name}</div></div></div>
            <Field label="Full name" required error={!f.name.trim() ? 'Please enter your name.' : undefined}><Input icon={UserRound} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} error={!f.name.trim()} /></Field>
            <Field label="Phone"><Input icon={Phone} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="Email" helper="Your sign-in email can’t be changed here. Ask CORLIVA support if it needs to change."><Input icon={Mail} value={s.me.email} disabled /></Field>
            <Field label="Role" helper="Another Agency Admin can change your role."><Input value="Agency Admin" disabled /></Field>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button variant="secondary" disabled={!dirty} onClick={() => setF({ name: s.me.name, phone: s.me.phone })}>Undo</Button>
              <Button disabled={!dirty || !f.name.trim()} onClick={() => { const name = f.name.trim(); s.setMe({ ...s.me, name, phone: f.phone, initials: name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() }); s.toast('Profile saved') }}>Save changes</Button>
            </div>
          </div>
        ) : (
          <div className="card-body col" style={{ gap: 16, maxWidth: 620 }}>
            <div className="t-h3">Change password</div>
            {tried && pwErr && <AlertBanner tone="danger" title="Password not changed">{pwErr}</AlertBanner>}
            <Field label="Current password"><Input icon={Lock} type={show ? 'text' : 'password'} value={pw.now} onChange={e => setPw({ ...pw, now: e.target.value })} /></Field>
            <Field label="New password" helper="At least 8 characters, with a letter and a number."><Input icon={Lock} type={show ? 'text' : 'password'} value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} /></Field>
            <Field label="New password again"><Input icon={Lock} type={show ? 'text' : 'password'} value={pw.again} onChange={e => setPw({ ...pw, again: e.target.value })} /></Field>
            <div className="row between">
              <button className="link-btn row" style={{ gap: 6 }} onClick={() => setShow(!show)}>{show ? <EyeOff size={15} /> : <Eye size={15} />}{show ? 'Hide passwords' : 'Show passwords'}</button>
              <Button onClick={() => { setTried(true); if (pwErr) return; setPw({ now: '', next: '', again: '' }); setTried(false); s.log({ type: 'Access', action: 'Changed own password', record: s.me.name }); s.toast('Password changed') }}>Change password</Button>
            </div>
            <div className="divider" />
            <div className="t-h3">Where you’re signed in</div>
            <div className="list-row" style={{ marginTop: 0 }}><Monitor size={18} color="var(--text-muted)" /><div className="grow"><div className="t-medium">This browser</div><div className="t-caption t-muted">Active now</div></div><span className="chip chip-success">This device</span></div>
            <div><Button variant="secondary" icon={LogOut} onClick={() => { s.log({ type: 'Access', action: 'Signed out of other devices', record: s.me.name }); s.toast('Signed out everywhere else') }}>Sign out of all other devices</Button></div>
          </div>
        )}
      </div>
    </>
  )
}
