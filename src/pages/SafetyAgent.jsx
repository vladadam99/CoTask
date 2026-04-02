import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Shield, Loader2, AlertTriangle, CheckCircle, Eye, Flag, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const SEVERITY_STYLES = {
  low: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  medium: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  critical: 'text-red-300 bg-red-600/20 border-red-600/40',
};

const STATUS_STYLES = {
  pending: 'text-yellow-400',
  reviewed: 'text-blue-400',
  dismissed: 'text-muted-foreground',
  actioned: 'text-green-400',
};

export default function SafetyAgent() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState('flagged');
  const scrollRef = useRef(null);

  const { data: flaggedItems = [], refetch: refetchFlagged } = useQuery({
    queryKey: ['flagged-content'],
    queryFn: () => base44.entities.FlaggedContent.list('-created_date', 50),
    enabled: !!user && user.role === 'admin',
  });

  const pendingCount = flaggedItems.filter(f => f.status === 'pending').length;

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    initConversation();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const initConversation = async () => {
    setInitializing(true);
    const convo = await base44.agents.createConversation({
      agent_name: 'safety_agent',
      metadata: { name: 'Safety Review', admin: user?.email },
    });
    setConversation(convo);
    setMessages(convo.messages || []);
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

  const updateFlagStatus = async (id, status) => {
    await base44.entities.FlaggedContent.update(id, { status });
    refetchFlagged();
  };

  if (!user) return null;

  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Admin access required</p>
          <Link to="/" className="text-primary text-sm mt-2 block">Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
        <Link to="/AdminDashboard" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold">Safety & Trust</h1>
          <p className="text-xs text-muted-foreground">AI content moderation</p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount} pending</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 flex-shrink-0">
        {[{ id: 'flagged', label: 'Flagged Content', icon: Flag }, { id: 'chat', label: 'AI Agent', icon: Shield }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'flagged' && pendingCount > 0 && (
              <span className="bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Flagged Content Tab */}
      {activeTab === 'flagged' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {flaggedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <CheckCircle className="w-12 h-12 text-green-400" />
              <p className="font-medium">All clear!</p>
              <p className="text-sm text-muted-foreground">No flagged content at this time.</p>
            </div>
          ) : (
            flaggedItems.map(item => (
              <div key={item.id} className={`glass rounded-2xl p-4 border space-y-3 ${SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.medium}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wide">{item.severity} — {item.entity_type}</span>
                  </div>
                  <span className={`text-xs font-medium ${STATUS_STYLES[item.status]}`}>{item.status}</span>
                </div>
                <p className="text-sm text-foreground font-medium">{item.reason}</p>
                {item.content_preview && (
                  <p className="text-xs text-muted-foreground italic border border-white/5 rounded-lg px-3 py-2 bg-white/5">
                    "{item.content_preview}"
                  </p>
                )}
                {item.media_url && (
                  <img src={item.media_url} alt="Flagged media" className="max-h-32 rounded-xl object-cover border border-white/10" />
                )}
                <div className="text-xs text-muted-foreground">By: {item.author_email}</div>
                {item.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10 gap-1.5"
                      onClick={() => updateFlagStatus(item.id, 'dismissed')}>
                      <CheckCircle className="w-3.5 h-3.5" /> Dismiss
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1.5"
                      onClick={() => updateFlagStatus(item.id, 'actioned')}>
                      <XCircle className="w-3.5 h-3.5" /> Take Action
                    </Button>
                    <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 gap-1.5"
                      onClick={() => { setActiveTab('chat'); setInput(`Review flagged item ID: ${item.id} — ${item.entity_type} from ${item.author_email}. Reason: ${item.reason}`); }}>
                      <Eye className="w-3.5 h-3.5" /> AI Review
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* AI Agent Chat Tab */}
      {activeTab === 'chat' && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {initializing ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {messages.filter(m => m.role !== 'system').length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Safety AI Agent</h2>
                      <p className="text-sm text-muted-foreground mt-1">Ask me to review flagged content, investigate users, or analyse platform safety.</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-sm">
                      {['Show me all critical flags', 'Investigate user by email', 'Review all pending flagged items'].map(s => (
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
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield className="w-4 h-4 text-blue-400" />
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
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="glass border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 border-t border-white/5 flex-shrink-0">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask the safety agent..."
                className="bg-muted/50 border-white/5"
                disabled={initializing || loading}
              />
              <Button type="submit" disabled={!input.trim() || initializing || loading} className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}