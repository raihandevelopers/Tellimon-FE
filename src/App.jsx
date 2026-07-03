import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SITE_TITLE } from './config/site'
import ProtectedRoute from './components/ProtectedRoute'
import MasterRoute from './components/MasterRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import BlockedContacts from './pages/BlockedContacts'
import Buyers from './pages/Buyers'
import BuyerReports from './pages/BuyerReports'
import Customers from './pages/Customers'
import DIDManagement from './pages/DIDManagement'
import CallReports from './pages/CallReports'
import LiveCalls from './pages/LiveCalls'
import MissedCalls from './pages/MissedCalls'
import ActivityLogs from './pages/ActivityLogs'
import Wallet from './pages/Wallet'
import AssignmentNumbers from './pages/AssignmentNumbers'

export default function App() {
  useEffect(() => {
    document.title = SITE_TITLE
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="blocked-contacts" element={<BlockedContacts />} />
            <Route path="buyers" element={<Buyers />} />
            <Route path="buyer-reports" element={<BuyerReports />} />
            <Route
              path="customers"
              element={
                <MasterRoute>
                  <Customers />
                </MasterRoute>
              }
            />
            <Route
              path="did-management"
              element={
                <MasterRoute>
                  <DIDManagement />
                </MasterRoute>
              }
            />
            <Route path="call-reports" element={<CallReports />} />
            <Route path="missed-calls" element={<MissedCalls />} />
            <Route path="live-calls" element={<LiveCalls />} />
            <Route path="activity-logs" element={<ActivityLogs />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="assignment-numbers" element={<AssignmentNumbers />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
