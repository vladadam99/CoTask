import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Scale, Loader2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

export default function DisputeAgent() {
  const { user } = useCurrentUser();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const scrollRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('jobId');

  useEffect(() => {
    if (!user) return;
    initConversation();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const initConversation = async () => {
    setInitializing(true);
    const convo = await base44.agents.createConversation({
      agent_name: 'dispute_agent',
      metadata: { name: 'Dispute Resolution', user: user?.email },
    });
    setConversation(convo);
    setMessages(convo.messages || []);

    // If a jobId was passed, auto-send context
    if (jobId) {
      const autoMsg = await base44.agents.addMessage(convo, {
        role: 'user',
        content: `I have a dispute for Job ID: ${jobId}. Please look it up and help me resolve it.`,
      });
      setConversation(autoMsg);
      setMessages(autoMsg.messages || []);
    }

    setInitializing(false);

    base44.agents.subscribeToConversation(convo.id, (data) => {
      setMessages(data.messages || []);
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !conversation || loading) return;
    const text = input.trim();
    setInput('');
    setLoading(true);
    const updated = await base44.agents.addMessage(conversation, { role: 'user', content: text });
    setConversation(updated);
    setMessages(updated.messages || []);
    setLoading(false);
  };

  const dashPath = user?.role === 'avatar' ? '/AvatarDashboard' : user?.role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
        <Link to={dashPath} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <Scale className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="font-semibold">Dispute Resolution</h1>
          <p className="text-xs text-muted-foreground">AI-powered fair resolution</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {initializing ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {messages.filter(m => m.role !== 'system').length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Scale className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Dispute Resolution Agent</h2>
                  <p className="text-sm text-muted-foreground mt-1">Describe your dispute and I'll help find a fair resolution for both parties.</p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-sm">
                  {['I have a dispute about a completed job', 'The avatar didn\'t finish the work', 'Client is not releasing payment'].map(s => (
                    <button key={s} onClick={() => setInput(s)}
                      className="text-left text-sm px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-muted-foreground">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.filter(m => m.role !== 'system').map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                {m.role !== 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Scale className="w-4 h-4 text-orange-400" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'glass border border-white/5 rounded-bl-md'
                }`}>
                  {m.role === 'user' ? (
                    <p>{m.content}</p>
                  ) : (
                    <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-4 h-4 text-orange-400" />
                </div>
                <div className="glass border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 flex-shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe your dispute..."
            className="bg-muted/50 border-white/5"
            disabled={initializing || loading}
          />
          <Button type="submit" disabled={!input.trim() || initializing || loading} className="bg-orange-600 hover:bg-orange-700">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}