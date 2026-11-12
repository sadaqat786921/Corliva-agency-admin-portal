import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode, Dispatch, SetStateAction } from 'react'
import * as seed from './seed'
import type { AuditEntry } from './seed'

export type Tone = 'success' | 'danger' | 'info' | 'warning'
interface Toast { id: number; text: string; tone: Tone }

const ss = {
  get(k: string) { try { return sessionStorage.getItem(k) } catch { return null } },
  set(k: string, v: string) { try { sessionStorage.setItem(k, v) } catch { /* ignore */ } },
  del(k: string) { try { sessionStorage.removeItem(k) } catch { /* ignore */ } },
}

const DATA_PREFIX = 'corliva.data.'

/** useState that is saved in sessionStorage, so demo changes survive a page refresh. */
function usePersist<T>(key: string, init: T): [T, Dispatch<SetStateAction<T>>] {
  const [v, setV] = useState<T>(() => {
    const raw = ss.get(DATA_PREFIX + key)
    if (raw) { try { return JSON.parse(raw) as T } catch { /* ignore */ } }
    return init
  })
  useEffect(() => { ss.set(DATA_PREFIX + key, JSON.stringify(v)) }, [key, v])
  return [v, setV]
}

/** Clears every saved demo change and reloads the original sample data. Keeps the user signed in. */
export function resetDemoData() {
  try {
    Object.keys(sessionStorage).filter(k => k.startsWith(DATA_PREFIX)).forEach(k => sessionStorage.removeItem(k))
  } catch { /* ignore */ }
  window.location.reload()
}

function useStoreValue() {
  const [signedIn, setSignedIn] = useState(ss.get('corliva.auth') === '1')
  const [setupDone, setSetupDone] = useState(ss.get('corliva.setup') === '1')
  const [agency, setAgency] = usePersist('agency', {
    name: 'Royality Home Care', legalName: 'Royality Home Care LLC', email: 'office@royalityhomecare.com',
    phone: '(217) 555-0100', address: '220 Lakeview Ave, Springfield, IL 62701', timezone: 'America/Chicago (Central Time)', licence: 'IL-HCA-204871',
  })
  const [me, setMe] = usePersist('me', { name: 'Fred Morgan', email: 'fred@royalityhomecare.com', phone: '(217) 555-0100', initials: 'FM' })
  const [branch, setBranch] = usePersist<string>('branch', 'all')
  const [branches, setBranches] = usePersist('branches', seed.branches)
  const [users, setUsers] = usePersist('users', seed.users)
  const [lists, setLists] = usePersist('lists', seed.lists)
  const [requirements, setRequirements] = usePersist('requirements', seed.requirements)
  const [rules, setRules] = usePersist('rules', seed.rules)
  const [alerts, setAlerts] = usePersist('alerts', seed.alerts)
  const [referrals, setReferrals] = usePersist('referrals', seed.referrals)
  const [clients, setClients] = usePersist('clients', seed.clients)
  const [caregivers] = usePersist('caregivers', seed.caregivers)
  const [visits, setVisits] = usePersist('visits', seed.visits)
  const [approvals, setApprovals] = usePersist('approvals', seed.approvals)
  const [incidents, setIncidents] = usePersist('incidents', seed.incidents)
  const [audit, setAudit] = usePersist('audit', seed.audit)
  const [inbox, setInbox] = usePersist('inbox', seed.inbox)
  const [requests, setRequests] = usePersist('requests', seed.familyRequests)
  const [events, setEvents] = usePersist('events', seed.events)
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((text: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, text, tone }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3600)
  }, [])

  const log = useCallback((e: Omit<AuditEntry, 'id' | 'at' | 'actor'>) => {
    const now = new Date()
    const at = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setAudit(a => [{ id: 'au' + now.getTime(), at, actor: 'Fred Morgan', ...e }, ...a])
  }, [])

  const branchName = useCallback((id: string) => id === 'all' ? 'All branches' : (branches.find(b => b.id === id)?.name ?? id), [branches])
  const inBranch = useCallback((b: string) => branch === 'all' || b === 'all' || b === branch, [branch])

  const signIn = () => { setSignedIn(true); ss.set('corliva.auth', '1') }
  const signOut = () => { setSignedIn(false); ss.del('corliva.auth') }
  const finishSetup = () => { setSetupDone(true); ss.set('corliva.setup', '1') }

  return {
    signedIn, signIn, signOut, setupDone, finishSetup,
    agency, setAgency, me, setMe, branch, setBranch, branchName, inBranch,
    branches, setBranches, users, setUsers, lists, setLists, requirements, setRequirements,
    rules, setRules, alerts, setAlerts, referrals, setReferrals, clients, setClients, caregivers,
    visits, setVisits, approvals, setApprovals, incidents, setIncidents, audit, log,
    inbox, setInbox, requests, setRequests, events, setEvents, toasts, toast,
  }
}

export type Store = ReturnType<typeof useStoreValue>
const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside StoreProvider')
  return v
}

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()

export const fmtDate = (isoDate: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', opts)
}

export function downloadCsv(filename: string, header: string[], rows: (string | number)[][], context: string[] = []) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const lines = [...context.map(c => esc(c)), ...(context.length ? [''] : []), header.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function useMemoFilter<T>(items: T[], fn: (x: T) => boolean, deps: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => items.filter(fn), [items, ...deps])
}
