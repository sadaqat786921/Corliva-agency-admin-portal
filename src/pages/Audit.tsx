import { useMemo, useState } from 'react'
import { Search, Download, Lock, History } from 'lucide-react'
import { useStore, downloadCsv } from '../data/store'
import { TODAY } from '../data/seed'
import { Button, Chip, ChipTone, EmptyState, PageHead, Pager, usePaged } from '../components/ui'

const TYPES = ['All changes', 'Access', 'Settings', 'Referral', 'Client', 'Schedule', 'Visit', 'Incident'] as const
const tone = (t: string): ChipTone => t === 'Access' ? 'info' : t === 'Settings' ? 'neutral' : t === 'Schedule' ? 'warning' : t === 'Incident' ? 'danger' : 'success'

export default function Audit() {
  const s = useStore()
  const [q, setQ] = useState('')
  const [type, setType] = useState<string>('All changes')
  const [who, setWho] = useState('Everyone')
  const people = ['Everyone', ...Array.from(new Set(s.audit.map(a => a.actor)))]
  const rows = useMemo(() => s.audit.filter(a => (type === 'All changes' || a.type === type) && (who === 'Everyone' || a.actor === who) &&
    (!q.trim() || [a.action, a.record, a.reason, a.before, a.after].join(' ').toLowerCase().includes(q.trim().toLowerCase()))), [s.audit, type, who, q])
  const pg = usePaged(rows, 10)
  const download = () => {
    downloadCsv(`corliva-audit-history-${TODAY}.csv`, ['When', 'Who', 'What', 'Record', 'Before', 'After', 'Reason'], rows.map(a => [a.at, a.actor, a.action, a.record, a.before ?? '', a.after ?? '', a.reason ?? '']), [`${s.agency.name} — Audit history`, `Filters: ${type}, ${who}${q ? `, “${q}”` : ''}`])
    s.toast('Audit history downloaded')
  }
  return (
    <>
      <PageHead title="Audit History" crumb="Audit History" sub="Every important change: who did it, when, and why." actions={<Button variant="secondary" icon={Download} onClick={download} disabled={!rows.length}>Download CSV</Button>} />
      <div className="card">
        <div className="toolbar">
          <div className="search"><Search /><input aria-label="Search history" placeholder="Search changes" value={q} onChange={e => { setQ(e.target.value); pg.setPage(1) }} /></div>
          <select className="select-sm" aria-label="Type of change" value={type} onChange={e => { setType(e.target.value); pg.setPage(1) }}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
          <select className="select-sm" aria-label="Who" value={who} onChange={e => { setWho(e.target.value); pg.setPage(1) }}>{people.map(p => <option key={p}>{p}</option>)}</select>
          <span className="grow" /><span className="row t-caption t-muted" style={{ gap: 6 }}><Lock size={13} />Read only — nobody can edit or delete history</span>
        </div>
        {rows.length === 0 ? <EmptyState icon={History} tone="neutral" title="No changes match" text="Try clearing the search or filters." /> : <>
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>When</th><th>Who</th><th>What happened</th><th>Record</th><th>Change</th><th>Reason</th></tr></thead>
            <tbody>{pg.slice.map(a => (
              <tr key={a.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{a.at}</td><td>{a.actor}</td>
                <td><div className="t-medium">{a.action}</div><Chip tone={tone(a.type)}>{a.type}</Chip></td>
                <td>{a.record}</td>
                <td>{a.before || a.after ? <span className="t-small">{a.before && <s className="t-muted">{a.before}</s>}{a.before && a.after && ' → '}{a.after && <b>{a.after}</b>}</span> : <span className="t-muted">—</span>}</td>
                <td className="t-secondary">{a.reason ?? '—'}</td>
              </tr>))}</tbody>
          </table></div>
          <Pager {...pg} onPage={pg.setPage} />
        </>}
      </div>
    </>
  )
}
