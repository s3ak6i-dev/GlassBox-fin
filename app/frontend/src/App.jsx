import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import AppShell from './components/layout/AppShell.jsx'
import Login from './pages/auth/Login.jsx'
import Signup from './pages/auth/Signup.jsx'
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

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
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
