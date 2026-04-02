import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ApplicantsPage from './pages/ApplicantsPage'
import ApplicantAddPage from './pages/ApplicantAddPage'
import ApplicantEditPage from './pages/ApplicantEditPage'
import ShortlistedPage from './pages/ShortlistedPage'
import VerifiedPage from './pages/VerifiedPage'
import AdmittedPage from './pages/AdmittedPage'
import UploadPage from './pages/UploadPage'
import UsersPage from './pages/UsersPage'
import UserAddPage from './pages/UserAddPage'
import UserEditPage from './pages/UserEditPage'
import InterviewDatesPage from './pages/InterviewDatesPage'
import UploadDatesPage from './pages/UploadDatesPage'
import BulkSchedulePage from './pages/BulkSchedulePage'
import SourcesPage from './pages/SourcesPage'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" />
    </div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard"                element={<DashboardPage />} />
        <Route path="/applicants"               element={<ApplicantsPage />} />
        <Route path="/applicants/add"           element={<ApplicantAddPage />} />
        <Route path="/applicants/:id/edit"      element={<ApplicantEditPage />} />
        <Route path="/shortlisted"              element={<ShortlistedPage />} />
        <Route path="/verified"                 element={<VerifiedPage />} />
        <Route path="/admitted"                 element={<AdmittedPage />} />
        <Route path="/interview-dates"          element={<InterviewDatesPage />} />
        <Route path="/interview-dates/upload"   element={<UploadDatesPage />} />
        <Route path="/interview-dates/bulk-upload" element={<ProtectedRoute adminOnly><BulkSchedulePage /></ProtectedRoute>} />
        <Route path="/sources"                  element={<SourcesPage />} />
        <Route path="/upload"                   element={<UploadPage />} />
        <Route path="/users"     element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
        <Route path="/users/add" element={<ProtectedRoute adminOnly><UserAddPage /></ProtectedRoute>} />
        <Route path="/users/:id/edit" element={<ProtectedRoute adminOnly><UserEditPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
