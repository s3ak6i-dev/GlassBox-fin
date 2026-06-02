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
import Docs from './pages/Docs.jsx'
import Landing from './pages/Landing.jsx'
import Home from './pages/Home.jsx'

function LoadingScreen() {
  return (
    <div className="gb-backdrop" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 18, letterSpacing: '-0.01em', color: 'var(--ink)', marginBottom: 18 }}>
          <b style={{ color: '#fff' }}>glass</b>box<span style={{ color: 'var(--cyan)' }}>·</span>fin
        </div>
        <div className="gb-spinner" style={{ margin: '0 auto' }} />
        <div style={{
          marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-3)',
        }}>
          Spinning up your workspace…
        </div>
      </div>
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
  if (org && org.onboarded) return <Navigate to="/app" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/onboarding" element={<RequireOnboarding><Onboarding /></RequireOnboarding>} />

      {/* authenticated product */}
      <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<Home />} />
        <Route path="overview" element={<Overview />} />
        <Route path="holds" element={<HoldInbox />} />
        <Route path="traces" element={<TraceExplorer />} />
        <Route path="traces/:id" element={<TraceDetail />} />
        <Route path="violations" element={<ViolationCenter />} />
        <Route path="fleets" element={<FleetView />} />
        <Route path="agents" element={<AgentRegistry />} />
        <Route path="spend" element={<SpendDashboard />} />
        <Route path="rules" element={<RuleManager />} />
        <Route path="reports" element={<Reports />} />
        <Route path="docs" element={<Docs />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
