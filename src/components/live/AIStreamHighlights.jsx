import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';

export default function AIStreamHighlights({ isLive, elapsed, attachedBooking, streamMode }) {
  const [highlights, setHighlights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setOpen(true);
    const duration = `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
    const prompt = `You are a live stream highlight generator for a remote avatar service called CoTask.
An avatar just completed a ${duration} live stream session.
Category: ${attachedBooking?.category || 'General'}
Client: ${attachedBooking?.client_name || 'a client'}
Stream mode: ${streamMode}

Generate a concise stream highlight summary with:
1. A punchy session title (max 10 words)
2. 3-4 key highlight moments (each 1 sentence, start with a timestamp like "0:00 —")
3. A short social-media-ready caption (max 2 sentences, include relevant hashtags)

Format as JSON.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            highlights: { type: 'array', items: { type: 'string' } },
            caption: { type: 'string' },
          },
        },
      });
      setHighlights(result);
    } catch (_) {
      setHighlights({ title: 'Session Complete', highlights: ['Stream ended successfully.'], caption: 'Another great session on CoTask! #CoTask #LiveStream' });
    } finally {
      setLoading(false);
    }
  };

  const copyCaption = () => {
    if (highlights?.caption) {
      navigator.clipboard.writeText(highlights.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" /> AI Stream Highlights
        </h2>
        {highlights && (
          <button onClick={() => setOpen(v => !v)} className="text-muted-foreground hover:text-foreground">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {!highlights && !loading && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Generate an AI summary of this stream's highlights after your session.</p>
          <Button
            size="sm"
            className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/20 gap-2"
            onClick={generate}
            disabled={!isLive && elapsed === 0}
          >
            <Sparkles className="w-3 h-3" /> Generate Highlights
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-yellow-400 py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Analysing stream…
        </div>
      )}

      {highlights && open && (
        <div className="space-y-3 mt-1">
          <p className="text-sm font-semibold text-foreground">{highlights.title}</p>
          <ul className="space-y-1.5">
            {highlights.highlights?.map((h, i) => (
              <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                <span className="text-yellow-400 shrink-0">✦</span> {h}
              </li>
            ))}
          </ul>
          {highlights.caption && (
            <div className="bg-card/60 border border-white/5 rounded-lg p-3">
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">{highlights.caption}</p>
              <button
                onClick={copyCaption}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy caption</>}
              </button>
            </div>
          )}
          <Button size="sm" variant="outline" className="w-full text-xs gap-2" onClick={generate}>
            <Sparkles className="w-3 h-3" /> Regenerate
          </Button>
        </div>
      )}
    </GlassCard>
  );
}