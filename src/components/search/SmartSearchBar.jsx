import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Sparkles, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * SmartSearchBar – AI-powered semantic search.
 * Props:
 *   items: array of objects to search through
 *   itemSummaryFn: (item) => string — how to describe each item to the AI
 *   onResults: (ids: string[] | null) => void — null means "clear / show all"
 *   placeholder: string
 *   suggestions: string[] — shown when input focused but empty
 */
export default function SmartSearchBar({ items = [], itemSummaryFn, onResults, placeholder = 'Search...', suggestions = [] }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [aiActive, setAiActive] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const runSearch = useCallback(async (q) => {
    if (!q.trim() || items.length === 0) {
      onResults(null);
      setAiActive(false);
      return;
    }

    setLoading(true);
    setAiActive(false);

    try {
      const summaries = items.map(item => `ID:${item.id} | ${itemSummaryFn(item)}`).join('\n');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a smart search assistant for a platform that connects clients with human avatars (workers) for remote or in-person tasks.

A user searched for: "${q}"

Here are the available items:
${summaries}

Return the IDs of items that are relevant to the search query, even if the wording doesn't match exactly. Use semantic understanding — e.g. "dog walking" should match avatars who mention pets, animals, or outdoor activities in their bio/skills. "grocery run" should match shopping/errands etc.

Only include genuinely relevant matches. Return them ranked by relevance (best first).`,
        response_json_schema: {
          type: 'object',
          properties: {
            matched_ids: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      const ids = result?.matched_ids || [];
      onResults(ids.length > 0 ? ids : []);
      setAiActive(true);
    } catch (e) {
      // fallback: basic text match
      const q_lower = q.toLowerCase();
      const fallbackIds = items
        .filter(item => itemSummaryFn(item).toLowerCase().includes(q_lower))
        .map(item => item.id);
      onResults(fallbackIds);
    } finally {
      setLoading(false);
    }
  }, [items, itemSummaryFn, onResults]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      onResults(null);
      setAiActive(false);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(query), 700);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const clear = () => {
    setQuery('');
    onResults(null);
    setAiActive(false);
    inputRef.current?.focus();
  };

  const applySuggestion = (s) => {
    setQuery(s);
    setFocused(false);
  };

  const showDropdown = focused && !query.trim() && suggestions.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        {loading
          ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
          : aiActive
          ? <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
          : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        }
        <Input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-8 bg-white/5 border-white/10 rounded-xl text-sm"
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
        {query && (
          <button onClick={clear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>



      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
          <p className="text-[10px] text-muted-foreground px-3 pt-2 pb-1">Popular searches</p>
          {suggestions.map((s, i) => (
            <button key={i} onMouseDown={() => applySuggestion(s)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2 transition-colors">
              <Search className="w-3 h-3 text-muted-foreground flex-shrink-0" />{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}