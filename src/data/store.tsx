import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react'
import * as seed from './seed'
import type { AuditEntry } from './seed'

export type Tone = 'success' | 'danger' | 'info' | 'warning'
interface Toast { id: number; text: string; tone: Tone }

const ss = {
  get(k: string) { try { return sessionStorage.getItem(k) } catch { return null } },
  set(k: string, v: string) { try { sessionStorage.setItem(k, v) } catch { /* ignore */ } },
  del(k: string) { try { sessionStorage.removeItem(k) } catch { /* ignore */ } },
}

function useStoreValue() {
  const [signedIn, setSignedIn] = useState(ss.get('corliva.auth') === '1')
  const [setupDone, setSetupDone] = useState(ss.get('corliva.setup') === '1')
  const [agency, setAgency] = useState({
    name: 'Royality Home Care', legalName: 'Royality Home Care LLC', email: 'office@royalityhomecare.com',
    phone: '(217) 555-0100', address: '220 Lakeview Ave, Springfield, IL 62701', timezone: 'America/Chicago (Central Time)', licence: 'IL-HCA-204871',
  })
  const [me, setMe] = useState({ name: 'Fred Morgan', email: 'fred@royalityhomecare.com', phone: '(217) 555-0100', initials: 'FM' })
  const [branch, setBranch] = useState<string>('all')
  const [branches, setBranches] = useState(seed.branches)
  const [users, setUsers] = useState(seed.users)
  const [lists, setLists] = useState(seed.lists)
  const [requirements, setRequirements] = useState(seed.requirements)
  const [rules, setRules] = useState(seed.rules)
  const [alerts, setAlerts] = useState(seed.alerts)
  const [referrals, setReferrals] = useState(seed.referrals)
  const [clients, setClients] = useState(seed.clients)
  const [caregivers] = useState(seed.caregivers)
  const [visits, setVisits] = useState(seed.visits)
  const [approvals, setApprovals] = useState(seed.approvals)
  const [incidents, setIncidents] = useState(seed.incidents)
  const [audit, setAudit] = useState(seed.audit)
  const [inbox, setInbox] = useState(seed.inbox)
  const [requests, setRequests] = useState(seed.familyRequests)
  const [events, setEvents] = useState(seed.events)
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
