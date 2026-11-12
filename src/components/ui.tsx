import { ReactNode, useEffect, useRef, useState, InputHTMLAttributes, SelectHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Info, X, XCircle, MoreHorizontal, LucideIcon } from 'lucide-react'
import { useStore } from '../data/store'

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-solid'
export function Button({ variant = 'primary', size, icon: Icon, children, ...rest }: { variant?: BtnVariant; size?: 'sm'; icon?: LucideIcon; children?: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest} className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${rest.className ?? ''}`}>
      {Icon && <Icon />}{children}
    </button>
  )
}

export function Field({ label, required, helper, error, children }: { label: string; required?: boolean; helper?: string; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}{required && <span className="req"> *</span>}</label>
      {children}
      {error ? <span className="helper error">{error}</span> : helper ? <span className="helper">{helper}</span> : null}
    </div>
  )
}

export function Input({ icon: Icon, error, ...rest }: { icon?: LucideIcon; error?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`control ${error ? 'error' : ''} ${rest.disabled ? 'disabled' : ''}`}>
      {Icon && <Icon />}<input {...rest} />
    </div>
  )
}

export function Select({ icon: Icon, error, options, ...rest }: { icon?: LucideIcon; error?: boolean; options: (string | { value: string; label: string })[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`control ${error ? 'error' : ''} ${rest.disabled ? 'disabled' : ''}`}>
      {Icon && <Icon />}
      <select {...rest}>
        {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  const { error, ...rest } = props
  return <textarea {...rest} className={`control ${error ? 'error' : ''}`} />
}

export function Toggle({ on, onChange, disabled, label }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />
}

export type ChipTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export function Chip({ tone = 'neutral', children }: { tone?: ChipTone; children: ReactNode }) {
  return <span className={`chip chip-${tone}`}>{children}</span>
}

export function Avatar({ name, size }: { name: string; size?: 'sm' | 'lg' }) {
  const ini = name.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
  return <span className={`avatar ${size ?? ''}`} aria-hidden>{ini}</span>
}

export function StatTile({ icon: Icon, tone, label, value, foot, chip, onClick }: { icon: LucideIcon; tone: ChipTone; label: string; value: ReactNode; foot: string; chip?: { tone: ChipTone; text: string }; onClick?: () => void }) {
  const inner = (
    <>
      <div className="stat-top">
        <div className={`stat-icon tone-${tone}`}><Icon /></div>
        <div><div className="t-small t-secondary">{label}</div><div className="t-kpi">{value}</div></div>
      </div>
      <div className="stat-foot"><span>{foot}</span>{chip && <Chip tone={chip.tone}>{chip.text}</Chip>}</div>
    </>
  )
  return onClick ? <button type="button" className="card stat" onClick={onClick}>{inner}</button> : <div className="card stat">{inner}</div>
}

export function PageHead({ title, crumb, actions, sub }: { title: string; crumb: string; actions?: ReactNode; sub?: string }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="t-h1">{title}</h1>
        {sub && <div className="t-small t-muted" style={{ marginTop: 2 }}>{sub}</div>}
        <div className="crumbs"><Link to="/">Home</Link><span>/</span><span>{crumb}</span></div>
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  )
}

export function CardHead({ title, action, sub }: { title: ReactNode; action?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card-head">
      <div><h2 className="t-h3">{title}</h2>{sub && <div className="t-caption t-muted" style={{ marginTop: 2 }}>{sub}</div>}</div>
      {action}
    </div>
  )
}

export function AlertBanner({ tone, title, children, action }: { tone: 'danger' | 'warning' | 'info' | 'success'; title: string; children?: ReactNode; action?: ReactNode }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'info' ? Info : tone === 'danger' ? XCircle : AlertTriangle
  return (
    <div className={`alert alert-${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon />
      <div className="grow"><div className="t">{title}</div>{children && <div style={{ marginTop: 2 }}>{children}</div>}</div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, tone = 'success', title, text, action }: { icon: LucideIcon; tone?: ChipTone; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className={`stat-icon tone-${tone}`}><Icon /></div>
      <div className="t-h3">{title}</div>
      <div className="t-small t-muted" style={{ maxWidth: 360 }}>{text}</div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Modal({ title, sub, onClose, children, footer, wide }: { title: string; sub?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div><h2 className="t-h2">{title}</h2>{sub && <div className="t-small t-muted" style={{ marginTop: 4 }}>{sub}</div>}</div>
          <button className="icon-btn" aria-label="Close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ title, sub, onClose, children, footer }: { title: ReactNode; sub?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div><div className="t-h2">{title}</div>{sub && <div className="t-small t-muted" style={{ marginTop: 4 }}>{sub}</div>}</div>
          <button className="icon-btn" aria-label="Close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </>
  )
}

/** A decision that needs a written reason (switch off, override, return, decline…). */
export function ReasonDialog({ title, text, label = 'Reason', confirm, danger, onClose, onConfirm, placeholder }: { title: string; text: string; label?: string; confirm: string; danger?: boolean; placeholder?: string; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const bad = reason.trim().length < 5
  return (
    <Modal title={title} sub={text} onClose={onClose} footer={<>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant={danger ? 'danger-solid' : 'primary'} onClick={() => { setTouched(true); if (!bad) onConfirm(reason.trim()) }}>{confirm}</Button>
    </>}>
      <Field label={label} required error={touched && bad ? 'Please write a short reason (at least 5 letters).' : undefined} helper="Saved in Audit History with your name and the time.">
        <Textarea autoFocus value={reason} onChange={e => setReason(e.target.value)} placeholder={placeholder ?? 'For example: left the agency on 10 Nov'} error={touched && bad} />
      </Field>
    </Modal>
  )
}

export function ConfirmDialog({ title, text, confirm, danger, onClose, onConfirm }: { title: string; text: string; confirm: string; danger?: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal title={title} onClose={onClose} footer={<>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant={danger ? 'danger-solid' : 'primary'} onClick={onConfirm}>{confirm}</Button>
    </>}>
      <p className="t-secondary" style={{ margin: 0 }}>{text}</p>
    </Modal>
  )
}

export function useClickOutside<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close() }
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [open, close])
  return ref
}

export function RowMenu({ items }: { items: ({ label: string; icon?: LucideIcon; danger?: boolean; onClick: () => void } | 'sep')[] }) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false))
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
      <button className="icon-btn" aria-label="More actions" aria-expanded={open} onClick={() => setOpen(o => !o)}><MoreHorizontal size={16} /></button>
      {open && (
        <div className="popover" role="menu">
          {items.map((it, i) => it === 'sep' ? <div key={i} className="menu-sep" /> : (
            <button key={it.label} role="menuitem" className={`menu-item ${it.danger ? 'danger' : ''}`} onClick={() => { setOpen(false); it.onClick() }}>
              {it.icon && <it.icon />}{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(t => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={`tab ${value === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}{t.count !== undefined && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map(t => {
        const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'danger' ? XCircle : t.tone === 'warning' ? AlertTriangle : Info
        const color = t.tone === 'success' ? 'var(--status-success)' : t.tone === 'danger' ? 'var(--status-danger)' : t.tone === 'warning' ? 'var(--status-warning)' : 'var(--status-info)'
        return <div key={t.id} className="toast"><Icon color={color} />{t.text}</div>
      })}
    </div>
  )
}

export function Pager({ page, pages, total, from, to, onPage }: { page: number; pages: number; total: number; from: number; to: number; onPage: (p: number) => void }) {
  if (total === 0) return null
  return (
    <div className="row between" style={{ padding: '12px 16px', borderTop: '1px solid var(--border-default)' }}>
      <span className="t-caption t-muted">Showing {from}–{to} of {total}</span>
      <div className="row" style={{ gap: 6 }}>
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
          <Button key={p} size="sm" variant={p === page ? 'primary' : 'secondary'} onClick={() => onPage(p)} aria-current={p === page}>{p}</Button>
        ))}
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  )
}

export function usePaged<T>(items: T[], size = 8) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(items.length / size))
  const p = Math.min(page, pages)
  const slice = items.slice((p - 1) * size, p * size)
  return { slice, page: p, pages, total: items.length, from: items.length ? (p - 1) * size + 1 : 0, to: Math.min(p * size, items.length), setPage }
}
