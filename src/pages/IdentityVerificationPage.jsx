import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import IdentityVerification from '@/components/verification/IdentityVerification';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IdentityVerificationPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [done, setDone] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const isMobileSession = urlParams.get('mobile') === '1';

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u?.email) {
        try {
          const avatars = await base44.entities.AvatarProfile.filter({ user_email: u.email });
          if (avatars?.length > 0) setProfileId(avatars[0].id);
        } catch (e) {}
      }
    });
  }, []);

  const profileType = user?.selected_role === 'avatar' ? 'avatar' : user?.selected_role === 'enterprise' ? 'enterprise' : null;

  const handleBack = () => {
    if (user?.selected_role === 'avatar') navigate('/AvatarDashboard');
    else if (user?.selected_role === 'enterprise') navigate('/EnterpriseDashboard');
    else navigate('/UserDashboard');
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-10 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">You're Verified!</h2>
          <p className="text-muted-foreground">
            {isMobileSession
              ? 'Verification complete. You can close this tab and return to your computer.'
              : 'Your identity has been successfully confirmed. You can now access all features.'}
          </p>
          {!isMobileSession && <Button className="w-full" onClick={handleBack}>Go to Dashboard</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 max-w-xl w-full space-y-6">
        <button onClick={handleBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <IdentityVerification
          profileId={profileId}
          profileType={profileType}
          onComplete={() => setDone(true)}
        />
      </div>
    </div>
  );
}