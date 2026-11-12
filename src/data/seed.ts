// Demo data for the CORLIVA Agency Admin portal.
// Everything is relative to "today" so the demo always looks current.

export type Role =
  | 'Agency Admin'
  | 'Care Coordinator'
  | 'Care Supervisor'
  | 'HR Officer'
  | 'Finance Officer'
  | 'Caregiver'
  | 'Client / Family'

export type UserStatus = 'Invited' | 'Active' | 'Switched off'

export interface Branch { id: string; name: string; address: string; phone: string; manager: string; active: boolean }
export interface User { id: string; name: string; email: string; phone?: string; role: Role; branch: string; status: UserStatus; lastActive: string }
export interface ListItem { id: string; name: string; active: boolean; note?: string }
export interface Requirement { id: string; name: string; appliesTo: 'Caregiver' | 'Client'; level: 'Blocking' | 'Warning'; renewMonths: number | null; evidence: boolean; active: boolean }
export type Stage = 'Enquiry' | 'Qualification' | 'Assessment' | 'Decision' | 'Converted' | 'Closed'
export interface Note { by: string; at: string; text: string }
export interface Referral { id: string; name: string; source: string; contact: string; phone: string; services: string; urgency: 'Routine' | 'Soon' | 'Urgent'; owner: string; stage: Stage; branch: string; days: number; missing: string[]; preferredTimes: string; outcome?: string; history: Note[] }
export interface Client { id: string; name: string; branch: string; status: 'Active' | 'On hold' | 'Discharged'; coordinator: string; services: string; nextVisit: string; carePlan: 'Up to date' | 'Review due' | 'Overdue'; since: string; phone: string; address: string; family: string; fromReferral?: string }
export interface Caregiver { id: string; name: string; branch: string; readiness: 'Ready' | 'Warning' | 'Blocked'; issue?: string; phone: string }
export type VisitStatus = 'Scheduled' | 'In progress' | 'Completed' | 'Unassigned' | 'Cancelled'
export interface Visit { id: string; clientId: string; caregiverId: string | null; date: string; start: string; end: string; branch: string; service: string; status: VisitStatus; override?: string; cancelReason?: string }
export interface Approval { id: string; visitNo: string; client: string; caregiver: string; date: string; branch: string; scheduled: string; actual: string; tasks: string; flags: string[]; status: 'Waiting' | 'Approved' | 'Returned'; reason?: string }
export type IncidentStatus = 'Reported' | 'Under review' | 'Action required' | 'Resolved' | 'Closed'
export interface Incident { id: string; title: string; category: string; severity: 'Low' | 'Medium' | 'High'; client: string; reportedBy: string; date: string; owner: string; due: string; status: IncidentStatus; branch: string; sensitive: boolean; notes: Note[] }
export interface AuditEntry { id: string; at: string; actor: string; action: string; record: string; type: 'Access' | 'Settings' | 'Referral' | 'Visit' | 'Incident' | 'Client' | 'Schedule'; before?: string; after?: string; reason?: string }
export interface Inbox { id: string; title: string; body: string; at: string; read: boolean; link: string; tone: 'danger' | 'warning' | 'info' | 'success' }
export interface FamilyRequest { id: string; from: string; client: string; text: string; owner: string; at: string; status: 'Open' | 'Done' }
export interface CalEvent { id: string; date: string; title: string; time: string; tone: 'info' | 'warning' | 'danger'; note: string }
export interface Alert { id: string; name: string; desc: string; recipients: string; inApp: boolean; email: boolean; locked?: boolean }

const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d) }
export const TODAY = addDays(0)

export const ROLES: { role: Role; does: string; cannot: string; area: string }[] = [
  { role: 'Agency Admin', area: 'Office', does: 'Manages people, agency settings, lists and rules. Oversees all daily work and reports.', cannot: 'Cannot change history. Stepping in on someone else’s work always needs a reason.' },
  { role: 'Care Coordinator', area: 'Office', does: 'Handles new referrals, client set-up, schedules, caregiver matching and family requests.', cannot: 'Cannot see pay rates, payroll files or private investigations.' },
  { role: 'Care Supervisor', area: 'Office', does: 'Reviews care plans and finished visits, approves or returns them, and follows up incidents.', cannot: 'Cannot do money tasks unless given extra permission.' },
  { role: 'HR Officer', area: 'Office', does: 'Keeps caregiver records, documents, availability and readiness up to date.', cannot: 'Cannot read private care notes or money records.' },
  { role: 'Finance Officer', area: 'Office', does: 'Uses approved visits to prepare invoices, record payments and export payroll.', cannot: 'Cannot change care records or approve care.' },
  { role: 'Caregiver', area: 'Mobile app + web', does: 'Sees their own visits, checks in and out, completes tasks and reports incidents.', cannot: 'Cannot see other clients, reports, invoices or other staff pay.' },
  { role: 'Client / Family', area: 'Mobile app', does: 'Sees the linked client’s visits and care updates and sends requests.', cannot: 'Cannot see internal notes, payroll or anyone else’s records.' },
]
export const OFFICE_ROLES: Role[] = ['Agency Admin', 'Care Coordinator', 'Care Supervisor', 'HR Officer', 'Finance Officer']

export const branches: Branch[] = [
  { id: 'north', name: 'North Branch', address: '220 Lakeview Ave, Springfield, IL 62701', phone: '(217) 555-0142', manager: 'Aisha Rahman', active: true },
  { id: 'south', name: 'South Branch', address: '48 Mill Road, Springfield, IL 62704', phone: '(217) 555-0178', manager: 'Daniel Reed', active: true },
]

export const users: User[] = [
  { id: 'u0', name: 'Fred Morgan', email: 'fred@royalityhomecare.com', phone: '(217) 555-0100', role: 'Agency Admin', branch: 'all', status: 'Active', lastActive: 'Now' },
  { id: 'u1', name: 'Aisha Rahman', email: 'aisha@royalityhomecare.com', role: 'Care Coordinator', branch: 'north', status: 'Active', lastActive: '5 min ago' },
  { id: 'u2', name: 'Michael Brooks', email: 'michael@royalityhomecare.com', role: 'Care Supervisor', branch: 'all', status: 'Active', lastActive: '12 min ago' },
  { id: 'u3', name: 'Lena Ortiz', email: 'lena@royalityhomecare.com', role: 'HR Officer', branch: 'north', status: 'Active', lastActive: '1 hour ago' },
  { id: 'u4', name: 'Omar Haddad', email: 'omar@royalityhomecare.com', role: 'Finance Officer', branch: 'all', status: 'Active', lastActive: 'Yesterday' },
  { id: 'u5', name: 'Daniel Reed', email: 'daniel@royalityhomecare.com', role: 'Care Coordinator', branch: 'south', status: 'Invited', lastActive: 'Invite sent' },
  { id: 'u6', name: 'Priya Shah', email: 'priya@royalityhomecare.com', role: 'Care Supervisor', branch: 'south', status: 'Active', lastActive: '2 hours ago' },
  { id: 'u7', name: 'Tom Walsh', email: 'tom@royalityhomecare.com', role: 'Care Coordinator', branch: 'north', status: 'Switched off', lastActive: '3 weeks ago' },
]

export const lists: Record<string, ListItem[]> = {
  services: [
    { id: 's1', name: 'Personal care', active: true, note: 'Bathing, dressing, toileting' },
    { id: 's2', name: 'Companionship', active: true, note: 'Company, outings, conversation' },
    { id: 's3', name: 'Homemaking', active: true, note: 'Light cleaning, laundry, meals' },
    { id: 's4', name: 'Respite care', active: true, note: 'Short breaks for family carers' },
    { id: 's5', name: 'Medication reminders', active: true, note: 'Prompts only, no administering' },
    { id: 's6', name: 'Overnight care', active: false, note: 'Not offered at the moment' },
  ],
  sources: [
    { id: 'r1', name: 'Hospital discharge', active: true },
    { id: 'r2', name: 'Family or friend', active: true },
    { id: 'r3', name: 'Doctor’s office', active: true },
    { id: 'r4', name: 'Website enquiry', active: true },
    { id: 'r5', name: 'Insurance or care manager', active: true },
  ],
  tasks: [
    { id: 't1', name: 'Help with bathing', active: true },
    { id: 't2', name: 'Prepare a meal', active: true },
    { id: 't3', name: 'Medication reminder', active: true },
    { id: 't4', name: 'Light housekeeping', active: true },
    { id: 't5', name: 'Walk or gentle exercise', active: true },
  ],
  incidents: [
    { id: 'i1', name: 'Fall', active: true },
    { id: 'i2', name: 'Medication concern', active: true },
    { id: 'i3', name: 'Missed visit', active: true },
    { id: 'i4', name: 'Injury to caregiver', active: true },
    { id: 'i5', name: 'Complaint', active: true },
    { id: 'i6', name: 'Safeguarding concern', active: true, note: 'Only approved roles can see these' },
  ],
  reasons: [
    { id: 'c1', name: 'Client in hospital', active: true },
    { id: 'c2', name: 'Client asked to cancel', active: true },
    { id: 'c3', name: 'No caregiver available', active: true },
    { id: 'c4', name: 'Weather or travel problem', active: true },
  ],
}

export const requirements: Requirement[] = [
  { id: 'q1', name: 'Background check', appliesTo: 'Caregiver', level: 'Blocking', renewMonths: 24, evidence: true, active: true },
  { id: 'q2', name: 'First-aid certificate', appliesTo: 'Caregiver', level: 'Blocking', renewMonths: 24, evidence: true, active: true },
  { id: 'q3', name: 'TB test', appliesTo: 'Caregiver', level: 'Blocking', renewMonths: 12, evidence: true, active: true },
  { id: 'q4', name: 'Driver’s licence', appliesTo: 'Caregiver', level: 'Warning', renewMonths: null, evidence: true, active: true },
  { id: 'q5', name: 'Annual training', appliesTo: 'Caregiver', level: 'Warning', renewMonths: 12, evidence: false, active: true },
  { id: 'q6', name: 'Signed service agreement', appliesTo: 'Client', level: 'Blocking', renewMonths: null, evidence: true, active: true },
  { id: 'q7', name: 'Care plan review', appliesTo: 'Client', level: 'Warning', renewMonths: 6, evidence: false, active: true },
]

export const rules = {
  overrideAllowed: true,
  overrideRoles: ['Agency Admin', 'Care Supervisor'] as Role[],
  lateArrivalMins: 15,
  timeDiffMins: 20,
  locationCheck: true,
  approvers: ['Agency Admin', 'Care Supervisor'] as Role[],
  returnNeedsReason: true,
}

export const alerts: Alert[] = [
  { id: 'a1', name: 'Invitation sent', desc: 'A new person is invited to CORLIVA.', recipients: 'The invited person', inApp: false, email: true, locked: true },
  { id: 'a2', name: 'Visit has no caregiver', desc: 'A visit in the next 48 hours is still unassigned.', recipients: 'Care Coordinators', inApp: true, email: true },
  { id: 'a3', name: 'Caregiver is late', desc: 'No check-in 15 minutes after the start time.', recipients: 'Care Coordinators', inApp: true, email: false },
  { id: 'a4', name: 'Visit waiting for approval', desc: 'A finished visit is ready to review.', recipients: 'Care Supervisors', inApp: true, email: false },
  { id: 'a5', name: 'Document expiring soon', desc: 'A caregiver document expires within 30 days.', recipients: 'HR Officers', inApp: true, email: true },
  { id: 'a6', name: 'New incident reported', desc: 'Someone reports an incident.', recipients: 'Care Supervisors, Agency Admin', inApp: true, email: true },
  { id: 'a7', name: 'Family request received', desc: 'A family member sends a request.', recipients: 'Care Coordinators', inApp: true, email: false },
  { id: 'a8', name: 'Referral waiting over 3 days', desc: 'A referral has not moved for 3 days.', recipients: 'Referral owner', inApp: true, email: false },
]

export const caregivers: Caregiver[] = [
  { id: 'g1', name: 'Grace Mensah', branch: 'north', readiness: 'Ready', phone: '(217) 555-0201' },
  { id: 'g2', name: 'Daniel Osei', branch: 'north', readiness: 'Blocked', issue: 'First-aid certificate expired', phone: '(217) 555-0202' },
  { id: 'g3', name: 'Maria Lopez', branch: 'north', readiness: 'Ready', phone: '(217) 555-0203' },
  { id: 'g4', name: 'James Carter', branch: 'south', readiness: 'Warning', issue: 'Annual training due in 9 days', phone: '(217) 555-0204' },
  { id: 'g5', name: 'Sofia Novak', branch: 'south', readiness: 'Ready', phone: '(217) 555-0205' },
  { id: 'g6', name: 'Kwame Asante', branch: 'south', readiness: 'Ready', phone: '(217) 555-0206' },
  { id: 'g7', name: 'Hannah Lee', branch: 'north', readiness: 'Blocked', issue: 'Background check not verified', phone: '(217) 555-0207' },
  { id: 'g8', name: 'Peter Nguyen', branch: 'south', readiness: 'Ready', phone: '(217) 555-0208' },
]

export const clients: Client[] = [
  { id: 'c1', name: 'Margaret Hale', branch: 'north', status: 'Active', coordinator: 'Aisha Rahman', services: 'Personal care, Medication reminders', nextVisit: 'Today 09:00', carePlan: 'Overdue', since: 'Mar 2025', phone: '(217) 555-0311', address: '14 Elm St, Springfield', family: 'Susan Hale (daughter)' },
  { id: 'c2', name: 'Robert King', branch: 'north', status: 'Active', coordinator: 'Aisha Rahman', services: 'Companionship', nextVisit: 'Today 11:00', carePlan: 'Up to date', since: 'Jan 2026', phone: '(217) 555-0312', address: '9 Oak Lane, Springfield', family: 'Mark King (son)' },
  { id: 'c3', name: 'Evelyn Price', branch: 'south', status: 'Active', coordinator: 'Daniel Reed', services: 'Homemaking, Personal care', nextVisit: 'Today 13:00', carePlan: 'Review due', since: 'Aug 2025', phone: '(217) 555-0313', address: '72 River Rd, Springfield', family: 'None linked' },
  { id: 'c4', name: 'Walter Brooks', branch: 'south', status: 'Active', coordinator: 'Daniel Reed', services: 'Respite care', nextVisit: 'Tomorrow 08:00', carePlan: 'Up to date', since: 'Jun 2026', phone: '(217) 555-0314', address: '5 Pine Ct, Springfield', family: 'Ann Brooks (wife)' },
  { id: 'c5', name: 'Dorothy Fields', branch: 'north', status: 'On hold', coordinator: 'Aisha Rahman', services: 'Personal care', nextVisit: 'Paused', carePlan: 'Up to date', since: 'Nov 2024', phone: '(217) 555-0315', address: '31 Maple Dr, Springfield', family: 'Jim Fields (son)' },
  { id: 'c6', name: 'Harold Jenkins', branch: 'north', status: 'Active', coordinator: 'Aisha Rahman', services: 'Medication reminders', nextVisit: 'Today 15:00', carePlan: 'Up to date', since: 'Sep 2026', phone: '(217) 555-0316', address: '88 Cedar Ave, Springfield', family: 'Linda Jenkins (wife)' },
  { id: 'c7', name: 'Rose Martin', branch: 'south', status: 'Active', coordinator: 'Daniel Reed', services: 'Companionship, Homemaking', nextVisit: 'Tomorrow 10:00', carePlan: 'Up to date', since: 'Feb 2026', phone: '(217) 555-0317', address: '19 Birch St, Springfield', family: 'Tom Martin (son)' },
  { id: 'c9', name: 'Edith Morris', branch: 'north', status: 'Active', coordinator: 'Aisha Rahman', services: 'Personal care', nextVisit: 'Tomorrow 08:00', carePlan: 'Up to date', since: 'May 2026', phone: '(217) 555-0319', address: '40 Grove St, Springfield', family: 'Paul Morris (son)' },
  { id: 'c10', name: 'Leonard Cole', branch: 'south', status: 'Active', coordinator: 'Daniel Reed', services: 'Homemaking', nextVisit: 'Today 14:00', carePlan: 'Review due', since: 'Jul 2026', phone: '(217) 555-0320', address: '11 Ash Way, Springfield', family: 'None linked' },
  { id: 'c11', name: 'Irene Walsh', branch: 'south', status: 'Active', coordinator: 'Daniel Reed', services: 'Medication reminders', nextVisit: 'Today 18:00', carePlan: 'Up to date', since: 'Oct 2026', phone: '(217) 555-0321', address: '6 Willow Pl, Springfield', family: 'Kate Walsh (niece)' },
  { id: 'c12', name: 'Samuel Grant', branch: 'north', status: 'Active', coordinator: 'Aisha Rahman', services: 'Personal care', nextVisit: 'Today 09:30', carePlan: 'Up to date', since: 'Dec 2025', phone: '(217) 555-0322', address: '27 Park Ave, Springfield', family: 'Ruth Grant (wife)' },
  { id: 'c8', name: 'Frank Owens', branch: 'south', status: 'Discharged', coordinator: 'Daniel Reed', services: 'Respite care', nextVisit: '—', carePlan: 'Up to date', since: 'Apr 2025', phone: '(217) 555-0318', address: '2 Hill Rd, Springfield', family: 'None linked' },
]

// Weekly visit pattern per client: [weekdays (0=Sun), start, end, service]
const PATTERN: Record<string, [number[], string, string, string]> = {
  c1: [[1, 2, 3, 4, 5, 6, 0], '09:00', '11:00', 'Personal care'],
  c2: [[1, 3, 5], '11:00', '13:00', 'Companionship'],
  c3: [[1, 2, 3, 4, 5], '13:00', '15:00', 'Homemaking'],
  c4: [[2, 4, 6], '08:00', '12:00', 'Respite care'],
  c6: [[1, 2, 3, 4, 5, 6, 0], '15:00', '16:00', 'Medication reminders'],
  c7: [[1, 2, 4, 5], '10:00', '12:00', 'Companionship'],
  c9: [[1, 2, 3, 4, 5], '08:00', '09:30', 'Personal care'],
  c10: [[1, 3, 5, 6], '14:00', '16:00', 'Homemaking'],
  c11: [[1, 2, 3, 4, 5, 6, 0], '18:00', '19:00', 'Medication reminders'],
  c12: [[2, 3, 4, 5, 6], '09:30', '12:30', 'Personal care'],
}
// Caregiver who normally covers each client
const REGULAR: Record<string, string> = { c1: 'g1', c2: 'g3', c3: 'g5', c4: 'g4', c6: 'g3', c7: 'g6', c9: 'g1', c10: 'g8', c11: 'g6', c12: 'g5' }
// Visits that still need a caregiver: [dayOffset, clientId]
const OPEN: [number, string][] = [[0, 'c6'], [1, 'c4'], [1, 'c7'], [1, 'c11'], [3, 'c10']]
// Past visits cancelled because nobody was free: [dayOffset, clientId]
const MISSED: [number, string][] = [[-6, 'c3'], [-4, 'c10'], [-4, 'c4'], [-2, 'c12'], [-1, 'c7']]

function buildVisits(): Visit[] {
  const out: Visit[] = []
  let n = 4700
  for (let day = -6; day <= 7; day++) {
    const d = new Date(); d.setDate(d.getDate() + day)
    for (const [cid, [days, start, end, service]] of Object.entries(PATTERN)) {
      if (!days.includes(d.getDay())) continue
      const c = clients.find(x => x.id === cid)!
      if (c.status !== 'Active') continue
      n += 1
      const open = OPEN.some(([o, x]) => o === day && x === cid)
      const missed = MISSED.some(([o, x]) => o === day && x === cid)
      let status: VisitStatus = 'Scheduled'
      if (day < 0) status = missed ? 'Cancelled' : 'Completed'
      else if (day === 0) status = start < '10:00' ? 'Completed' : start < '12:00' ? 'In progress' : 'Scheduled'
      if (open) status = 'Unassigned'
      out.push({ id: 'v' + n, clientId: cid, caregiverId: open || missed ? null : REGULAR[cid], date: iso(d), start, end, branch: c.branch, service, status, cancelReason: missed ? 'No caregiver available' : undefined })
    }
  }
  return out
}
export const visits: Visit[] = buildVisits()

export const approvals: Approval[] = [
  { id: 'p1', visitNo: '#4816', client: 'Robert King', caregiver: 'Grace Mensah', date: addDays(-1), branch: 'north', scheduled: '11:00 – 13:00', actual: '11:04 – 13:02', tasks: '3 of 3 done', flags: [], status: 'Waiting' },
  { id: 'p2', visitNo: '#4817', client: 'Evelyn Price', caregiver: 'Sofia Novak', date: addDays(-1), branch: 'south', scheduled: '13:00 – 15:00', actual: '13:22 – 15:00', tasks: '4 of 4 done', flags: ['Arrived 22 min late'], status: 'Waiting' },
  { id: 'p3', visitNo: '#4818', client: 'Margaret Hale', caregiver: 'Grace Mensah', date: addDays(-2), branch: 'north', scheduled: '09:00 – 11:00', actual: '09:01 – —', tasks: '2 of 3 done', flags: ['No check-out', 'Task not done: Help with bathing'], status: 'Waiting' },
  { id: 'p4', visitNo: '#4790', client: 'Rose Martin', caregiver: 'Kwame Asante', date: addDays(-2), branch: 'south', scheduled: '10:00 – 12:00', actual: '10:00 – 11:58', tasks: '3 of 3 done', flags: ['Location not shared'], status: 'Waiting' },
  { id: 'p5', visitNo: '#4788', client: 'Harold Jenkins', caregiver: 'Maria Lopez', date: addDays(-3), branch: 'north', scheduled: '15:00 – 16:00', actual: '15:02 – 16:01', tasks: '1 of 1 done', flags: [], status: 'Waiting' },
  { id: 'p6', visitNo: '#4781', client: 'Walter Brooks', caregiver: 'James Carter', date: addDays(-3), branch: 'south', scheduled: '08:00 – 12:00', actual: '08:05 – 12:00', tasks: '2 of 2 done', flags: [], status: 'Approved' },
]

export const referrals: Referral[] = [
  { id: 'R-1042', name: 'Alice Turner', source: 'Hospital discharge', contact: 'Nurse Kim (St. Mary’s)', phone: '(217) 555-0411', services: 'Personal care', urgency: 'Urgent', owner: 'Aisha Rahman', stage: 'Enquiry', branch: 'north', days: 0, missing: ['Home address'], preferredTimes: 'Mornings, 7 days', history: [{ by: 'Aisha Rahman', at: 'Today 08:40', text: 'Referral created from hospital call.' }] },
  { id: 'R-1041', name: 'George Bell', source: 'Family or friend', contact: 'Carol Bell (daughter)', phone: '(217) 555-0412', services: 'Companionship', urgency: 'Routine', owner: 'Daniel Reed', stage: 'Enquiry', branch: 'south', days: 1, missing: [], preferredTimes: 'Weekday afternoons', history: [{ by: 'Daniel Reed', at: 'Yesterday', text: 'Referral created.' }] },
  { id: 'R-1039', name: 'Nancy Ward', source: 'Doctor’s office', contact: 'Dr. Patel', phone: '(217) 555-0413', services: 'Personal care, Homemaking', urgency: 'Soon', owner: 'Aisha Rahman', stage: 'Qualification', branch: 'north', days: 2, missing: ['Funding source'], preferredTimes: 'Mon, Wed, Fri mornings', history: [{ by: 'Aisha Rahman', at: '2 days ago', text: 'Moved to Qualification.' }] },
  { id: 'R-1036', name: 'Paul Rivera', source: 'Website enquiry', contact: 'Paul Rivera', phone: '(217) 555-0414', services: 'Respite care', urgency: 'Routine', owner: 'Unassigned', stage: 'Qualification', branch: 'south', days: 4, missing: ['Owner'], preferredTimes: 'Weekends', history: [{ by: 'System', at: '4 days ago', text: 'Website enquiry received.' }] },
  { id: 'R-1033', name: 'Betty Collins', source: 'Insurance or care manager', contact: 'Jo Adams (care manager)', phone: '(217) 555-0415', services: 'Personal care', urgency: 'Soon', owner: 'Aisha Rahman', stage: 'Assessment', branch: 'north', days: 1, missing: [], preferredTimes: 'Daily, 8–10am', history: [{ by: 'Aisha Rahman', at: 'Yesterday', text: 'Home assessment booked for Friday.' }] },
  { id: 'R-1030', name: 'Arthur Lane', source: 'Hospital discharge', contact: 'Ward 4B', phone: '(217) 555-0416', services: 'Personal care, Medication reminders', urgency: 'Urgent', owner: 'Daniel Reed', stage: 'Decision', branch: 'south', days: 4, missing: ['Signed service agreement'], preferredTimes: 'Twice daily', history: [{ by: 'Daniel Reed', at: '4 days ago', text: 'Assessment done. Waiting on signed agreement.' }] },
  { id: 'R-1028', name: 'Linda Shaw', source: 'Family or friend', contact: 'Mike Shaw (son)', phone: '(217) 555-0417', services: 'Companionship', urgency: 'Routine', owner: 'Aisha Rahman', stage: 'Decision', branch: 'north', days: 1, missing: [], preferredTimes: 'Tue and Thu', history: [{ by: 'Aisha Rahman', at: 'Yesterday', text: 'Assessment done. Ready for a decision.' }] },
  { id: 'R-1020', name: 'Harold Jenkins', source: 'Doctor’s office', contact: 'Dr. Patel', phone: '(217) 555-0418', services: 'Medication reminders', urgency: 'Soon', owner: 'Aisha Rahman', stage: 'Converted', branch: 'north', days: 0, missing: [], preferredTimes: 'Afternoons', outcome: 'Accepted and set up as a client', history: [{ by: 'Aisha Rahman', at: 'Sep 2026', text: 'Converted to client.' }] },
]

export const incidents: Incident[] = [
  { id: 'INC-208', title: 'Client slipped in bathroom', category: 'Fall', severity: 'High', client: 'Margaret Hale', reportedBy: 'Grace Mensah', date: addDays(-1), owner: 'Michael Brooks', due: addDays(1), status: 'Under review', branch: 'north', sensitive: false, notes: [{ by: 'Grace Mensah', at: 'Yesterday 10:12', text: 'Client slipped stepping out of the shower. No visible injury. Family told.' }, { by: 'Michael Brooks', at: 'Yesterday 14:30', text: 'Called family. Asked for a grab rail check.' }] },
  { id: 'INC-207', title: 'Medication box was empty', category: 'Medication concern', severity: 'Medium', client: 'Harold Jenkins', reportedBy: 'Maria Lopez', date: addDays(-2), owner: 'Priya Shah', due: addDays(2), status: 'Action required', branch: 'north', sensitive: false, notes: [{ by: 'Maria Lopez', at: '2 days ago', text: 'Weekly pill box empty on arrival. Called wife.' }] },
  { id: 'INC-206', title: 'Visit missed — caregiver unwell', category: 'Missed visit', severity: 'Medium', client: 'Walter Brooks', reportedBy: 'James Carter', date: addDays(-3), owner: 'Daniel Reed', due: addDays(0), status: 'Reported', branch: 'south', sensitive: false, notes: [{ by: 'James Carter', at: '3 days ago', text: 'Called in sick at 7:30, no cover found.' }] },
  { id: 'INC-205', title: 'Family complaint about timing', category: 'Complaint', severity: 'Low', client: 'Rose Martin', reportedBy: 'Daniel Reed', date: addDays(-6), owner: 'Daniel Reed', due: addDays(-1), status: 'Resolved', branch: 'south', sensitive: false, notes: [{ by: 'Daniel Reed', at: '6 days ago', text: 'Son unhappy visits start late.' }, { by: 'Daniel Reed', at: '2 days ago', text: 'Moved visits to 10:00 with family agreement.' }] },
]

export const audit: AuditEntry[] = [
  { id: 'au1', at: 'Today 10:42', actor: 'Michael Brooks', action: 'Approved 6 visits', record: 'Visits #4780–#4785', type: 'Visit' },
  { id: 'au2', at: 'Today 10:15', actor: 'Aisha Rahman', action: 'Converted a referral to a client', record: 'Referral R-1020 → Harold Jenkins', type: 'Referral' },
  { id: 'au3', at: 'Today 09:58', actor: 'Lena Ortiz', action: 'Verified 2 documents', record: 'Grace Mensah, Maria Lopez', type: 'Access' },
  { id: 'au4', at: 'Today 09:30', actor: 'Fred Morgan', action: 'Invited a person', record: 'Daniel Reed', type: 'Access', after: 'Care Coordinator · South Branch' },
  { id: 'au5', at: 'Yesterday 16:05', actor: 'Michael Brooks', action: 'Override on a visit', record: 'Visit #4812', type: 'Schedule', before: 'Blocked: training due', after: 'Assigned to James Carter', reason: 'Only caregiver free; training booked for Monday.' },
  { id: 'au6', at: 'Yesterday 11:20', actor: 'Fred Morgan', action: 'Switched off an account', record: 'Tom Walsh', type: 'Access', before: 'Active', after: 'Switched off', reason: 'Left the agency on 31 Oct.' },
  { id: 'au7', at: '2 days ago', actor: 'Fred Morgan', action: 'Changed a rule', record: 'Late arrival limit', type: 'Settings', before: '10 minutes', after: '15 minutes' },
]

export const inbox: Inbox[] = [
  { id: 'n1', title: '3 visits tomorrow have no caregiver', body: 'North and South branches', at: '10 min ago', read: false, link: '/schedule', tone: 'danger' },
  { id: 'n2', title: 'New incident: client slipped in bathroom', body: 'Margaret Hale · High', at: '1 hour ago', read: false, link: '/incidents', tone: 'warning' },
  { id: 'n3', title: 'Daniel Osei’s first-aid certificate expired', body: 'He can’t be given visits until renewed', at: '3 hours ago', read: false, link: '/rules', tone: 'danger' },
  { id: 'n4', title: 'Daniel Reed has not accepted his invite yet', body: 'Invite sent 2 days ago', at: 'Yesterday', read: true, link: '/users', tone: 'info' },
]

export const familyRequests: FamilyRequest[] = [
  { id: 'f1', from: 'Susan Hale', client: 'Margaret Hale', text: 'Can Friday’s visit start at 10 instead of 9?', owner: 'Aisha Rahman', at: '20 min ago', status: 'Open' },
  { id: 'f2', from: 'Mark King', client: 'Robert King', text: 'Please could Grace bring the weekly shopping list.', owner: 'Aisha Rahman', at: '2 hours ago', status: 'Open' },
  { id: 'f3', from: 'Ann Brooks', client: 'Walter Brooks', text: 'Who is coming tomorrow morning?', owner: 'Daniel Reed', at: 'Yesterday', status: 'Done' },
]

export const events: CalEvent[] = [
  { id: 'e1', date: addDays(2), title: 'Staff meeting', time: '09:00 AM', tone: 'info', note: 'All office staff' },
  { id: 'e2', date: addDays(7), title: '6 care plan reviews due', time: 'All day', tone: 'warning', note: 'All branches' },
  { id: 'e3', date: addDays(13), title: '9 caregiver documents expire', time: 'All day', tone: 'danger', note: 'HR to follow up' },
]
