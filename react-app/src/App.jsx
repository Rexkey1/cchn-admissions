import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ApplicantsPage from './pages/ApplicantsPage';
import ShortlistedPage from './pages/ShortlistedPage';
import VerifiedPage from './pages/VerifiedPage';
import AdmittedPage from './pages/AdmittedPage';
import UploadPage from './pages/UploadPage';
import InterviewDatesPage from './pages/InterviewDatesPage';
import SourcesPage from './pages/SourcesPage';
import UsersPage from './pages/UsersPage';
import ApplicantAddPage from './pages/ApplicantAddPage';
import ApplicantEditPage from './pages/ApplicantEditPage';
import UserAddPage from './pages/UserAddPage';
import UserEditPage from './pages/UserEditPage';
import UploadDatesPage from './pages/UploadDatesPage';
import BulkSchedulePage from './pages/BulkSchedulePage';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}><div className="spinner"/></div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="applicants" element={<ApplicantsPage />} />
            <Route path="applicants/add" element={<ApplicantAddPage />} />
            <Route path="applicants/:id/edit" element={<ApplicantEditPage />} />
            <Route path="shortlisted" element={<ShortlistedPage />} />
            <Route path="verified" element={<VerifiedPage />} />
            <Route path="admitted" element={<AdmittedPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="interview-dates" element={<InterviewDatesPage />} />
            <Route path="upload-dates" element={<UploadDatesPage />} />
            <Route path="bulk-schedule" element={<BulkSchedulePage />} />
            <Route path="sources" element={<SourcesPage />} />
            
            {/* Admin only */}
            <Route path="users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
            <Route path="users/add" element={<ProtectedRoute adminOnly><UserAddPage /></ProtectedRoute>} />
            <Route path="users/:id/edit" element={<ProtectedRoute adminOnly><UserEditPage /></ProtectedRoute>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
