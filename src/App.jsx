import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Navigate } from 'react-router-dom';
// Pages
import Landing from './pages/Landing';
import RoleSelect from './pages/RoleSelect';
import Onboarding from './pages/Onboarding';
import UserDashboard from './pages/UserDashboard';
import AvatarDashboard from './pages/AvatarDashboard';
import AvatarRequests from './pages/AvatarRequests';
import EnterpriseDashboard from './pages/EnterpriseDashboard';
import Explore from './pages/Explore';
import AvatarView from './pages/AvatarView';
import CreateBooking from './pages/CreateBooking';
import Bookings from './pages/Bookings';
import BookingDetail from './pages/BookingDetail';
import Messages from './pages/Messages';
import LiveSessions from './pages/LiveSessions';
import Saved from './pages/Saved';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import HowItWorks from './pages/HowItWorks';
import Pricing from './pages/Pricing';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Safety from './pages/Safety';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Landing" replace />} />
      <Route path="/Landing" element={<Landing />} />
      <Route path="/RoleSelect" element={<RoleSelect />} />
      <Route path="/Onboarding" element={<Onboarding />} />
      <Route path="/UserDashboard" element={<UserDashboard />} />
      <Route path="/AvatarDashboard" element={<AvatarDashboard />} />
      <Route path="/AvatarRequests" element={<AvatarRequests />} />
      <Route path="/EnterpriseDashboard" element={<EnterpriseDashboard />} />
      <Route path="/Explore" element={<Explore />} />
      <Route path="/AvatarView" element={<AvatarView />} />
      <Route path="/CreateBooking" element={<CreateBooking />} />
      <Route path="/Bookings" element={<Bookings />} />
      <Route path="/BookingDetail" element={<BookingDetail />} />
      <Route path="/Messages" element={<Messages />} />
      <Route path="/LiveSessions" element={<LiveSessions />} />
      <Route path="/Saved" element={<Saved />} />
      <Route path="/Profile" element={<Profile />} />
      <Route path="/AdminDashboard" element={<AdminDashboard />} />
      <Route path="/HowItWorks" element={<HowItWorks />} />
      <Route path="/Pricing" element={<Pricing />} />
      <Route path="/FAQ" element={<FAQ />} />
      <Route path="/Contact" element={<Contact />} />
      <Route path="/Safety" element={<Safety />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App