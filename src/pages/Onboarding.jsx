import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import AvatarOnboarding from '@/components/onboarding/AvatarOnboarding';
import UserOnboarding from '@/components/onboarding/UserOnboarding';
import EnterpriseOnboarding from '@/components/onboarding/EnterpriseOnboarding';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading, updateUser } = useCurrentUser();
  const [role, setRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('role');
    const storedRole = localStorage.getItem('cotask_role');
    const resolvedRole = urlRole || storedRole || 'user';
    setRole(resolvedRole);
    localStorage.removeItem('cotask_role');
  }, []);

  useEffect(() => {
    if (loading || !user || !role) return;
    // Only skip onboarding if they already have a profile for this exact role
    const check = async () => {
      if (role === 'avatar') {
        const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
        if (profiles.length > 0) { window.location.href = '/AvatarDashboard'; }
      } else if (role === 'enterprise') {
        const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
        if (profiles.length > 0) { window.location.href = '/EnterpriseDashboard'; }
      }
      // For 'user' role, always show onboarding (no separate profile entity)
    };
    check();
  }, [user, loading, role]);

  const handleComplete = async (data) => {
    if (!user) {
      localStorage.setItem('cotask_role', role);
      base44.auth.redirectToLogin('/Onboarding');
      return;
    }
    setSubmitting(true);
    try {
      // Save base user data
      await updateUser({
        selected_role: role,
        onboarding_complete: true,
        city: data.city || '',
        country: data.country || '',
        interests: data.interests || data.categories || [],
        preferred_language: Array.isArray(data.languages) ? data.languages[0] : 'English',
      });

      if (role === 'avatar') {
        const existing = await base44.entities.AvatarProfile.filter({ user_email: user.email });
        const profileData = {
          user_email: user.email,
          display_name: data.display_name || user.full_name,
          bio: data.bio || '',
          city: data.city || '',
          country: data.country || '',
          categories: data.categories || [],
          languages: data.languages || ['English'],
          skills: data.skills || [],
          hourly_rate: parseFloat(data.hourly_rate) || 25,
          per_session_rate: parseFloat(data.per_session_rate) || null,
          currency: data.currency || 'GBP',
          has_vehicle: data.has_vehicle || false,
          has_360_camera: data.has_360_camera || false,
          has_headset: data.has_headset || false,
          has_smartphone: data.has_smartphone !== false,
          has_data_connection: data.has_data_connection !== false,
          is_enterprise_ready: data.is_enterprise_ready || false,
          live_premium: parseFloat(data.live_premium) || 0,
          is_available: true,
        };
        if (existing.length === 0) {
          await base44.entities.AvatarProfile.create(profileData);
        } else {
          await base44.entities.AvatarProfile.update(existing[0].id, profileData);
        }
      } else if (role === 'enterprise') {
        const existing = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
        const enterpriseData = {
          user_email: user.email,
          company_name: data.company_name || '',
          contact_person: data.contact_person || user.full_name,
          company_email: data.company_email || user.email,
          phone: data.phone || '',
          industry: data.industry || '',
          company_size: data.company_size || '',
          cities: data.cities || [],
          booking_needs: data.booking_needs || '',
          invoice_preference: data.invoice_preference || 'monthly',
          status: 'active',
        };
        if (existing.length === 0) {
          await base44.entities.EnterpriseProfile.create(enterpriseData);
        } else {
          await base44.entities.EnterpriseProfile.update(existing[0].id, enterpriseData);
        }
      }

      // Clean up registration data
      localStorage.removeItem('cotask_registration');

      const dest = role === 'avatar' ? '/AvatarDashboard'
                 : role === 'enterprise' ? '/EnterpriseDashboard'
                 : '/UserDashboard';
      navigate(dest, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center glass rounded-2xl p-10">
        <p className="text-muted-foreground mb-4">You need to be signed in to complete setup.</p>
        <button onClick={() => base44.auth.redirectToLogin('/Onboarding')}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm">
          Sign In / Create Account
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-12 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <a href="/" className="text-xl font-bold tracking-tight inline-block">
            Co<span className="text-primary">Task</span>
          </a>
        </div>
        {role === 'avatar' && <AvatarOnboarding user={user} onComplete={handleComplete} submitting={submitting} />}
        {role === 'user' && <UserOnboarding user={user} onComplete={handleComplete} submitting={submitting} />}
        {role === 'enterprise' && <EnterpriseOnboarding user={user} onComplete={handleComplete} submitting={submitting} />}
      </div>
    </div>
  );
}