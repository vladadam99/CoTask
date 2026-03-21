import React from 'react';
import { motion } from 'framer-motion';
import { User, Radio, Building2, ArrowRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';

const roles = [
  {
    key: 'user',
    icon: User,
    title: 'I need help',
    subtitle: 'Client',
    desc: 'Find and book avatars for live tours, errands, walkthroughs, and real-time assistance.',
    cta: 'Explore Avatars',
  },
  {
    key: 'avatar',
    icon: Radio,
    title: 'I want to earn',
    subtitle: 'Avatar / Helper',
    desc: 'Offer your local presence. Help people remotely by being their eyes, hands, and guide.',
    cta: 'Become an Avatar',
  },
  {
    key: 'enterprise',
    icon: Building2,
    title: 'I need business solutions',
    subtitle: 'Enterprise',
    desc: 'Book avatars for site inspections, field support, training, demos, and more.',
    cta: 'Set up Business',
  },
];

export default function RoleSelect() {
  const { user } = useCurrentUser();

  const handleRoleSelect = async (role) => {
    if (role === 'user') {
      // Users go straight to Explore — no forced onboarding
      if (user) {
        window.location.href = '/Explore';
      } else {
        window.location.href = '/Explore';
      }
      return;
    }

    if (user) {
      // Already logged in — check if they already have a profile for this role
      if (role === 'avatar') {
        const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
        if (profiles.length > 0) {
          window.location.href = '/AvatarDashboard';
          return;
        }
      } else if (role === 'enterprise') {
        const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
        if (profiles.length > 0) {
          window.location.href = '/EnterpriseDashboard';
          return;
        }
      }
      window.location.href = `/Onboarding?role=${role}`;
    } else {
      // Not logged in — store role and redirect to login → then onboarding
      localStorage.setItem('cotask_role', role);
      base44.auth.redirectToLogin(`/Onboarding?role=${role}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      
      <div className="relative z-10 max-w-4xl w-full">
        <div className="text-center mb-12">
          <a href="/Landing" className="text-2xl font-bold tracking-tight mb-6 inline-block">
            Co<span className="text-primary">Task</span>
          </a>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">What brings you here?</h1>
          <p className="text-muted-foreground">Choose how you want to use CoTask</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-5">
          {roles.map((role, i) => (
            <motion.div
              key={role.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <GlassCard
                className="p-8 text-center cursor-pointer group hover:border-primary/30 transition-all duration-300"
                hover
                onClick={() => handleRoleSelect(role.key)}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mx-auto mb-5 transition-colors">
                  <role.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-1">{role.title}</h3>
                <p className="text-xs text-primary mb-3">{role.subtitle}</p>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{role.desc}</p>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                  {role.cta} <ArrowRight className="w-4 h-4" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          Already have an account?{' '}
          <button onClick={() => base44.auth.redirectToLogin('/UserDashboard')} className="text-primary hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}