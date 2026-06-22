import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function SuggestedForYou({ user }) {
  const { data, isLoading } = useQuery({
    queryKey: ['suggested-avatars', user?.email, user?.interests],
    queryFn: async () => {
      const res = await base44.functions.invoke('matchSuggestions', { type: 'avatars_for_user' });
      return res.data?.suggestions || [];
    },
    enabled: !!user && user.interests?.length > 0,
    staleTime: 5 * 60 * 1000
  });

  if (!user?.interests?.length || isLoading || !data?.length) return null;

  return null;

















































}