import { Lock, ShieldCheck } from 'lucide-react'
import { useStore } from '../data/store'
import { Alert } from '../data/seed'
import { AlertBanner, PageHead, Toggle } from '../components/ui'

export default function Notifications() {
  const s = useStore()
  const set = (a: Alert, key: 'inApp' | 'email', v: boolean) => {
    if (!v && !(key === 'inApp' ? a.email : a.inApp)) { s.toast('Keep at least one way on, or important alerts could be missed', 'warning'); return }
    s.setAlerts(x => x.map(y => y.id === a.id ? { ...y, [key]: v } : y))
    s.log({ type: 'Settings', action: 'Changed an alert', record: `${a.name} — ${key === 'inApp' ? 'In CORLIVA' : 'Email'}`, before: v ? 'Off' : 'On', after: v ? 'On' : 'Off' })
    s.toast(`${a.name}: ${key === 'inApp' ? 'in-app alert' : 'email'} ${v ? 'on' : 'off'}`)
  }
  return (
    <>
      <PageHead title="Notifications" crumb="Notifications" sub="Choose which alerts CORLIVA sends, and how. Changes save straight away." />
      <AlertBanner tone="info" title="Emails stay private">Emails never include private care details. They only say what happened and link back to CORLIVA, where the person signs in to see more.</AlertBanner>
      <div className="card">
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Alert</th><th>Who gets it</th><th style={{ width: 130 }}>In CORLIVA</th><th style={{ width: 110 }}>Email</th></tr></thead>
          <tbody>{s.alerts.map(a => (
            <tr key={a.id}>
              <td><div className="t-medium">{a.name}</div><div className="t-caption t-muted">{a.desc}</div></td>
              <td className="t-secondary">{a.recipients}</td>
              <td>{a.locked ? <span className="t-caption t-muted">—</span> : <Toggle label={`${a.name} in CORLIVA`} on={a.inApp} onChange={v => set(a, 'inApp', v)} />}</td>
              <td>{a.locked ? <span className="row t-caption t-muted" style={{ gap: 4 }}><Lock size={13} />Always</span> : <Toggle label={`${a.name} by email`} on={a.email} onChange={v => set(a, 'email', v)} />}</td>
            </tr>))}</tbody>
        </table></div>
      </div>
      <div className="row t-caption t-muted" style={{ gap: 6 }}><ShieldCheck size={14} />People only get alerts about clients and branches they’re allowed to see. The same alert is never sent twice.</div>
    </>
  )
}
