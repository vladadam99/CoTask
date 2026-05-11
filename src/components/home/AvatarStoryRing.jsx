import React from 'react';
import { Link } from 'react-router-dom';
import SmartImage from '@/components/media/SmartImage';

export default function AvatarStoryRing({ avatar }) {
  return (
    <Link to={`/AvatarView?id=${avatar.id}`} className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16">
      <div className="relative">
        <div className={`w-14 h-14 rounded-full p-0.5 ${avatar.is_available ? 'bg-gradient-to-br from-primary via-red-400 to-yellow-400' : 'bg-white/10'}`}>
          <div className="w-full h-full rounded-full overflow-hidden bg-card border-2 border-background flex items-center justify-center text-lg font-bold text-primary">
            {avatar.photo_url
              ? <SmartImage src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full" width={56} />
              : avatar.display_name?.[0] || 'A'}
          </div>
        </div>
        {avatar.is_available && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-background" />
        )}
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-full truncate px-0.5">{avatar.display_name?.split(' ')[0]}</span>
    </Link>
  );
}