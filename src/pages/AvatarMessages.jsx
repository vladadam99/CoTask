import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, MessageSquare, Camera, Loader2 } from 'lucide-react';
import JobActionCard from '@/components/jobs/JobActionCard';
import { Link } from 'react-router-dom';

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

  const linkedJobId = activeConvo?.booking_id?.startsWith('job_') ? activeConvo.booking_id.slice(4) : null;

  const { data: linkedJob, refetch: refetchJob } = useQuery({
    queryKey: ['linked-job-avatar', linkedJobId],
    queryFn: () => base44.entities.JobPost.filter({ id: linkedJobId }).then(r => r[0] || null),
    enabled: !!linkedJobId,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations-avatar', user?.email],
    queryFn: async () => {
      const convos = await base44.entities.Conversation.list('-updated_date', 50);
      return convos.filter(c => (c.participant_emails || []).includes(user.email));
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (urlConvoId && conversations.length > 0 && !activeConvo) {
      const target = conversations.find(c => c.id === urlConvoId);
      if (target) setActiveConvo(target);
    }
  }, [urlConvoId, conversations]);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages-avatar', activeConvo?.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: activeConvo.id }, 'created_date', 100),
    enabled: !!activeConvo,
  });

  useEffect(() => {
    if (!activeConvo) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === activeConvo.id) {
        queryClient.invalidateQueries({ queryKey: ['messages-avatar', activeConvo.id] });
      }
    });
    return unsub;
  }, [activeConvo?.id, queryClient]);

  useEffect(() => {
    const unsub = base44.entities.Conversation.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations-avatar'] });
    });
    return unsub;
  }, [queryClient]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendPhoto = async (file) => {
    if (!file || !activeConvo) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Message.create({
      conversation_id: activeConvo.id,
      sender_email: user.email,
      sender_name: user.full_name,
      content: file_url,
      message_type: 'photo',
    });
    await base44.entities.Conversation.update(activeConvo.id, {
      last_message: '📷 Photo',
      last_message_at: new Date().toISOString(),
      last_message_by: user.email,
    });
    const otherEmail = (activeConvo.participant_emails || []).find(e => e !== user.email);
    if (otherEmail) {
      await base44.entities.Notification.create({
        user_email: otherEmail,
        title: `📷 Photo from ${user.full_name}`,
        message: 'Sent a photo in your job conversation.',
        type: 'message',
        link: `/AvatarMessages?conversation=${activeConvo.id}`,
        reference_id: activeConvo.id,
      });
    }
    setUploadingPhoto(false);
    queryClient.invalidateQueries({ queryKey: ['messages-avatar', activeConvo?.id] });
    queryClient.invalidateQueries({ queryKey: ['conversations-avatar'] });
  };

  const sendMessage = useMutation({
    mutationFn: async () => {
      await base44.entities.Message.create({
        conversation_id: activeConvo.id,
        sender_email: user.email,
        sender_name: user.full_name,
        content: newMsg,
        message_type: 'text',
      });
      await base44.entities.Conversation.update(activeConvo.id, {
        last_message: newMsg,
        last_message_at: new Date().toISOString(),
        last_message_by: user.email,
      });
      const otherEmail = (activeConvo.participant_emails || []).find(e => e !== user.email);
      if (otherEmail) {
        await base44.entities.Notification.create({
          user_email: otherEmail,
          title: `New message from ${user.full_name}`,
          message: newMsg.length > 80 ? newMsg.slice(0, 80) + '…' : newMsg,
          type: 'message',
          link: `/AvatarMessages?conversation=${activeConvo.id}`,
          reference_id: activeConvo.id,
        });
      }
    },
    onSuccess: () => {
      setNewMsg('');
      queryClient.invalidateQueries({ queryKey: ['messages-avatar', activeConvo?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations-avatar'] });
    },
  });

  const getOtherName = (convo) => {
    const idx = (convo.participant_emails || []).findIndex(e => e !== user?.email);
    return (convo.participant_names || [])[idx] || 'Unknown';
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-white/5 flex-shrink-0 ${activeConvo ? 'hidden md:flex' : 'flex'} flex-col`}>
        <div className="p-4 border-b border-white/5">
          <Link to="/AvatarDashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map(c => (
              <button key={c.id} onClick={() => setActiveConvo(c)}
                className={`w-full text-left p-4 border-b border-white/5 transition-colors ${
                  activeConvo?.id === c.id ? 'bg-primary/10' : 'hover:bg-white/5'
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
            <div className="p-8 text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeConvo ? 'hidden md:flex' : 'flex'}`}>
        {activeConvo ? (
          <>
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <button onClick={() => setActiveConvo(null)}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {getOtherName(activeConvo)[0]}
              </div>
              <span className="font-medium flex-1">{getOtherName(activeConvo)}</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto py-2 space-y-3">
              {/* Avatar job controls — hardcoded as avatar role */}
              {linkedJob && (
                <JobActionCard
                  job={linkedJob}
                  user={user}
                  userRole="avatar"
                  conversationId={activeConvo.id}
                  onJobUpdated={() => {
                    refetchJob();
                    queryClient.invalidateQueries({ queryKey: ['messages-avatar', activeConvo.id] });
                  }}
                />
              )}
              <div className="px-4 space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_email === user?.email ? 'justify-end' : 'justify-start'}`}>
                    {m.message_type === 'system' ? (
                      <div className="w-full flex justify-center">
                        <div className="max-w-sm text-center px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-muted-foreground italic">{m.content}</div>
                      </div>
                    ) : (
                      <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5 text-sm ${
                        m.sender_email === user?.email ? 'bg-primary text-primary-foreground rounded-br-md' : 'glass rounded-bl-md'
                      }`}>
                        {m.message_type === 'photo' && <img src={m.content} alt="Photo" className="max-w-xs rounded-xl" />}
                        {m.message_type !== 'photo' && <p>{m.content}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-white/5">
              <form onSubmit={e => { e.preventDefault(); if (newMsg.trim()) sendMessage.mutate(); }} className="flex gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="p-2 rounded-xl bg-muted/50 border border-white/5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) sendPhoto(f); e.target.value = ''; }} />
                <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." className="bg-muted/50 border-white/5" />
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
  );
}