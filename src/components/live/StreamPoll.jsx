import React, { useState } from 'react';
import { BarChart2, Plus, Trash2, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';

export default function StreamPoll({ isLive }) {
  const [polls, setPolls] = useState([]);
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [activePoll, setActivePoll] = useState(null);

  const addOption = () => { if (options.length < 4) setOptions(v => [...v, '']); };
  const removeOption = (i) => { if (options.length > 2) setOptions(v => v.filter((_, idx) => idx !== i)); };
  const updateOption = (i, val) => setOptions(v => v.map((o, idx) => idx === i ? val : o));

  const launchPoll = () => {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) return;
    const poll = {
      id: Date.now(),
      question: question.trim(),
      options: options.filter(o => o.trim()).map(label => ({ label, votes: 0 })),
      active: true,
      createdAt: new Date(),
    };
    setPolls(v => [...v, poll]);
    setActivePoll(poll);
    setCreating(false);
    setQuestion('');
    setOptions(['', '']);
  };

  // Simulate a vote (in real app this would be via WebSocket/DB)
  const vote = (pollId, optionIdx) => {
    setPolls(v => v.map(p => {
      if (p.id !== pollId) return p;
      const updated = { ...p, options: p.options.map((o, i) => i === optionIdx ? { ...o, votes: o.votes + 1 } : o) };
      if (activePoll?.id === pollId) setActivePoll(updated);
      return updated;
    }));
  };

  const closePoll = (pollId) => {
    setPolls(v => v.map(p => p.id === pollId ? { ...p, active: false } : p));
    if (activePoll?.id === pollId) setActivePoll(null);
  };

  const totalVotes = (poll) => poll.options.reduce((s, o) => s + o.votes, 0);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-400" /> Interactive Polls
        </h2>
        {isLive && !creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Poll
          </button>
        )}
      </div>

      {!isLive && (
        <p className="text-xs text-muted-foreground">Polls are available once you go live.</p>
      )}

      {/* Poll Creator */}
      {isLive && creating && (
        <div className="space-y-3 mb-4">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask your client something…"
            className="w-full text-xs bg-card/60 border border-white/10 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
          />
          <div className="space-y-1.5">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={e => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 text-xs bg-card/60 border border-white/10 rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
                />
                {options.length > 2 && (
                  <button onClick={() => removeOption(i)} className="text-muted-foreground hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 4 && (
              <button onClick={addOption} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add option
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs" onClick={launchPoll}>
              <Send className="w-3 h-3" /> Launch Poll
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Active Poll */}
      {activePoll && (
        <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-foreground">{activePoll.question}</p>
            <button onClick={() => closePoll(activePoll.id)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5">
            {activePoll.options.map((opt, i) => {
              const total = totalVotes(activePoll);
              const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
              return (
                <button key={i} onClick={() => vote(activePoll.id, i)} className="w-full text-left group">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-foreground group-hover:text-blue-300 transition-colors">{opt.label}</span>
                    <span className="text-muted-foreground">{pct}% ({opt.votes})</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{totalVotes(activePoll)} votes · tap to vote</p>
        </div>
      )}

      {/* Past polls */}
      {polls.filter(p => !p.active).length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground mb-1">Past polls</p>
          {polls.filter(p => !p.active).map(poll => (
            <div key={poll.id} className="text-xs text-muted-foreground bg-card/40 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="truncate">{poll.question}</span>
              <span>{totalVotes(poll)} votes</span>
            </div>
          ))}
        </div>
      )}

      {isLive && polls.length === 0 && !creating && (
        <p className="text-xs text-muted-foreground">No polls yet. Create one to engage your client.</p>
      )}
    </GlassCard>
  );
}