import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AvatarSearchSection from '@/components/professionals/AvatarSearchSection';
import ExpertSearchSection from '@/components/professionals/ExpertSearchSection';

export default function FindPeople() {
  const { user } = useCurrentUser();

  return (
    <AppShell navItems={getNavItems(user?.selected_role)} user={user}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black mb-1">Discover Local Agents</h1>
          
        </div>

        <Tabs defaultValue="avatars" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-card border border-white/5">
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