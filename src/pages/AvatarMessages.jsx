import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, MessageSquare, Camera, Loader2 } from 'lucide-react';
import JobActionCard from '@/components/jobs/JobActionCard';
import JobStatusTracker from '@/components/jobs/JobStatusTracker';
import { Link } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';

export default function AvatarMessages() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [activeConvo, setActiveConvo] = useState(null);
  const [newMsg, setNewMsg] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);
  const scrollRef = useRef(null);

  const urlConvoId = new URLSearchParams(window.location.search).get('conversation') ||
    new URLSearchParams(window.location.search).get('conv');

  // Derive linked job ID from booking_id field (format: job_<jobId>)
  const linkedJobId = activeConvo?.booking_id?.startsWith('job_') ? activeConvo.booking_id.slice(4) : null;

  const { data: linkedJob, refetch: refetchJob } = useQuery({
    queryKey: ['linked-job', linkedJobId],
    queryFn: () => base44.entities.JobPost.filter({ id: linkedJobId }).then(r => r[0] || null),
    enabled: !!linkedJobId,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      const convos = await base44.entities.Conversation.list('-updated_date', 50);
      return convos.filter(c => (c.participant_emails || []).includes(user.email));
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (conversations.length > 0 && !activeConvo) {
      if (urlConvoId) {
        const target = conversations.find(c => c.id === urlConvoId);
        if (target) { setActiveConvo(target); return; }
      }
      // Auto-open the most recent conversation
      setActiveConvo(conversations[0]);
    }
  }, [urlConvoId, conversations]);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', activeConvo?.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: activeConvo.id }, 'created_date', 100),
    enabled: !!activeConvo,
  });

  useEffect(() => {
    if (!activeConvo) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === activeConvo.id) {
        queryClient.invalidateQueries({ queryKey: ['messages', activeConvo.id] });
      }
    });
    return unsub;
  }, [activeConvo?.id, queryClient]);

  useEffect(() => {
    const unsub = base44.entities.Conversation.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
    return unsub;
  }, [queryClient]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const requestCamera = async () => {
    if (!activeConvo) return;
    await base44.functions.invoke('sendMessage', {
      conversationId: activeConvo.id,
      content: "Camera upgrade request: I would like to add Live Camera to this task (+$5/hr). Please reply to confirm.",
      messageType: 'system',
      notifyTitle: `Camera upgrade request from ${user.full_name}`,
      notifyMessage: 'They want to add Live Camera to your task.',
      notifyLink: `/Messages?conversation=${activeConvo.id}`,
      notifyTargetRole: 'user'
    });
    queryClient.invalidateQueries({ queryKey: ['messages', activeConvo?.id] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const sendPhoto = async (file) => {
    if (!file || !activeConvo) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.functions.invoke('sendMessage', {
      conversationId: activeConvo.id,
      content: file_url,
      messageType: 'photo',
      notifyTitle: `Photo from ${user.full_name}`,
      notifyMessage: 'Sent a photo in your task conversation.',
      notifyLink: `/Messages?conversation=${activeConvo.id}`,
      notifyTargetRole: 'user'
    });
    setUploadingPhoto(false);
    queryClient.invalidateQueries({ queryKey: ['messages', activeConvo?.id] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const sendMessage = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('sendMessage', {
        conversationId: activeConvo.id,
        content: newMsg,
        messageType: 'text',
        notifyLink: `/Messages?conversation=${activeConvo.id}`,
        notifyTargetRole: 'user'
      });
    },
    onSuccess: () => {
      setNewMsg('');
      queryClient.invalidateQueries({ queryKey: ['messages', activeConvo?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const getOtherName = (convo) => {
    const idx = (convo.participant_emails || []).findIndex(e => e !== user?.email);
    return (convo.participant_names || [])[idx] || 'Unknown';
  };

  const activeRole = user?.selected_role || user?.role || 'avatar';

  return (
    <AppShell navItems={getNavItems(activeRole)} user={user} fullBleed>
    <div className="flex h-[calc(100vh-56px)] lg:h-screen bg-background overflow-hidden">
      {/* Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-border bg-card/70 flex-shrink-0 ${activeConvo ? 'hidden md:flex' : 'flex'} flex-col`}>
        <div className="p-4 border-b border-border bg-card/90">
          <Link to="/AvatarDashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <p className="section-label">Agent inbox</p>
          <h1 className="text-xl font-black">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map(c => (
              <button key={c.id} onClick={() => setActiveConvo(c)}
                className={`w-full text-left p-4 border-b border-border transition-colors ${
                  activeConvo?.id === c.id ? 'bg-primary/10' : 'hover:bg-secondary/60'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {getOtherName(c)[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{getOtherName(c)}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.last_message || 'No messages yet'}</p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-1">No conversations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Messages appear after a Direct Hire request or after a Local Agent is selected for an Open Task.</p>
              <Link to="/AvatarRequests">
                <Button size="sm" variant="outline">Go to My Schedule</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeConvo ? 'hidden md:flex' : 'flex'}`}>
        {activeConvo ? (
          <>
            <div className="p-4 border-b border-border bg-card/90 flex items-center gap-3">
              <button onClick={() => setActiveConvo(null)} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {getOtherName(activeConvo)[0]}
              </div>
              <span className="font-medium flex-1">{getOtherName(activeConvo)}</span>

            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto py-2 space-y-3">
              {/* Job action card at top of chat - AVATAR VIEW ONLY */}
              {linkedJob && (
                <JobActionCard
                  job={linkedJob}
                  user={user}
                  userRole="avatar"
                  conversationId={activeConvo.id}
                  onJobUpdated={() => {
                    refetchJob();
                    queryClient.invalidateQueries({ queryKey: ['messages', activeConvo.id] });
                  }}
                />
              )}
              {linkedJob && (
                <JobStatusTracker
                  job={linkedJob}
                  user={user}
                  conversationId={activeConvo.id}
                  onJobUpdated={() => {
                    refetchJob();
                    queryClient.invalidateQueries({ queryKey: ['messages', activeConvo.id] });
                  }}
                />
              )}
              <div className="px-4 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_email === user?.email ? 'justify-end' : 'justify-start'}`}>
                  {m.message_type === 'system' ? (
                    <div className="w-full flex justify-center">
                      <div className="max-w-sm text-center px-3 py-2 rounded-xl bg-secondary/60 border border-border text-xs text-muted-foreground italic">{m.content}</div>
                    </div>
                  ) : (
                    <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5 text-sm ${
                      m.sender_email === user?.email ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border rounded-bl-md'
                    }`}>
                      {m.message_type === 'photo' && <img src={m.content} alt="Photo" className="max-w-xs rounded-xl" />}
                      {m.message_type !== 'photo' && <p>{m.content}</p>}
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
            <div className="p-4 border-t border-border bg-card/90">
              <form onSubmit={e => { e.preventDefault(); if (newMsg.trim()) sendMessage.mutate(); }} className="flex gap-2">
                <label className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`} title="Photo">
                  <input type="file" accept="image/*" style={{position:'absolute',width:0,height:0,opacity:0}} onChange={e => { const f = e.target.files?.[0]; if (f) sendPhoto(f); e.target.value = ''; }} />
                  {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </label>
                <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." className="bg-card border-border" />
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={!newMsg.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </AppShell>
  );
}
