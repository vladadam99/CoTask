import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Radio, BarChart2, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';

const roles = [
  {
    key: 'user',
    icon: Globe,
    gradient: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/20',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    title: 'Client / Explorer',
    desc: 'Find and book avatars for live tours, errands, and real-time remote assistance.',
    tags: ['Live Tours', 'Errands', 'Inspections'],
  },
  {
    key: 'avatar',
    icon: Radio,
    gradient: 'from-primary/20 to-primary/10',
    border: 'border-primary/20',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'Avatar / Helper',
    desc: 'Offer your local presence. Be the eyes and hands for clients worldwide.',
    tags: ['Set your rate', 'Flexible hours', 'Earn daily'],
    featured: true,
  },
  {
    key: 'enterprise',
    icon: BarChart2,
    gradient: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/20',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
    title: 'Enterprise',
    desc: 'Book avatars at scale for site inspections, field support, and large operations.',
    tags: ['Team access', 'Invoicing', 'Priority support'],
  },
];

export default function RoleSelectExisting() {
  const { user, loading } = useCurrentUser();
  const [selecting, setSelecting] = useState(null);

  // If not logged in, redirect to login
  useEffect(() => {
    if (!loading && !user) {
      base44.auth.redirectToLogin('/RoleSelectExisting');
    }
  }, [user, loading]);

  const handleSelect = async (roleKey) => {
    if (!user) return;
    setSelecting(roleKey);
    try {
      if (roleKey === 'user') {
        // User profile always exists once logged in
        await base44.auth.updateMe({ role: 'user' });
        window.location.href = '/UserDashboard';
        return;
      }

      if (roleKey === 'avatar') {
        const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
        if (profiles.length > 0) {
          await base44.auth.updateMe({ role: 'avatar' });
          window.location.href = '/AvatarDashboard';
        } else {
          // No avatar profile yet — go create one
          window.location.href = '/Onboarding?role=avatar';
        }
        return;
      }

      if (roleKey === 'enterprise') {
        const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
        if (profiles.length > 0) {
          await base44.auth.updateMe({ role: 'enterprise' });
          window.location.href = '/EnterpriseDashboard';
        } else {
          // No enterprise profile yet — go create one
          window.location.href = '/Onboarding?role=enterprise';
        }
        return;
      }
    } finally {
      setSelecting(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/6 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-4xl w-full">
        <div className="text-center mb-12">
          <Link to="/" className="text-2xl font-bold tracking-tight mb-6 inline-block">
            Co<span className="text-primary">Task</span>
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm text-muted-foreground mb-2">Welcome back, {user.full_name?.split(' ')[0] || 'there'} 👋</p>
            <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight">How do you want to use CoTask?</h1>
            <p className="text-muted-foreground text-base">Select a role — if you haven't set it up yet, we'll get you started.</p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {roles.map((role, i) => (
            <motion.button
              key={role.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              onClick={() => handleSelect(role.key)}
              disabled={selecting !== null}
              className={`relative text-left p-7 rounded-2xl border transition-all duration-300 group bg-gradient-to-br ${role.gradient} ${role.border} hover:scale-[1.02] hover:shadow-2xl disabled:opacity-70`}
            >
              {role.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl ${role.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                {selecting === role.key ? (
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <role.icon className={`w-7 h-7 ${role.iconColor}`} />
                )}
              </div>

              <h3 className="text-xl font-bold mb-3">{role.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{role.desc}</p>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {role.tags.map(tag => (
                  <span key={tag} className="text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>

              <div className={`flex items-center gap-2 text-sm font-semibold ${role.iconColor} group-hover:gap-3 transition-all`}>
                Continue <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}