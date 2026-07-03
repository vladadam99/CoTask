import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Video,
} from 'lucide-react';
import JobActionCard from '@/components/jobs/JobActionCard';
import JobStatusBanner from '@/components/jobs/JobStatusBanner';
import { Link } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';

function formatMessageTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(date);
}

export default function Messages() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [activeConvo, setActiveConvo] = useState(null);
  const [newMsg, setNewMsg] = useState('');
  const [search, setSearch] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const scrollRef = useRef(null);

  const urlConvoId = new URLSearchParams(window.location.search).get('conversation') ||
    new URLSearchParams(window.location.search).get('conv');
  const activeRole = user?.selected_role || user?.role || 'user';
  const shellRole = activeRole === 'avatar' ? 'user' : activeRole;
  const shellHomePath = shellRole === 'user' ? '/Explore' : undefined;
  const dashPath = shellRole === 'enterprise' ? '/EnterpriseDashboard' : '/Explore';

  const getOtherName = (convo) => {
    const idx = (convo.participant_emails || []).findIndex((email) => email !== user?.email);
    return (convo.participant_names || [])[idx] || 'Local Agent';
  };

  const linkedJobId = activeConvo?.booking_id?.startsWith('job_') ? activeConvo.booking_id.slice(4) : null;

  const { data: linkedJob, refetch: refetchJob } = useQuery({
    queryKey: ['linked-job', linkedJobId],
    queryFn: () => base44.entities.JobPost.filter({ id: linkedJobId }).then((result) => result[0] || null),
    enabled: !!linkedJobId,
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      const convos = await base44.entities.Conversation.list('-updated_date', 50);
      return convos.filter((convo) => (convo.participant_emails || []).includes(user.email));
    },
    enabled: !!user,
  });

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((convo) => {
      const otherName = getOtherName(convo).toLowerCase();
      return otherName.includes(query) || (convo.last_message || '').toLowerCase().includes(query);
    });
  }, [conversations, search, user?.email]);

  useEffect(() => {
    if (conversations.length > 0 && !activeConvo) {
      if (urlConvoId) {
        const target = conversations.find((convo) => convo.id === urlConvoId);
        if (target) {
          setActiveConvo(target);
          return;
        }
      }
      setActiveConvo(conversations[0]);
    }
  }, [urlConvoId, conversations, activeConvo]);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', activeConvo?.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: activeConvo.id }, 'created_date', 100),
    enabled: !!activeConvo,
  });

  useEffect(() => {
    if (!activeConvo) return undefined;
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
      content: 'Camera upgrade request: I would like to add Live Camera to this task (+$5/hr). Please reply to confirm.',
      messageType: 'system',
      notifyTitle: `Camera upgrade request from ${user.full_name}`,
      notifyMessage: 'They want to add Live Camera to your task.',
      notifyLink: `/AvatarMessages?conversation=${activeConvo.id}`,
      notifyTargetRole: 'avatar',
    });
    queryClient.invalidateQueries({ queryKey: ['messages', activeConvo?.id] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const sendPhoto = async (file) => {
    if (!file || !activeConvo) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.functions.invoke('sendMessage', {
        conversationId: activeConvo.id,
        content: file_url,
        messageType: 'photo',
        notifyTitle: `Photo from ${user.full_name}`,
        notifyMessage: 'Sent a photo in your task conversation.',
        notifyLink: `/AvatarMessages?conversation=${activeConvo.id}`,
        notifyTargetRole: 'avatar',
      });
      queryClient.invalidateQueries({ queryKey: ['messages', activeConvo?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const sendMessage = useMutation({
    mutationFn: async () => {
      const content = newMsg.trim();
      if (!activeConvo || !content) return;
      await base44.functions.invoke('sendMessage', {
        conversationId: activeConvo.id,
        content,
        messageType: 'text',
        notifyLink: `/AvatarMessages?conversation=${activeConvo.id}`,
        notifyTargetRole: 'avatar',
      });
    },
    onSuccess: () => {
      setNewMsg('');
      queryClient.invalidateQueries({ queryKey: ['messages', activeConvo?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const renderMessageContent = (message) => {
    const content = message.content || '';
    const liveMatch = content.match(/\/ClientLiveView\?session=([^\s]+)/);
    if (!liveMatch) return <p className="whitespace-pre-wrap break-words">{content}</p>;

    const text = content.replace(liveMatch[0], '').replace(/Join here:\s*$/i, '').trim();
    return (
      <div className="space-y-2">
        {text && <p className="whitespace-pre-wrap break-words">{text}</p>}
        <Link to={liveMatch[0]}>
          <Button size="sm" className="h-8 gap-1.5 text-xs">
            <Video className="h-3.5 w-3.5" /> Join live session
          </Button>
        </Link>
      </div>
    );
  };

  const activeName = activeConvo ? getOtherName(activeConvo) : 'Conversation';

  return (
    <AppShell navItems={getNavItems(shellRole)} user={user} roleOverride={shellRole} homePathOverride={shellHomePath} fullBleed>
      <div className="h-screen bg-background pt-14 pb-20 lg:pt-0 lg:pb-0">
        <div className="flex h-full overflow-hidden">
          <aside className={`w-full border-r border-border bg-card md:w-[22rem] lg:w-96 ${activeConvo ? 'hidden md:flex' : 'flex'} flex-col`}>
            <div className="border-b border-border bg-card p-4">
              <Link to={dashPath} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {shellRole === 'enterprise' ? 'Enterprise' : 'Explore'}
              </Link>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-label">Inbox</p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Messages</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Coordinate tasks, proof, live links, and payments.</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations..."
                  className="h-11 rounded-lg border-input bg-background pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversationsLoading ? (
                <div className="space-y-2 p-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-20 rounded-lg bg-secondary animate-pulse" />
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="p-2">
                  {filteredConversations.map((convo) => {
                    const selected = activeConvo?.id === convo.id;
                    const otherName = getOtherName(convo);
                    return (
                      <button
                        key={convo.id}
                        onClick={() => setActiveConvo(convo)}
                        className={`w-full rounded-lg border p-3 text-left transition-all ${
                          selected
                            ? 'border-primary/30 bg-primary/10'
                            : 'border-transparent hover:border-border hover:bg-secondary/70'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                            {otherName[0] || 'A'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-black text-foreground">{otherName}</p>
                              {convo.updated_date && <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">{formatMessageTime(convo.updated_date)}</span>}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {convo.last_message || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <MessageSquare className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-black text-foreground">No conversations yet</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Messages appear after a Direct Hire request or after you choose an agent for an Open Task.
                  </p>
                  <Button asChild className="mt-5">
                    <Link to="/Explore">Find an Agent</Link>
                  </Button>
                </div>
              )}
            </div>
          </aside>

          <section className={`min-w-0 flex-1 ${!activeConvo ? 'hidden md:flex' : 'flex'} flex-col bg-background`}>
            {activeConvo ? (
              <>
                <header className="border-b border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setActiveConvo(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                      {activeName[0] || 'A'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black text-foreground">{activeName}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary" /> Task conversation</span>
                        {linkedJob && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3 text-primary" /> {linkedJob.title || 'Open Task'}</span>}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="hidden border-border sm:inline-flex">
                      <Link to={linkedJob ? `/JobDetail?id=${linkedJob.id}` : '/Bookings'}>
                        View Task <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    {linkedJob?.started_at && linkedJob?.status === 'in_progress' && (
                      <Button size="sm" onClick={requestCamera} className="hidden gap-1.5 sm:inline-flex">
                        <Video className="h-3.5 w-3.5" /> Request Camera
                      </Button>
                    )}
                  </div>
                </header>

                <div ref={scrollRef} className="flex-1 overflow-y-auto">
                  {linkedJob && (
                    <div className="border-b border-border bg-secondary/35 p-3 md:p-4">
                      <div className="mx-auto max-w-3xl space-y-3">
                        <JobActionCard
                          job={linkedJob}
                          user={user}
                          userRole="user"
                          conversationId={activeConvo.id}
                          onJobUpdated={() => {
                            refetchJob();
                            queryClient.invalidateQueries({ queryKey: ['messages', activeConvo.id] });
                          }}
                        />
                        <JobStatusBanner job={linkedJob} onJobUpdated={refetchJob} />
                      </div>
                    </div>
                  )}

                  <div className="mx-auto max-w-3xl space-y-3 px-4 py-5">
                    {messages.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
                        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-primary" />
                        <h3 className="font-black text-foreground">Start the conversation</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Share context, access details, timing, and proof requirements.</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const mine = message.sender_email === user?.email;
                        if (message.message_type === 'system') {
                          return (
                            <div key={message.id} className="flex justify-center">
                              <div className="max-w-md rounded-lg border border-border bg-secondary/70 px-3 py-2 text-center text-xs leading-relaxed text-muted-foreground">
                                {renderMessageContent(message)}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[82%] rounded-lg px-4 py-2.5 text-sm shadow-sm md:max-w-[70%] ${
                              mine
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border bg-card text-foreground'
                            }`}>
                              {message.message_type === 'photo' ? (
                                <img src={message.content} alt="Shared attachment" className="max-h-80 rounded-lg object-contain" />
                              ) : (
                                renderMessageContent(message)
                              )}
                              <p className={`mt-1 text-[10px] font-semibold ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {formatMessageTime(message.created_date)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <footer className="border-t border-border bg-card p-3 md:p-4">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (newMsg.trim()) sendMessage.mutate();
                    }}
                    className="mx-auto flex max-w-3xl items-end gap-2"
                  >
                    <label className={`inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground ${uploadingPhoto ? 'pointer-events-none opacity-50' : ''}`} title="Attach photo">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) sendPhoto(file);
                          event.target.value = '';
                        }}
                      />
                      {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    </label>
                    <Input
                      value={newMsg}
                      onChange={(event) => setNewMsg(event.target.value)}
                      placeholder="Message the agent..."
                      className="h-11 rounded-lg border-input bg-background"
                    />
                    <Button type="submit" className="h-11 w-11 shrink-0 p-0" disabled={!newMsg.trim() || sendMessage.isPending}>
                      {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </footer>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8">
                <div className="max-w-sm text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <MessageSquare className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-black text-foreground">Select a conversation</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Choose a task conversation from the inbox to coordinate details.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

