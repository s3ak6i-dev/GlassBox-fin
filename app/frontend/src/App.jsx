import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import AppShell from './components/layout/AppShell.jsx'
import Login from './pages/auth/Login.jsx'
import Signup from './pages/auth/Signup.jsx'
import Onboarding from './pages/onboarding/Onboarding.jsx'
import Overview from './pages/Overview.jsx'
import HoldInbox from './pages/HoldInbox.jsx'
import TraceExplorer from './pages/TraceExplorer.jsx'
import TraceDetail from './pages/TraceDetail.jsx'
import ViolationCenter from './pages/ViolationCenter.jsx'
import FleetView from './pages/FleetView.jsx'
import AgentRegistry from './pages/AgentRegistry.jsx'
import SpendDashboard from './pages/SpendDashboard.jsx'
import RuleManager from './pages/RuleManager.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'

function LoadingScreen() {
  return (
    <div className="gb-backdrop" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="gb-spinner" style={{ position: 'relative', zIndex: 1 }} />
    </div>
  )
}

// Requires a valid token. Redirects un-onboarded users into the wizard.
function RequireAuth({ children }) {
  const { token, loading, org } = useAuth()
  if (loading) return <LoadingScreen />
  if (!token) return <Navigate to="/login" replace />
  if (org && !org.onboarded) return <Navigate to="/onboarding" replace />
  return children
}

// The onboarding wizard itself — token required, but skip if already onboarded.
function RequireOnboarding({ children }) {
  const { token, loading, org } = useAuth()
  if (loading) return <LoadingScreen />
  if (!token) return <Navigate to="/login" replace />
  if (org && org.onboarded) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/onboarding" element={<RequireOnboarding><Onboarding /></RequireOnboarding>} />
      <Route path="/" element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<Overview />} />
        <Route path="holds" element={<HoldInbox />} />
        <Route path="traces" element={<TraceExplorer />} />
        <Route path="traces/:id" element={<TraceDetail />} />
        <Route path="violations" element={<ViolationCenter />} />
        <Route path="fleets" element={<FleetView />} />
        <Route path="agents" element={<AgentRegistry />} />
        <Route path="spend" element={<SpendDashboard />} />
        <Route path="rules" element={<RuleManager />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
