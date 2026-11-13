import { Referral, Stage, TODAY } from './seed'
import type { ChipTone } from '../components/ui'

/** The 5 working stages, in order. "Closed" sits outside the line. */
export const STAGES: Stage[] = ['Enquiry', 'Qualification', 'Assessment', 'Decision', 'Converted']

export const STAGE_HELP: Record<string, string> = {
  Enquiry: 'Someone got in touch. Write down who the person is, what help they need, and make first contact.',
  Qualification: 'Check the agency can help: we cover their area, offer the service, can staff their times, and know how it will be paid.',
  Assessment: 'Book a home visit, meet the person, and record their care needs, risks and recommended hours.',
  Decision: 'Get the service agreement signed and agree a start date, then accept or decline.',
  Converted: 'The person is now a client. All referral records stay here for reference.',
}

export const stageTone = (st: Stage): ChipTone => st === 'Converted' ? 'success' : st === 'Closed' ? 'neutral' : st === 'Decision' ? 'warning' : st === 'Enquiry' ? 'neutral' : 'info'
export const urgTone = (u: Referral['urgency']): ChipTone => u === 'Urgent' ? 'danger' : u === 'Soon' ? 'warning' : 'neutral'

export const nextStage = (st: Stage): Stage | undefined => { const i = STAGES.indexOf(st); return i >= 0 && i < 3 ? STAGES[i + 1] : undefined }
export const prevStage = (st: Stage): Stage | undefined => { const i = STAGES.indexOf(st); return i > 0 && i <= 3 ? STAGES[i - 1] : undefined }
export const isOpen = (r: Referral) => r.stage !== 'Converted' && r.stage !== 'Closed'

/** Date the referral entered its current stage. */
export const stageSince = (r: Referral) => [...r.stageLog].reverse().find(l => l.stage === r.stage)?.date ?? TODAY
export const daysInStage = (r: Referral) => {
  const [y, m, d] = stageSince(r).split('-').map(Number)
  const [ty, tm, td] = TODAY.split('-').map(Number)
  return Math.max(0, Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86400000))
}

export interface Req { label: string; done: boolean; where?: string }

/** What must be in place before the referral can move on from a stage. */
export function requirements(r: Referral, stage: Stage = r.stage): Req[] {
  const owner: Req = { label: 'Has an owner', done: r.owner !== 'Unassigned' && !!r.owner, where: 'details' }
  switch (stage) {
    case 'Enquiry': return [
      owner,
      { label: 'Phone number', done: !!r.phone.trim() || !!r.contactPhone.trim(), where: 'record' },
      { label: 'Home address', done: !!r.address.trim(), where: 'record' },
      { label: 'Services needed', done: r.services.length > 0, where: 'record' },
      { label: 'First contact made and recorded', done: r.contacts.some(c => c.outcome === 'Spoke to them'), where: 'contacts' },
    ]
    case 'Qualification': return [
      owner,
      { label: 'We cover their area', done: r.qualification.area, where: 'record' },
      { label: 'We offer the services they need', done: r.qualification.service, where: 'record' },
      { label: 'We can staff their preferred times', done: r.qualification.times, where: 'record' },
      { label: 'How care will be paid for', done: !!r.qualification.funding, where: 'record' },
    ]
    case 'Assessment': return [
      owner,
      { label: 'Home assessment booked', done: r.assessment.status !== 'Not booked', where: 'record' },
      { label: 'Assessment results saved', done: r.assessment.status === 'Done', where: 'record' },
    ]
    case 'Decision': return [
      owner,
      { label: 'Service agreement signed', done: r.decision.agreementSigned, where: 'record' },
      { label: 'Start date agreed', done: !!r.decision.startDate, where: 'record' },
    ]
    default: return []
  }
}
export const blockers = (r: Referral) => isOpen(r) ? requirements(r).filter(q => !q.done) : []
export const ready = (r: Referral) => isOpen(r) && blockers(r).length === 0

export const nowTime = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
export const nowStamp = () => { const d = new Date(); return `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}, ${nowTime()}` }
export const age = (dob: string) => {
  if (!dob) return ''
  const b = new Date(dob + 'T12:00'), t = new Date()
  let a = t.getFullYear() - b.getFullYear(); if (t < new Date(t.getFullYear(), b.getMonth(), b.getDate())) a--
  return String(a)
}
