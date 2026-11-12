import type { ReactElement } from 'react'
import { HashRouter, Navigate, Route, Routes, Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { StoreProvider, useStore } from './data/store'
import Shell from './components/Shell'
import { EmptyState } from './components/ui'
import { Login, Forgot, Setup } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Agency from './pages/Agency'
import Services from './pages/Services'
import Rules from './pages/Rules'
import Notifications from './pages/Notifications'
import Referrals from './pages/Referrals'
import Clients from './pages/Clients'
import Schedule from './pages/Schedule'
import Approvals from './pages/Approvals'
import Incidents from './pages/Incidents'
import Reports from './pages/Reports'
import Audit from './pages/Audit'
import Settings from './pages/Settings'

function Guard({ children }: { children: ReactElement }) {
  const s = useStore()
  if (!s.signedIn) return <Navigate to="/login" replace />
  if (!s.setupDone) return <Navigate to="/setup" replace />
  return children
}

function SetupGuard() {
  const s = useStore()
  if (!s.signedIn) return <Navigate to="/login" replace />
  return <Setup />
}

function NotFound() {
  return <div className="card"><EmptyState icon={Compass} tone="info" title="We can’t find that page" text="The link may be old, or you may not have access to it." action={<Link className="btn btn-primary" to="/">Go to dashboard</Link>} /></div>
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/setup" element={<SetupGuard />} />
          <Route element={<Guard><Shell /></Guard>}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="agency" element={<Agency />} />
            <Route path="services" element={<Services />} />
            <Route path="rules" element={<Rules />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="clients" element={<Clients />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit" element={<Audit />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
