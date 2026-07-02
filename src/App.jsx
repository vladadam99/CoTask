import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
// Pages
import IdentityVerificationPage from './pages/IdentityVerificationPage';
import MobileVerify from './pages/MobileVerify';
import Landing from './pages/Landing';
import RoleSelect from './pages/RoleSelect';
import Onboarding from './pages/Onboarding';
import AvatarDashboard from './pages/AvatarDashboard';
import AvatarRequests from './pages/AvatarRequests';
import AvatarSchedule from './pages/AvatarSchedule';
import AvatarLive from './pages/AvatarLive';
import AvatarEarnings from './pages/AvatarEarnings';
import AvatarReviews from './pages/AvatarReviews';
import AvatarProfileEdit from './pages/AvatarProfileEdit';
import AvatarSettings from './pages/AvatarSettings';
import EnterpriseDashboard from './pages/EnterpriseDashboard';
import Explore from './pages/Explore.jsx';
import AvatarView from './pages/AvatarView';
import CreateBooking from './pages/CreateBooking';
import Bookings from './pages/Bookings';

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
import LiveStreamStudio from './pages/LiveStreamStudio';
import ExploreOnboarding from './pages/ExploreOnboarding';
import RecordingLibrary from './pages/RecordingLibrary';
import ClientLiveView from './pages/ClientLiveView';
import EnterpriseProfile from './pages/EnterpriseProfile';
import EnterpriseTeam from './pages/EnterpriseTeam';
import EnterpriseBilling from './pages/EnterpriseBilling';
import ReelFeed from './pages/ReelFeed';
import JobMarketplace from './pages/JobMarketplace';
import PostJob from './pages/PostJob';
import JobDetail from './pages/JobDetail';
import FindPeople from './pages/FindPeople';
import AvatarExplore from './pages/AvatarExplore';
import RoleSelectExisting from './pages/RoleSelectExisting';
import Register from './pages/Register';
import AvatarMessages from './pages/AvatarMessages';
import DisputeAgent from './pages/DisputeAgent';
import ConsultationBooking from './pages/ConsultationBooking';
import SafetyAgent from './pages/SafetyAgent';
import AvatarWallet from './pages/AvatarWallet';
import AvatarBookingDetail from './pages/AvatarBookingDetail';
import UserWallet from './pages/UserWallet';
import UserBookingDetail from './pages/UserBookingDetail';
import PublicPostView from './pages/PublicPostView';
import PublicLiveView from './pages/PublicLiveView';
import UserProfileEdit from './pages/UserProfileEdit';
import UserProfile from './pages/UserProfile';
import UserSettings from './pages/UserSettings';
import TermsAndConditions from './pages/TermsAndConditions';
import TermsBanner from './components/legal/TermsBanner';
import SplashScreen from './components/SplashScreen';

const PUBLIC_ROUTES = new Set([
  '/',
  '/Landing',
  '/Register',
  '/HowItWorks',
  '/Pricing',
  '/FAQ',
  '/Contact',
  '/Safety',
  '/Terms',
  '/PublicPostView',
  '/PublicLiveView',
]);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const location = useLocation();
  const isPublicRoute = PUBLIC_ROUTES.has(location.pathname);

  // Show loading spinner while checking app public settings or auth for protected routes.
  if (!isPublicRoute && (isLoadingPublicSettings || isLoadingAuth)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError && !isPublicRoute) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return (
        <Navigate
          to="/Register"
          replace
          state={{ returnTo: `${location.pathname}${location.search}` }}
        />
      );
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/PublicPostView" element={<PublicPostView />} />
      <Route path="/PublicLiveView" element={<PublicLiveView />} />
      <Route path="/UserProfileEdit" element={<UserProfileEdit />} />
      <Route path="/UserProfile" element={<UserProfile />} />
      <Route path="/UserSettings" element={<UserSettings />} />
      <Route path="/" element={<Landing />} />
      <Route path="/Landing" element={<Landing />} />
      <Route path="/RoleSelect" element={<RoleSelect />} />
      <Route path="/Onboarding" element={<Onboarding />} />
      <Route path="/UserDashboard" element={<FindPeople />} />
      <Route path="/AvatarDashboard" element={<AvatarDashboard />} />
      <Route path="/AvatarRequests" element={<AvatarRequests />} />
      <Route path="/AvatarSchedule" element={<AvatarSchedule />} />
      <Route path="/AvatarLive" element={<AvatarLive />} />
      <Route path="/AvatarEarnings" element={<AvatarEarnings />} />
      <Route path="/AvatarReviews" element={<AvatarReviews />} />
      <Route path="/AvatarProfileEdit" element={<AvatarProfileEdit />} />
      <Route path="/AvatarSettings" element={<AvatarSettings />} />
      <Route path="/EnterpriseDashboard" element={<EnterpriseDashboard />} />
      <Route path="/Explore" element={<Explore />} />
      <Route path="/PostJob" element={<PostJob />} />
      <Route path="/AvatarView" element={<AvatarView />} />
      <Route path="/CreateBooking" element={<CreateBooking />} />
      <Route path="/Bookings" element={<Bookings />} />

      <Route path="/AvatarBookingDetail" element={<AvatarBookingDetail />} />
      <Route path="/UserBookingDetail" element={<UserBookingDetail />} />
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
      <Route path="/LiveStreamStudio" element={<LiveStreamStudio />} />
      <Route path="/RecordingLibrary" element={<RecordingLibrary />} />
      <Route path="/ClientLiveView" element={<ClientLiveView />} />
      <Route path="/ExploreOnboarding" element={<ExploreOnboarding />} />
      <Route path="/EnterpriseProfile" element={<EnterpriseProfile />} />
      <Route path="/EnterpriseTeam" element={<EnterpriseTeam />} />
      <Route path="/EnterpriseBilling" element={<EnterpriseBilling />} />
      <Route path="/EnterpriseSettings" element={<Navigate to="/EnterpriseProfile" replace />} />
      <Route path="/ReelFeed" element={<ReelFeed />} />
      <Route path="/JobMarketplace" element={<JobMarketplace />} />
      <Route path="/JobDetail" element={<JobDetail />} />
      <Route path="/FindPeople" element={<FindPeople />} />
      <Route path="/AvatarExplore" element={<AvatarExplore />} />
      <Route path="/RoleSelectExisting" element={<RoleSelectExisting />} />
      <Route path="/Register" element={<Register />} />
      <Route path="/AvatarMessages" element={<AvatarMessages />} />
      <Route path="/DisputeAgent" element={<DisputeAgent />} />
      <Route path="/ConsultationBooking" element={<ConsultationBooking />} />
      <Route path="/SafetyAgent" element={<SafetyAgent />} />
      <Route path="/AvatarWallet" element={<AvatarWallet />} />
      <Route path="/UserWallet" element={<UserWallet />} />
      <Route path="/IdentityVerification" element={<IdentityVerificationPage />} />
      <Route path="/MobileVerify" element={<MobileVerify />} />
      <Route path="/Terms" element={<TermsAndConditions />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <ThemeProvider>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
            <TermsBanner />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
