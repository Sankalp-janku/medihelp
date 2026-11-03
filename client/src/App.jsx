import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './app/providers.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import LandingPage from './features/landing/LandingPage.jsx';
import { Skeleton } from './components/ui/index.jsx';

const named = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));
const LoginPage = named(() => import('./features/auth/AuthPages.jsx'), 'LoginPage');
const RegisterPage = named(() => import('./features/auth/AuthPages.jsx'), 'RegisterPage');
const AdminDashboard = named(() => import('./features/admin/AdminPages.jsx'), 'AdminDashboard');
const AdminDoctors = named(() => import('./features/admin/AdminPages.jsx'), 'AdminDoctors');
const AdminDoctorDetail = named(() => import('./features/admin/AdminPages.jsx'), 'AdminDoctorDetail');
const ProfilePage = lazy(() => import('./features/auth/ProfilePage.jsx'));
const DocumentsPage = lazy(() => import('./features/documents/DocumentsPage.jsx'));
const DocumentViewer = lazy(() => import('./features/documents/DocumentViewer.jsx'));
const HistoryPage = lazy(() => import('./features/history/HistoryPage.jsx'));
const EmergencyPage = lazy(() => import('./features/emergency/EmergencyPage.jsx'));
const DoctorPage = lazy(() => import('./features/access/DoctorPage.jsx'));
const DoctorPatientPage = lazy(() => import('./features/access/DoctorPatientPage.jsx'));
const PoliciesPage = lazy(() => import('./features/policies/PoliciesPage.jsx'));

const HOME = { admin: '/admin', doctor: '/doctor', patient: '/documents' };

function Guard({ roles, children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Skeleton />; // wait for session restoration before deciding anything
  if (!user) return <Navigate to="/" replace />; // logged out: public landing page, no protected content
  return roles.includes(user.role) ? children : <Navigate to={HOME[user.role]} replace />;
}
function Home() {
  const { user, ready } = useAuth();
  if (!ready) return <Skeleton />;
  return user ? <Navigate to={HOME[user.role]} replace /> : <LandingPage />;
}
const guard = (roles, el) => <Guard roles={roles}>{el}</Guard>;

export default function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="policies" element={<PoliciesPage />} />
          <Route path="documents" element={guard(['patient'], <DocumentsPage />)} />
          <Route path="documents/:id" element={guard(['patient', 'doctor'], <DocumentViewer />)} />
          <Route path="emergency" element={guard(['patient'], <EmergencyPage />)} />
          <Route path="history" element={guard(['patient'], <HistoryPage />)} />
          <Route path="profile" element={guard(['patient'], <ProfilePage />)} />
          <Route path="doctor" element={guard(['doctor'], <DoctorPage />)} />
          <Route path="doctor/patient/:patientId" element={guard(['doctor'], <DoctorPatientPage />)} />
          <Route path="admin" element={guard(['admin'], <AdminDashboard />)} />
          <Route path="admin/doctors" element={guard(['admin'], <AdminDoctors />)} />
          <Route path="admin/doctors/:id" element={guard(['admin'], <AdminDoctorDetail />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
