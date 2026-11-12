import { useState } from 'react'
import { Plus, Pencil, Power, Info } from 'lucide-react'
import { useStore } from '../data/store'
import { ListItem } from '../data/seed'
import { Button, Chip, Field, Input, Modal, PageHead, RowMenu, Tabs } from '../components/ui'

const LISTS = [
  { id: 'services', label: 'Services', single: 'service', help: 'The types of care you offer. Used on referrals, client plans and visits.' },
  { id: 'sources', label: 'Referral sources', single: 'referral source', help: 'Where new clients come from. Used when creating a referral.' },
  { id: 'tasks', label: 'Visit tasks', single: 'visit task', help: 'The checklist caregivers tick off during a visit.' },
  { id: 'incidents', label: 'Incident types', single: 'incident type', help: 'Categories used when someone reports an incident.' },
  { id: 'reasons', label: 'Cancellation reasons', single: 'cancellation reason', help: 'Reasons the team picks when a visit is cancelled.' },
] as const
type ListId = typeof LISTS[number]['id']

export default function Services() {
  const s = useStore()
  const [tab, setTab] = useState<ListId>('services')
  const [edit, setEdit] = useState<ListItem | 'new' | null>(null)
  const meta = LISTS.find(l => l.id === tab)!
  const items = s.lists[tab] ?? []

  const toggle = (it: ListItem) => {
    s.setLists(l => ({ ...l, [tab]: l[tab].map(x => x.id === it.id ? { ...x, active: !x.active } : x) }))
    s.log({ type: 'Settings', action: it.active ? `Switched off a ${meta.single}` : `Switched on a ${meta.single}`, record: it.name, before: it.active ? 'On' : 'Off', after: it.active ? 'Off' : 'On' })
    s.toast(it.active ? `“${it.name}” is switched off` : `“${it.name}” is switched on`)
  }

  return (
    <>
      <PageHead title="Services & Lists" crumb="Services & Lists" sub="The choices your team picks from across CORLIVA." actions={<Button icon={Plus} onClick={() => setEdit('new')}>Add {meta.single}</Button>} />
      <div className="card">
        <div style={{ padding: '0 16px' }}><Tabs value={tab} onChange={setTab} tabs={LISTS.map(l => ({ id: l.id, label: l.label, count: (s.lists[l.id] ?? []).filter(x => x.active).length }))} /></div>
        <div className="row t-small t-secondary" style={{ padding: '12px 16px', gap: 8 }}><Info size={16} color="var(--status-info)" />{meta.help} Items are never deleted — switch them off so past records stay correct.</div>
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Name</th><th>Description</th><th>Status</th><th style={{ width: 60 }} /></tr></thead>
          <tbody>{items.map(it => (
            <tr key={it.id} className={it.active ? '' : 'muted'}>
              <td className="t-medium">{it.name}</td><td className="t-secondary">{it.note || '—'}</td>
              <td><Chip tone={it.active ? 'success' : 'neutral'}>{it.active ? 'On' : 'Off'}</Chip></td>
              <td><RowMenu items={[{ label: 'Rename', icon: Pencil, onClick: () => setEdit(it) }, { label: it.active ? 'Switch off' : 'Switch on', icon: Power, danger: it.active, onClick: () => toggle(it) }]} /></td>
            </tr>))}</tbody>
        </table></div>
      </div>
      {edit && <ItemModal list={tab} single={meta.single} item={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </>
  )
}

function ItemModal({ list, single, item, onClose }: { list: ListId; single: string; item: ListItem | null; onClose: () => void }) {
  const s = useStore()
  const [name, setName] = useState(item?.name ?? '')
  const [note, setNote] = useState(item?.note ?? '')
  const [tried, setTried] = useState(false)
  const dupe = (s.lists[list] ?? []).some(x => x.id !== item?.id && x.name.toLowerCase() === name.trim().toLowerCase())
  const err = !name.trim() ? 'Please enter a name.' : dupe ? 'This name is already on the list.' : ''
  const save = () => {
    setTried(true); if (err) return
    s.setLists(l => ({ ...l, [list]: item ? l[list].map(x => x.id === item.id ? { ...x, name: name.trim(), note: note.trim() } : x) : [...l[list], { id: list + Date.now(), name: name.trim(), note: note.trim(), active: true }] }))
    s.log({ type: 'Settings', action: item ? `Renamed a ${single}` : `Added a ${single}`, record: name.trim(), before: item && item.name !== name.trim() ? item.name : undefined, after: item ? name.trim() : undefined })
    s.toast(item ? 'Saved' : `“${name.trim()}” added`); onClose()
  }
  return (
    <Modal title={item ? `Rename ${single}` : `Add ${single}`} sub={item ? 'Past records will show the new name.' : undefined} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>{item ? 'Save' : 'Add'}</Button></>}>
      <Field label="Name" required error={tried ? err : undefined}><Input autoFocus value={name} onChange={e => setName(e.target.value)} error={tried && !!err} /></Field>
      <Field label="Description" helper="Optional. A short note so your team picks the right one."><Input value={note} onChange={e => setNote(e.target.value)} /></Field>
    </Modal>
  )
}
