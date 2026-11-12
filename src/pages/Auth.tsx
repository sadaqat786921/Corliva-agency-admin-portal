import { useState, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ArrowLeft, CheckCircle2, Building2, Plus, Trash2, Phone, MapPin, Clock, UserRound, Layers, Users, PartyPopper } from 'lucide-react'
import { useStore } from '../data/store'
import { OFFICE_ROLES, Role } from '../data/seed'
import { AlertBanner, Button, Field, Input, Select, Toasts } from '../components/ui'

function AuthFrame({ children, side }: { children: ReactNode; side?: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-art">
        <img src="./images/corliva-logo-white.svg" alt="CORLIVA" style={{ height: 44, alignSelf: 'flex-start' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 440 }}>
          {side ?? <>
            <div className="t-display" style={{ fontSize: 34 }}>Care, clearly organised.</div>
            <p style={{ opacity: .9, fontSize: 16, marginTop: 12 }}>One place for your referrals, clients, caregivers, visits and reports — so your team always knows what needs doing next.</p>
          </>}
        </div>
        <img className="big-c" src="./images/corliva-symbol-light.svg" alt="" aria-hidden />
        <div className="t-caption" style={{ opacity: .8, position: 'relative' }}>© 2026 CORLIVA · Home Care Platform</div>
      </div>
      <div className="auth-panel">{children}</div>
      <Toasts />
    </div>
  )
}

export function Login() {
  const s = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('fred@royalityhomecare.com')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr('Please enter a valid email address.')
    if (pw.length < 8) return setErr('That password doesn’t look right. It has at least 8 characters.')
    setErr(''); s.signIn(); nav(s.setupDone ? '/' : '/setup')
  }
  return (
    <AuthFrame>
      <form className="auth-card" onSubmit={submit} noValidate>
        <div><h1 className="t-h1" style={{ fontSize: 26 }}>Welcome back</h1><p className="t-secondary" style={{ margin: '6px 0 0' }}>Sign in to manage {s.agency.name}.</p></div>
        {err && <AlertBanner tone="danger" title="We couldn’t sign you in">{err}</AlertBanner>}
        <Field label="Email address"><Input icon={Mail} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Password">
          <div className="control"><Lock /><input type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Your password" />
            <button type="button" className="link-btn" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} style={{ color: 'var(--text-muted)' }}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
        </Field>
        <div className="row between"><label className="check"><input type="checkbox" defaultChecked />Keep me signed in</label><Link to="/forgot" className="t-small t-medium">Forgot password?</Link></div>
        <button className="btn btn-primary" type="submit" style={{ height: 44 }}>Sign in</button>
        <p className="t-caption t-muted" style={{ textAlign: 'center', margin: 0 }}>For this demo, any password with 8 or more characters works.</p>
      </form>
    </AuthFrame>
  )
}

export function Forgot() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  return (
    <AuthFrame>
      <div className="auth-card">
        <Link to="/login" className="row t-small t-medium" style={{ gap: 6 }}><ArrowLeft size={16} />Back to sign in</Link>
        {sent ? <>
          <div className="stat-icon tone-success" style={{ width: 48, height: 48, borderRadius: '50%' }}><CheckCircle2 /></div>
          <h1 className="t-h1">Check your email</h1>
          <p className="t-secondary" style={{ margin: 0 }}>If <b>{email}</b> has a CORLIVA account, we’ve sent a link to choose a new password. The link works for 1 hour.</p>
          <Button variant="secondary" onClick={() => setSent(false)}>Use a different email</Button>
        </> : <form className="col" style={{ gap: 16 }} onSubmit={e => { e.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr('Please enter a valid email address.'); return } setSent(true) }} noValidate>
          <h1 className="t-h1">Reset your password</h1>
          <p className="t-secondary" style={{ margin: 0 }}>Enter the email you use for CORLIVA. We’ll send you a link to choose a new password.</p>
          <Field label="Email address" error={err}><Input icon={Mail} type="email" value={email} onChange={e => { setEmail(e.target.value); setErr('') }} error={!!err} autoFocus /></Field>
          <button className="btn btn-primary" type="submit" style={{ height: 44 }}>Send reset link</button>
        </form>}
      </div>
    </AuthFrame>
  )
}

const STEPS = [
  { t: 'Agency details', d: 'Name, contact and time zone', icon: Building2 },
  { t: 'Branches', d: 'Where your teams work', icon: MapPin },
  { t: 'Services', d: 'What care you offer', icon: Layers },
  { t: 'Invite your team', d: 'Who helps you run things', icon: Users },
]

export function Setup() {
  const s = useStore()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [tried, setTried] = useState(false)
  const [ag, setAg] = useState({ ...s.agency })
  const [br, setBr] = useState(s.branches.map(b => ({ id: b.id, name: b.name, address: b.address })))
  const [svc, setSvc] = useState(s.lists.services.map(x => ({ ...x })))
  const [inv, setInv] = useState<{ name: string; email: string; role: Role }[]>([{ name: '', email: '', role: 'Care Coordinator' }])

  const valid = () => {
    if (step === 0) return ag.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ag.email) && ag.phone.trim()
    if (step === 1) return br.length > 0 && br.every(b => b.name.trim())
    if (step === 2) return svc.some(x => x.active)
    if (step === 3) return inv.every(i => (!i.name && !i.email) || (i.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.email)))
    return true
  }
  const next = (skipInvites = false) => {
    setTried(true)
    if (!skipInvites && !valid()) return
    setTried(false)
    if (step < 3) return setStep(step + 1)
    s.setAgency(ag)
    s.setBranches(br.map(b => ({ ...(s.branches.find(x => x.id === b.id) ?? { phone: '', manager: '', active: true }), id: b.id, name: b.name.trim(), address: b.address })))
    s.setLists(l => ({ ...l, services: svc }))
    const people = skipInvites ? [] : inv.filter(i => i.name.trim() && i.email.trim())
    if (people.length) s.setUsers(u => [...u, ...people.map((p, k) => ({ id: 'u' + Date.now() + k, name: p.name.trim(), email: p.email.trim(), role: p.role, branch: 'all', status: 'Invited' as const, lastActive: 'Invite sent' }))])
    s.log({ type: 'Settings', action: 'Finished agency set-up', record: ag.name })
    setDone(true)
  }

  if (done) return (
    <AuthFrame side={<><div className="t-display">You’re all set, {s.me.name.split(' ')[0]}.</div><p style={{ opacity: .9, fontSize: 16 }}>Your agency is ready. You can change any of this later from the menu.</p></>}>
      <div className="auth-card" style={{ alignItems: 'flex-start' }}>
        <div className="stat-icon tone-success" style={{ width: 56, height: 56, borderRadius: '50%' }}><PartyPopper /></div>
        <h1 className="t-h1" style={{ fontSize: 26 }}>{ag.name} is ready</h1>
        <div className="col" style={{ gap: 8, width: '100%' }}>
          {[`Agency details saved`, `${br.length} branch${br.length === 1 ? '' : 'es'} added`, `${svc.filter(x => x.active).length} services switched on`, (n => n ? `${n} invite${n === 1 ? '' : 's'} sent` : 'No invites yet — add people any time')(inv.filter(i => i.name && i.email).length)].map(t => (
            <div key={t} className="list-row" style={{ marginTop: 0 }}><CheckCircle2 size={18} color="var(--status-success)" />{t}</div>
          ))}
        </div>
        <AlertBanner tone="info" title="Next step">Check your Rules & Requirements so caregivers can’t be given visits until their documents are verified.</AlertBanner>
        <Button style={{ width: '100%', height: 44 }} onClick={() => { s.finishSetup(); nav('/') }}>Go to my dashboard</Button>
      </div>
    </AuthFrame>
  )

  return (
    <AuthFrame side={<>
      <div className="t-h1" style={{ color: '#fff', fontSize: 26 }}>Let’s set up your agency</div>
      <p style={{ opacity: .9 }}>4 short steps. About 5 minutes. You can change everything later.</p>
      <div className="steps mt-4">{STEPS.map((x, i) => (
        <div key={x.t} className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
          <span className="num">{i < step ? <CheckCircle2 size={16} /> : i + 1}</span>
          <span><span style={{ display: 'block', fontWeight: 600 }}>{x.t}</span><span className="t-caption">{x.d}</span></span>
        </div>))}
      </div>
    </>}>
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="t-caption t-muted">Step {step + 1} of 4</div>
        <div className="bar"><span style={{ width: `${(step + 1) * 25}%`, background: 'var(--action-primary)' }} /></div>
        <h1 className="t-h1">{STEPS[step].t}</h1>
        {tried && !valid() && <AlertBanner tone="danger" title="A few things need fixing">Please fill in the fields marked with a star.</AlertBanner>}

        {step === 0 && <>
          <Field label="Agency name" required><Input icon={Building2} value={ag.name} onChange={e => setAg({ ...ag, name: e.target.value })} error={tried && !ag.name.trim()} /></Field>
          <div className="grid g-2">
            <Field label="Office email" required><Input icon={Mail} value={ag.email} onChange={e => setAg({ ...ag, email: e.target.value })} error={tried && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ag.email)} /></Field>
            <Field label="Office phone" required><Input icon={Phone} value={ag.phone} onChange={e => setAg({ ...ag, phone: e.target.value })} error={tried && !ag.phone.trim()} /></Field>
          </div>
          <Field label="Office address"><Input icon={MapPin} value={ag.address} onChange={e => setAg({ ...ag, address: e.target.value })} /></Field>
          <Field label="Time zone" required helper="All visit times are shown in this time zone."><Select icon={Clock} value={ag.timezone} onChange={e => setAg({ ...ag, timezone: e.target.value })} options={['America/New_York (Eastern Time)', 'America/Chicago (Central Time)', 'America/Denver (Mountain Time)', 'America/Los_Angeles (Pacific Time)']} /></Field>
        </>}

        {step === 1 && <>
          <p className="t-secondary" style={{ margin: 0 }}>A branch is one of your office locations. Each client, caregiver and visit belongs to a branch. If you have just one office, keep one branch.</p>
          {br.map((b, i) => (
            <div key={b.id} className="card card-pad col" style={{ gap: 10 }}>
              <div className="row between"><span className="t-strong">Branch {i + 1}</span>{br.length > 1 && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setBr(br.filter(x => x.id !== b.id))}>Remove</Button>}</div>
              <Field label="Branch name" required><Input value={b.name} onChange={e => setBr(br.map(x => x.id === b.id ? { ...x, name: e.target.value } : x))} error={tried && !b.name.trim()} placeholder="For example: North Branch" /></Field>
              <Field label="Address"><Input icon={MapPin} value={b.address} onChange={e => setBr(br.map(x => x.id === b.id ? { ...x, address: e.target.value } : x))} /></Field>
            </div>))}
          <Button variant="secondary" icon={Plus} onClick={() => setBr([...br, { id: 'b' + Date.now(), name: '', address: '' }])}>Add another branch</Button>
        </>}

        {step === 2 && <>
          <p className="t-secondary" style={{ margin: 0 }}>Switch on the services you offer. These appear when your team creates referrals and visits.</p>
          <div className="col" style={{ gap: 8 }}>{svc.map(x => (
            <label key={x.id} className="list-row" style={{ marginTop: 0, cursor: 'pointer' }}>
              <input type="checkbox" checked={x.active} onChange={() => setSvc(svc.map(y => y.id === x.id ? { ...y, active: !y.active } : y))} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
              <span className="grow"><span style={{ display: 'block', fontWeight: 500 }}>{x.name}</span><span className="t-caption t-muted">{x.note}</span></span>
            </label>))}
          </div>
        </>}

        {step === 3 && <>
          <p className="t-secondary" style={{ margin: 0 }}>Invite the office staff who help you. You can skip this and do it later from Users & Roles.</p>
          {inv.map((p, i) => (
            <div key={i} className="grid" style={{ gridTemplateColumns: '1fr 1fr 150px auto', alignItems: 'end', gap: 8 }}>
              <Field label="Name"><Input icon={UserRound} value={p.name} onChange={e => setInv(inv.map((x, k) => k === i ? { ...x, name: e.target.value } : x))} /></Field>
              <Field label="Email"><Input value={p.email} onChange={e => setInv(inv.map((x, k) => k === i ? { ...x, email: e.target.value } : x))} error={tried && !!p.name && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)} /></Field>
              <Field label="Role"><Select value={p.role} onChange={e => setInv(inv.map((x, k) => k === i ? { ...x, role: e.target.value as Role } : x))} options={OFFICE_ROLES.filter(r => r !== 'Agency Admin')} /></Field>
              <button className="icon-btn" style={{ marginBottom: 4 }} aria-label="Remove row" onClick={() => setInv(inv.length > 1 ? inv.filter((_, k) => k !== i) : [{ name: '', email: '', role: 'Care Coordinator' }])}><Trash2 size={16} /></button>
            </div>))}
          <Button variant="secondary" icon={Plus} onClick={() => setInv([...inv, { name: '', email: '', role: 'Care Coordinator' }])}>Add another person</Button>
        </>}

        <div className="row between mt-2">
          {step > 0 ? <Button variant="secondary" onClick={() => { setTried(false); setStep(step - 1) }}>Back</Button> : <span />}
          <div className="row">
            {step === 3 && <Button variant="ghost" onClick={() => { setInv([{ name: '', email: '', role: 'Care Coordinator' }]); next(true) }}>Skip for now</Button>}
            <Button onClick={() => next()}>{step === 3 ? 'Finish set-up' : 'Continue'}</Button>
          </div>
        </div>
      </div>
    </AuthFrame>
  )
}
