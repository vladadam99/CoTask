import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Link } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AvatarSearchSection from '@/components/professionals/AvatarSearchSection';
import ExpertSearchSection from '@/components/professionals/ExpertSearchSection';

export default function FindPeople() {
  const { user } = useCurrentUser();

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black mb-1">Discover Local Agents</h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Find verified Local Agents who can visit, inspect, record, or livestream from where you need them.
              Need someone available nearby? Use filters or post an open task.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link to="/PostJob" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
              Post an Open Task
            </Link>
          </div>
        </div>

        <Tabs defaultValue="avatars" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-card border border-border">
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