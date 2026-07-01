import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Link } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AvatarSearchSection from '@/components/professionals/AvatarSearchSection';
import ExpertSearchSection from '@/components/professionals/ExpertSearchSection';
import { PageHero } from '@/components/ui/PagePrimitives';
import { Compass, Plus } from 'lucide-react';

export default function FindPeople() {
  const { user } = useCurrentUser();

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHero
          eyebrow="Discover"
          title="Discover Local Agents"
          description="Find verified Local Agents who can visit, inspect, record, or livestream from where you need them."
          icon={Compass}
          actions={(
            <Link to="/PostJob" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Post an Open Task
            </Link>
          )}
          stats={[
            { label: 'Start', value: 'Search' },
            { label: 'Compare', value: 'Profiles' },
            { label: 'Next', value: 'Direct Hire' },
          ]}
        />

        <Tabs defaultValue="avatars" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-card border border-border rounded-lg">
            <TabsTrigger value="avatars" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Hire Local Agents</TabsTrigger>
            <TabsTrigger value="experts" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Consult Experts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="avatars" className="mt-0 outline-none">
            <AvatarSearchSection user={user} />
          </TabsContent>
          
          <TabsContent value="experts" className="mt-0 outline-none">
            <ExpertSearchSection user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>);

}
