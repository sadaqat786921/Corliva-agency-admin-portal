import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, PauseCircle, PlayCircle, UserRound, Phone, MapPin, Users, CalendarDays, Lock, Receipt, Wallet, TriangleAlert,
  ClipboardCheck, Search, FileText, Download,
} from 'lucide-react'
import { useStore, fmtDate } from '../data/store'
import { Client, Invoice, TODAY, invoiceAmount, invoicePaid, invoiceStatus, money } from '../data/seed'
import { AlertBanner, Avatar, Button, CardHead, Chip, ChipTone, EmptyState, Field, Modal, Select, StatTile, Tabs, Textarea } from '../components/ui'

const stTone = (s: Client['status']): ChipTone => s === 'Active' ? 'success' : s === 'On hold' ? 'warning' : 'neutral'
const planTone = (p: Client['carePlan']): ChipTone => p === 'Up to date' ? 'success' : p === 'Review due' ? 'warning' : 'danger'
const invTone = (s: string): ChipTone => s === 'Paid' ? 'success' : s === 'Overdue' ? 'danger' : s === 'Partly paid' ? 'warning' : s === 'Draft' ? 'neutral' : 'info'
const long = (d: string) => d ? fmtDate(d, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const short = (d: string) => d ? fmtDate(d, { day: 'numeric', month: 'short' }) : '—'
const hoursOf = (range: string) => { const m = range.match(/(\d\d):(\d\d)\s*–\s*(\d\d):(\d\d)/); return m ? ((+m[3] * 60 + +m[4]) - (+m[1] * 60 + +m[2])) / 60 : 0 }

type Tab = 'overview' | 'visits' | 'billing'

export default function ClientDetail() {
  const { id } = useParams()
  const s = useStore()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = (['visits', 'billing'].includes(params.get('tab') ?? '') ? params.get('tab') : 'overview') as Tab
  const setTab = (t: Tab) => setParams(t === 'overview' ? {} : { tab: t }, { replace: true })
  const [act, setAct] = useState<null | 'hold' | 'coord'>(null)
  const c = s.clients.find(x => x.id === id)

  const invs = useMemo(() => s.invoices.filter(i => i.clientId === id).sort((a, b) => b.from.localeCompare(a.from)), [s.invoices, id])
  const overdue = invs.filter(i => invoiceStatus(i, s.payments) === 'Overdue')

  if (!c) return <div className="card"><EmptyState icon={Search} tone="neutral" title="We can’t find this client" text="Go back to the client list to find them." action={<Button onClick={() => nav('/clients')}>All clients</Button>} /></div>

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/clients" className="row t-small t-medium" style={{ gap: 6, marginBottom: 8 }}><ArrowLeft size={15} />All clients</Link>
          <div className="row wrap" style={{ gap: 10 }}>
            <Avatar name={c.name} size="lg" />
            <div>
              <div className="row wrap" style={{ gap: 10 }}><h1 className="t-h1">{c.name}</h1><Chip tone={stTone(c.status)}>{c.status}</Chip></div>
              <div className="t-small t-muted" style={{ marginTop: 2 }}>{s.branchName(c.branch)} · Coordinator: <b style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.coordinator}</b> · Client since {c.since}</div>
            </div>
          </div>
          <div className="crumbs"><Link to="/">Home</Link><span>/</span><Link to="/clients">Clients</Link><span>/</span><span>{c.name}</span></div>
        </div>
        {c.status !== 'Discharged' && <div className="actions">
          <Button variant="secondary" icon={UserRound} onClick={() => setAct('coord')}>Change coordinator</Button>
          <Button variant={c.status === 'On hold' ? 'primary' : 'danger'} icon={c.status === 'On hold' ? PlayCircle : PauseCircle} onClick={() => setAct('hold')}>{c.status === 'On hold' ? 'Restart care' : 'Put on hold'}</Button>
        </div>}
      </div>

      {c.carePlan !== 'Up to date' && c.status !== 'Discharged' && <AlertBanner tone={c.carePlan === 'Overdue' ? 'danger' : 'warning'} title={`Care plan ${c.carePlan.toLowerCase()}`}>{c.coordinator} and the Care Supervisor have been reminded.</AlertBanner>}
      {overdue.length > 0 && tab !== 'billing' && <AlertBanner tone="warning" title={`${overdue.length} invoice${overdue.length > 1 ? 's are' : ' is'} overdue`} action={<Button size="sm" variant="secondary" onClick={() => setTab('billing')}>See billing</Button>}>Your Finance Officer is following this up.</AlertBanner>}

      <div className="card">
        <div style={{ padding: '0 16px' }}><Tabs value={tab} onChange={setTab} tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'visits', label: 'Visits', count: s.visits.filter(v => v.clientId === c.id).length },
          { id: 'billing', label: 'Billing', count: invs.length },
        ]} /></div>
      </div>

      {tab === 'overview' && <Overview c={c} goVisits={() => setTab('visits')} />}
      {tab === 'visits' && <Visits c={c} />}
      {tab === 'billing' && <Billing c={c} invs={invs} />}

      {act === 'hold' && <HoldModal c={c} onClose={() => setAct(null)} />}
      {act === 'coord' && <CoordModal c={c} onClose={() => setAct(null)} />}
    </>
  )
}

/* ---------------- Overview ---------------- */

function Overview({ c, goVisits }: { c: Client; goVisits: () => void }) {
  const s = useStore()
  const nav = useNavigate()
  const upcoming = s.visits.filter(v => v.clientId === c.id && v.date >= TODAY && !['Cancelled', 'Completed'].includes(v.status)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 5)
  const cg = (gid: string | null) => s.caregivers.find(g => g.id === gid)?.name
  const prof = s.billingProfiles.find(b => b.clientId === c.id)
  return (
    <div className="grid g-main-side" style={{ alignItems: 'start' }}>
      <div className="col" style={{ gap: 16 }}>
        <div className="card">
          <CardHead title="Details" />
          <div className="card-body">
            <dl className="kv">
              <dt>Phone</dt><dd className="row" style={{ gap: 6 }}><Phone size={13} />{c.phone}</dd>
              <dt>Address</dt><dd className="row" style={{ gap: 6 }}><MapPin size={13} />{c.address}</dd>
              <dt>Family linked</dt><dd className="row" style={{ gap: 6 }}><Users size={13} />{c.family}</dd>
              <dt>Branch</dt><dd>{s.branchName(c.branch)}</dd>
              <dt>Coordinator</dt><dd>{c.coordinator}</dd>
              <dt>Client since</dt><dd>{c.since}</dd>
              {c.fromReferral && <><dt>Came from</dt><dd><Link to={`/referrals/${c.fromReferral}`}>Referral {c.fromReferral}</Link> — all referral records are kept there</dd></>}
            </dl>
          </div>
        </div>
        <div className="card">
          <CardHead title="Upcoming visits" action={<button className="link-btn" onClick={goVisits}>See all visits</button>} />
          <div className="card-body">
            {upcoming.length === 0 ? <div className="t-small t-muted">No visits planned.</div> : upcoming.map(v => (
              <button key={v.id} className="list-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav(`/schedule?visit=${v.id}`)}>
                <CalendarDays size={16} color="var(--text-muted)" />
                <div className="grow"><div className="t-medium t-small">{v.date === TODAY ? 'Today' : fmtDate(v.date)} · {v.start}–{v.end}</div><div className="t-caption t-muted">{v.service}</div></div>
                {v.caregiverId ? <span className="t-small">{cg(v.caregiverId)}</span> : <Chip tone="danger">No caregiver</Chip>}
              </button>))}
          </div>
        </div>
      </div>
      <div className="col" style={{ gap: 16 }}>
        <div className="card">
          <CardHead title="Care" />
          <div className="card-body col" style={{ gap: 12 }}>
            <div><div className="t-caption t-muted">Services</div><div className="t-medium">{c.services}</div></div>
            <div><div className="t-caption t-muted">Care plan</div><Chip tone={planTone(c.carePlan)}>{c.carePlan}</Chip></div>
            <div className="hint">Care notes and documents are kept by the Care Coordinator and Care Supervisor.</div>
          </div>
        </div>
        <div className="card">
          <CardHead title="Paid by" />
          <div className="card-body col" style={{ gap: 8 }}>
            {prof ? <><div className="t-medium">{prof.payer}</div><div className="t-small t-muted">{money(prof.rate)} an hour · bills to {prof.billTo}</div></> : <div className="t-small t-muted">{c.payer ?? 'Not set up yet'}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Visits ---------------- */

function Visits({ c }: { c: Client }) {
  const s = useStore()
  const nav = useNavigate()
  const [show, setShow] = useState<'upcoming' | 'past'>('upcoming')
  const all = s.visits.filter(v => v.clientId === c.id)
  const list = all.filter(v => show === 'upcoming' ? v.date >= TODAY && v.status !== 'Completed' : v.date < TODAY || v.status === 'Completed')
    .sort((a, b) => show === 'upcoming' ? (a.date + a.start).localeCompare(b.date + b.start) : (b.date + b.start).localeCompare(a.date + a.start))
  const tone = (st: string): ChipTone => st === 'Completed' ? 'success' : st === 'Unassigned' ? 'danger' : st === 'Cancelled' ? 'neutral' : 'info'
  return (
    <div className="card">
      <CardHead title="Visits" sub="Click a visit to open it in Schedule." action={<div className="seg" role="group"><button className={show === 'upcoming' ? 'on' : ''} onClick={() => setShow('upcoming')}>Upcoming</button><button className={show === 'past' ? 'on' : ''} onClick={() => setShow('past')}>Past</button></div>} />
      {list.length === 0 ? <EmptyState icon={CalendarDays} tone="neutral" title={show === 'upcoming' ? 'No visits planned' : 'No past visits yet'} text="Visits are planned by the Care Coordinator in Schedule." /> :
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Date</th><th>Time</th><th>Service</th><th>Caregiver</th><th>Status</th></tr></thead>
          <tbody>{list.map(v => (
            <tr key={v.id} className="clickable" onClick={() => nav(`/schedule?visit=${v.id}`)}>
              <td>{v.date === TODAY ? 'Today' : fmtDate(v.date)}</td><td>{v.start}–{v.end}</td><td>{v.service}</td>
              <td>{v.caregiverId ? s.caregivers.find(g => g.id === v.caregiverId)?.name : <span style={{ color: 'var(--status-danger)' }}>None yet</span>}</td>
              <td><Chip tone={tone(v.status)}>{v.status}</Chip>{v.cancelReason && <div className="t-caption t-muted">{v.cancelReason}</div>}</td>
            </tr>))}</tbody>
        </table></div>}
    </div>
  )
}

/* ---------------- Billing (view only) ---------------- */

function Billing({ c, invs }: { c: Client; invs: Invoice[] }) {
  const s = useStore()
  const [open, setOpen] = useState<Invoice | null>(null)
  const prof = s.billingProfiles.find(b => b.clientId === c.id)
  const finance = s.users.find(u => u.role === 'Finance Officer' && u.status === 'Active')?.name ?? 'your Finance Officer'
  const pays = s.payments.filter(p => p.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date))
  const owed = invs.filter(i => !i.draft).reduce((a, i) => a + Math.max(0, invoiceAmount(i) - invoicePaid(i, s.payments)), 0)
  const overdueAmt = invs.filter(i => invoiceStatus(i, s.payments) === 'Overdue').reduce((a, i) => a + invoiceAmount(i) - invoicePaid(i, s.payments), 0)
  const since90 = new Date(); since90.setDate(since90.getDate() - 90)
  const paid90 = pays.filter(p => new Date(p.date + 'T12:00') >= since90).reduce((a, p) => a + p.amount, 0)
  const unbilled = s.approvals.filter(a => a.client === c.name && a.status === 'Approved')
  const unbilledAmt = unbilled.reduce((a, x) => a + hoursOf(x.scheduled) * (prof?.rate ?? 0), 0)

  return (
    <>
      <div className="row t-small" style={{ gap: 10, padding: '10px 14px', background: '#fff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
        <Lock size={16} color="var(--text-muted)" /><span className="grow">Invoices and payments are managed by <b>{finance}</b> (Finance Officer). You can see everything here, but changes are made by Finance.</span>
      </div>

      <div className="grid g-4">
        <StatTile icon={Wallet} tone={owed > 0 ? 'info' : 'success'} label="Owed now" value={money(owed)} foot="Sent invoices not yet paid" />
        <StatTile icon={TriangleAlert} tone={overdueAmt > 0 ? 'danger' : 'success'} label="Overdue" value={money(overdueAmt)} foot={overdueAmt > 0 ? 'Past the due date' : 'Nothing overdue'} chip={overdueAmt > 0 ? { tone: 'danger', text: 'Overdue' } : { tone: 'success', text: 'All good' }} />
        <StatTile icon={Receipt} tone="success" label="Paid in last 90 days" value={money(paid90)} foot={`${pays.filter(p => new Date(p.date + 'T12:00') >= since90).length} payments recorded`} />
        <StatTile icon={ClipboardCheck} tone={unbilled.length ? 'warning' : 'neutral'} label="Approved, not invoiced" value={unbilled.length} foot={unbilled.length ? `About ${money(unbilledAmt)} to bill` : 'Nothing waiting'} />
      </div>

      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <CardHead title="Invoices" sub="Click an invoice to see what it covers and what has been paid." />
            {invs.length === 0 ? <EmptyState icon={Receipt} tone="neutral" title="No invoices yet" text="Finance prepares the first invoice once visits have been approved." /> :
              <div className="table-wrap"><table className="tbl">
                <thead><tr><th>Invoice</th><th>Period</th><th className="num">Hours</th><th className="num">Amount</th><th className="num">Paid</th><th>Due</th><th>Status</th></tr></thead>
                <tbody>{invs.map(i => {
                  const st = invoiceStatus(i, s.payments)
                  return (
                    <tr key={i.id} className="clickable" onClick={() => setOpen(i)}>
                      <td className="t-medium">{i.id}</td><td>{short(i.from)} – {short(i.to)}</td><td className="num">{i.hours}</td>
                      <td className="num t-medium">{money(invoiceAmount(i))}</td><td className="num">{money(invoicePaid(i, s.payments))}</td>
                      <td style={{ color: st === 'Overdue' ? 'var(--status-danger)' : undefined }}>{i.draft ? '—' : short(i.due)}</td>
                      <td><Chip tone={invTone(st)}>{st}</Chip></td>
                    </tr>)
                })}</tbody>
              </table></div>}
          </div>

          <div className="card">
            <CardHead title="Payments recorded" sub="Money is paid outside CORLIVA. Finance records each payment against its invoice." />
            {pays.length === 0 ? <div className="card-body t-small t-muted">No payments recorded yet.</div> :
              <div className="table-wrap"><table className="tbl">
                <thead><tr><th>Date</th><th className="num">Amount</th><th>How it was paid</th><th>For invoice</th><th>Reference</th><th>Recorded by</th></tr></thead>
                <tbody>{pays.map(p => (
                  <tr key={p.id}><td>{long(p.date)}</td><td className="num t-medium">{money(p.amount)}</td><td>{p.method}</td>
                    <td><button className="link-btn" onClick={() => setOpen(invs.find(i => i.id === p.invoiceId) ?? null)}>{p.invoiceId}</button></td><td className="t-muted">{p.ref}</td><td>{p.by}</td></tr>))}</tbody>
              </table></div>}
          </div>
        </div>

        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <CardHead title="How care is paid" />
            <div className="card-body">
              {prof ? <dl className="kv" style={{ gridTemplateColumns: '110px 1fr' }}>
                <dt>Paid by</dt><dd>{prof.payer}</dd>
                <dt>Hourly rate</dt><dd>{money(prof.rate)}</dd>
                <dt>Bills go to</dt><dd>{prof.billTo}<div className="t-caption t-muted">{prof.billToContact}</div></dd>
                <dt>Billed</dt><dd>{prof.period}</dd>
                <dt>Payment due</dt><dd>{prof.terms} days after the invoice</dd>
              </dl> : <div className="col" style={{ gap: 6 }}><div className="t-medium">{c.payer ?? 'Not set up yet'}</div><div className="t-small t-muted">Finance will add the rate and billing contact before the first invoice.</div></div>}
            </div>
          </div>
          <div className="card">
            <CardHead title="Approved visits not yet invoiced" />
            <div className="card-body">
              {unbilled.length === 0 ? <div className="t-small t-muted">Nothing waiting. Every approved visit has been billed.</div> : unbilled.map(a => (
                <div key={a.id} className="list-row"><ClipboardCheck size={16} color="var(--status-success)" />
                  <div className="grow"><div className="t-medium t-small">Visit {a.visitNo} · {fmtDate(a.date)}</div><div className="t-caption t-muted">{a.actual} · {a.caregiver}</div></div>
                  <span className="t-small">{money(hoursOf(a.scheduled) * (prof?.rate ?? 0))}</span></div>))}
              {unbilled.length > 0 && <div className="hint mt-2">These go on the next invoice. Approval alone does not send a bill.</div>}
            </div>
          </div>
        </div>
      </div>
      {open && <InvoiceModal inv={open} c={c} onClose={() => setOpen(null)} />}
    </>
  )
}

function InvoiceModal({ inv, c, onClose }: { inv: Invoice; c: Client; onClose: () => void }) {
  const s = useStore()
  const st = invoiceStatus(inv, s.payments)
  const amt = invoiceAmount(inv), paid = invoicePaid(inv, s.payments)
  const pays = s.payments.filter(p => p.invoiceId === inv.id)
  const prof = s.billingProfiles.find(b => b.clientId === c.id)
  return (
    <Modal wide title={`Invoice ${inv.id}`} sub={`${c.name} · ${long(inv.from)} to ${long(inv.to)}`} onClose={onClose} footer={<Button onClick={onClose}>Close</Button>}>
      <div className="row wrap" style={{ gap: 10 }}><Chip tone={invTone(st)}>{st}</Chip>{!inv.draft && <span className="t-small t-muted">Sent {long(inv.issued)} · due {long(inv.due)}</span>}{inv.draft && <span className="t-small t-muted">Not sent yet. Finance is still checking it.</span>}</div>
      {prof && <div className="t-small"><b>Bill to:</b> {prof.billTo} <span className="t-muted">· {prof.billToContact}</span></div>}
      <div className="card"><table className="tbl">
        <thead><tr><th>What</th><th className="num">Hours</th><th className="num">Rate</th><th className="num">Amount</th></tr></thead>
        <tbody>
          <tr><td><div className="t-medium">{inv.services}</div><div className="t-caption t-muted">Approved visits, {short(inv.from)} – {short(inv.to)}</div></td><td className="num">{inv.hours}</td><td className="num">{money(inv.rate)}</td><td className="num t-medium">{money(amt)}</td></tr>
          <tr><td colSpan={3} className="t-strong" style={{ textAlign: 'right' }}>Total</td><td className="num t-strong">{money(amt)}</td></tr>
          <tr><td colSpan={3} style={{ textAlign: 'right' }}>Paid</td><td className="num" style={{ color: 'var(--status-success)' }}>{money(paid)}</td></tr>
          <tr><td colSpan={3} className="t-strong" style={{ textAlign: 'right' }}>Still owed</td><td className="num t-strong" style={{ color: amt - paid > 0.005 ? (st === 'Overdue' ? 'var(--status-danger)' : 'var(--text-primary)') : 'var(--status-success)' }}>{money(Math.max(0, amt - paid))}</td></tr>
        </tbody>
      </table></div>
      <div><div className="t-h3" style={{ marginBottom: 8 }}>Payments against this invoice</div>
        {pays.length === 0 ? <div className="t-small t-muted">None recorded yet.</div> : pays.map(p => (
          <div key={p.id} className="list-row"><Receipt size={16} color="var(--status-success)" /><div className="grow"><div className="t-medium t-small">{money(p.amount)} · {p.method}</div><div className="t-caption t-muted">{long(p.date)} · ref {p.ref} · recorded by {p.by}</div></div></div>))}
      </div>
      <div className="row t-caption t-muted" style={{ gap: 6 }}><Lock size={12} />Sent invoices are never edited. Any fix is made by Finance as a credit or adjustment, so the history stays correct.</div>
    </Modal>
  )
}

/* ---------------- Client actions (same as before) ---------------- */

export function HoldModal({ c, onClose }: { c: Client; onClose: () => void }) {
  const s = useStore()
  const restart = c.status === 'On hold'
  const [t, setT] = useState(''); const [tried, setTried] = useState(false)
  const bad = t.trim().length < 5
  const future = s.visits.filter(v => v.clientId === c.id && v.date >= TODAY && ['Scheduled', 'Unassigned'].includes(v.status))
  const save = () => {
    setTried(true); if (bad) return
    s.setClients(x => x.map(y => y.id === c.id ? { ...y, status: restart ? 'Active' : 'On hold' } : y))
    if (!restart) s.setVisits(x => x.map(v => future.some(f => f.id === v.id) ? { ...v, status: 'Cancelled', cancelReason: 'Client on hold' } : v))
    s.log({ type: 'Client', action: restart ? 'Restarted care for a client' : 'Put a client on hold', record: c.name, before: c.status, after: restart ? 'Active' : 'On hold', reason: t.trim() })
    s.toast(restart ? `${c.name}’s care restarted. Ask the coordinator to plan visits.` : `${c.name} is on hold`); onClose()
  }
  return <Modal title={restart ? `Restart care for ${c.name}?` : `Put ${c.name} on hold?`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant={restart ? 'primary' : 'danger-solid'} onClick={save}>{restart ? 'Restart care' : 'Put on hold'}</Button></>}>
    {!restart && future.length > 0 && <AlertBanner tone="warning" title={`${future.length} upcoming visit${future.length > 1 ? 's' : ''} will be cancelled`}>Caregivers and family are told. Past visits are not changed.</AlertBanner>}
    <Field label="Reason" required error={tried && bad ? 'Please write a short reason.' : undefined} helper="Saved in Audit History."><Textarea autoFocus value={t} onChange={e => setT(e.target.value)} placeholder={restart ? 'For example: home from hospital' : 'For example: in hospital from 12 Nov'} error={tried && bad} /></Field>
  </Modal>
}

export function CoordModal({ c, onClose }: { c: Client; onClose: () => void }) {
  const s = useStore()
  const list = s.users.filter(u => u.role === 'Care Coordinator' && u.status === 'Active' && u.name !== c.coordinator).map(u => u.name)
  const [o, setO] = useState(list[0] ?? ''); const [t, setT] = useState(''); const [tried, setTried] = useState(false)
  const bad = t.trim().length < 5
  return <Modal title="Change coordinator" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!o} onClick={() => {
    setTried(true); if (bad) return
    s.setClients(x => x.map(y => y.id === c.id ? { ...y, coordinator: o } : y))
    s.log({ type: 'Client', action: 'Changed a client’s coordinator', record: c.name, before: c.coordinator, after: o, reason: t.trim() })
    s.toast(`${o} now coordinates ${c.name}’s care`); onClose()
  }}>Save</Button></>}>
    {list.length === 0 ? <AlertBanner tone="warning" title="No other active Care Coordinators">Invite one in Users & Roles first.</AlertBanner> : <>
      <Field label="New coordinator" required><Select value={o} onChange={e => setO(e.target.value)} options={list} /></Field>
      <Field label="Reason" required error={tried && bad ? 'Please write a short reason.' : undefined}><Textarea value={t} onChange={e => setT(e.target.value)} error={tried && bad} /></Field>
    </>}
  </Modal>
}
