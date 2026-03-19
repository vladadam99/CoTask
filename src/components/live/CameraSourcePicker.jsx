import React from 'react';
import { Smartphone, Camera, Glasses, RotateCcw, CheckCircle2 } from 'lucide-react';

const COMING_SOON_IDS = ['insta360', 'meta-glasses'];

const SOURCES = [
  {
    id: 'phone-front',
    label: 'Phone Front',
    sublabel: 'Front camera · First person view',
    icon: Smartphone,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    mode: 'fpv',
    facingMode: 'user',
  },
  {
    id: 'phone-rear',
    label: 'Phone Rear',
    sublabel: 'Back camera · Wide view',
    icon: Smartphone,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    mode: 'tps',
    facingMode: 'environment',
  },
  {
    id: 'insta360',
    label: 'Insta360',
    sublabel: '360° camera · Full sphere view',
    icon: RotateCcw,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    mode: '360',
    facingMode: 'environment',
  },
  {
    id: 'meta-glasses',
    label: 'Meta Glasses',
    sublabel: 'AR headset · First person immersive',
    icon: Glasses,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    mode: 'fpv',
    facingMode: 'user',
  },
];

export { SOURCES };

export default function CameraSourcePicker({ selected, onSelect, availableSources }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {SOURCES.map(src => {
        const isSelected = selected?.id === src.id;
        const isComingSoon = COMING_SOON_IDS.includes(src.id);
        const isAvailable = !isComingSoon && availableSources.includes(src.id);
        return (
          <button
            key={src.id}
            onClick={() => isAvailable && onSelect(src)}
            disabled={!isAvailable}
            className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border transition-all duration-200 text-left
              ${isComingSoon ? 'cursor-not-allowed opacity-50' : isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}
              ${isSelected
                ? `${src.bg} ${src.border} border`
                : 'bg-card/40 border-white/5 hover:border-white/10 hover:bg-card/60'
              }`}
          >
            {isSelected && (
              <CheckCircle2 className={`absolute top-3 right-3 w-4 h-4 ${src.color}`} />
            )}
            {isComingSoon && (
              <span className="absolute top-2 right-2 text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">Soon</span>
            )}
            <src.icon className={`w-5 h-5 ${isSelected ? src.color : 'text-muted-foreground'}`} />
            <div>
              <p className={`text-sm font-semibold ${isSelected ? src.color : 'text-foreground'}`}>{src.label}</p>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">{isComingSoon ? 'Coming soon' : src.sublabel}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}