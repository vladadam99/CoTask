import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, Building2, ArrowRight, Globe, BarChart2, Loader2 } from 'lucide-react';
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
    title: 'I need help',
    subtitle: 'Client / Explorer',
    desc: 'Hire someone on the ground anywhere in the world — and watch it happen live. Tours, inspections, errands, shopping, queues — anything you need done, done in real time.',
    cta: 'Continue as Client',
    tags: ['Post Jobs', 'Live Streaming', 'Any Task'],
  },
  {
    key: 'avatar',
    icon: Radio,
    gradient: 'from-primary/20 to-primary/10',
    border: 'border-primary/20',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'I want to earn',
    subtitle: 'Avatar / Helper',
    desc: "Get hired for your skills at your own rate. Apply to jobs, run tasks, conduct live tours, or do anything for anyone — and make money being someone's boots on the ground.",
    cta: 'Continue as Avatar',
    tags: ['Apply to Jobs', 'Live Streams', 'Flexible Hours'],
    featured: true,
  },
  {
    key: 'enterprise',
    icon: BarChart2,
    gradient: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/20',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
    title: 'Business solutions',
    subtitle: 'Enterprise',
    desc: 'Scale field operations without the overhead. Deploy avatars for inspections, remote demos, multi-site coverage, and enterprise-grade workflows.',
    cta: 'Continue as Enterprise',
    tags: ['Team Access', 'Bulk Jobs', 'Priority Support'],
  },
];

export default function RoleSelect() {
  const { user, loading: userLoading, updateUser } = useCurrentUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  // If user isn't signed in yet, redirect to Google login and come back here
  useEffect(() => {
    if (!userLoading && !user) {
      base44.auth.redirectToLogin('/RoleSelect');
    }
  }, [user, userLoading]);

  const handleRoleSelect = async (role) => {
    if (!user) return;
    setLoading(role);
    try {
      // Always update the role first so dashboard guards see the correct value
      await updateUser({ role });

      if (role === 'avatar') {
        const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
        navigate(profiles.length > 0 ? '/AvatarDashboard' : `/Onboarding?role=avatar`, { replace: true });
      } else if (role === 'enterprise') {
        const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
        navigate(profiles.length > 0 ? '/EnterpriseDashboard' : `/Onboarding?role=enterprise`, { replace: true });
      } else {
        // user role
        if (user.onboarding_complete) {
          navigate('/UserDashboard', { replace: true });
        } else {
          navigate('/Onboarding?role=user', { replace: true });
        }
      }
    } finally {
      setLoading(null);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight">What brings you here?</h1>
            <p className="text-muted-foreground text-base">Choose how you want to use CoTask</p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {roles.map((role, i) => (
            <motion.button
              key={role.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              onClick={() => handleRoleSelect(role.key)}
              disabled={loading !== null}
              className={`relative text-left p-7 rounded-2xl border transition-all duration-300 group bg-gradient-to-br ${role.gradient} ${role.border} hover:scale-[1.02] hover:shadow-2xl disabled:opacity-70`}
            >
              {role.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl ${role.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                {loading === role.key ? (
                  <Loader2 className={`w-6 h-6 ${role.iconColor} animate-spin`} />
                ) : (
                  <role.icon className={`w-7 h-7 ${role.iconColor}`} />
                )}
              </div>

              <p className={`text-xs font-semibold ${role.iconColor} mb-1`}>{role.subtitle}</p>
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
                {role.cta} <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}