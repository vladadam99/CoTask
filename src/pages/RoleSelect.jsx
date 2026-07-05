import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, ArrowRight, Globe, Loader2 } from 'lucide-react';
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
    desc: 'Hire someone on the ground for inspections, errands, shopping, queue checks, and live video help where available.',
    cta: 'Continue as Client',
    tags: ['Create Tasks', 'Live Sessions', 'Direct Hire'],
  },
  {
    key: 'avatar',
    icon: Radio,
    gradient: 'from-primary/20 to-primary/10',
    border: 'border-primary/20',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'I want to earn',
    subtitle: 'Local Agent / Helper',
    desc: 'Get hired for local tasks at your own rate. Submit proposals, accept direct requests, share proof, and run live sessions when requested.',
    cta: 'Continue as Local Agent',
    tags: ['Open Tasks', 'Live Sessions', 'Flexible Hours'],
    featured: true,
  },
  // {
  //   key: 'enterprise',
  //   icon: BarChart2,
  //   gradient: 'from-purple-500/20 to-purple-600/10',
  //   border: 'border-purple-500/20',
  //   iconColor: 'text-purple-400',
  //   iconBg: 'bg-purple-500/10',
  //   title: 'Business solutions',
  //   subtitle: 'Enterprise',
  //   desc: 'Scale field operations without the overhead. Deploy agents for inspections, remote demos, multi-site coverage, and enterprise-grade workflows.',
  //   cta: 'Continue as Enterprise',
  //   tags: ['Team Access', 'Bulk Tasks', 'Priority Support'],
  // },
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
      // Store selected role in a custom field (platform 'role' is admin-only)
      await updateUser({ selected_role: role });

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
              className={`relative text-left p-6 rounded-lg border transition-all duration-300 group bg-card ${role.border} hover:border-primary/40 hover:shadow-md disabled:opacity-70`}
            >
              {role.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className={`w-14 h-14 rounded-lg ${role.iconBg} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
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
                  <span key={tag} className="text-xs bg-secondary/60 border border-border rounded-full px-2.5 py-1 text-muted-foreground">
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

