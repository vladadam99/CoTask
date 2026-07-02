import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';

function timeLabel(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function StreamChatbox({
  clientName,
  avatarName,
  bookingId,
  conversationId,
  senderRole = 'avatar',
  notifyTargetRole,
  isOpen,
  onClose,
}) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const hasConversationTarget = !!conversationId || !!bookingId;

  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['stream-chat-conversation', conversationId, bookingId],
    queryFn: async () => {
      if (conversationId) {
        const list = await base44.entities.Conversation.filter({ id: conversationId });
        return list[0] || null;
      }
      if (bookingId) {
        const list = await base44.entities.Conversation.filter({ booking_id: bookingId });
        return list[0] || null;
      }
      return null;
    },
    enabled: isOpen && !!user && hasConversationTarget,
    refetchInterval: 3000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['stream-chat-messages', conversation?.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: conversation.id }, 'created_date', 100),
    enabled: isOpen && !!conversation?.id,
  });

  useEffect(() => {
    if (!conversation?.id) return undefined;
    const unsubscribeMessages = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === conversation.id) {
        queryClient.invalidateQueries({ queryKey: ['stream-chat-messages', conversation.id] });
      }
    });
    const unsubscribeConversation = base44.entities.Conversation.subscribe((event) => {
      if (event.id === conversation.id) {
        queryClient.invalidateQueries({ queryKey: ['stream-chat-conversation', conversationId, bookingId] });
      }
    });
    return () => {
      unsubscribeMessages?.();
      unsubscribeConversation?.();
    };
  }, [bookingId, conversation?.id, conversationId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      const content = input.trim();
      if (!content || !conversation?.id) return;
      const targetRole = notifyTargetRole || (senderRole === 'avatar' ? 'user' : 'avatar');
      await base44.functions.invoke('sendMessage', {
        conversationId: conversation.id,
        content,
        messageType: 'text',
        notifyTitle: `Live message from ${user?.full_name || 'CoTask'}`,
        notifyMessage: content,
        notifyLink: senderRole === 'avatar'
          ? `/Messages?conversation=${conversation.id}`
          : `/AvatarMessages?conversation=${conversation.id}`,
        notifyTargetRole: targetRole,
      });
    },
    onSuccess: () => {
      setInput('');
      if (conversation?.id) {
        queryClient.invalidateQueries({ queryKey: ['stream-chat-messages', conversation.id] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
  });

  const send = () => {
    if (!input.trim() || !conversation?.id || sendMessage.isPending) return;
    sendMessage.mutate();
  };

  if (!isOpen) return null;

  const localAgentName = avatarName || 'Local Agent';
  const otherName = senderRole === 'avatar' ? (clientName || 'Client') : localAgentName;
  const unavailable = !hasConversationTarget || (!conversationLoading && !conversation?.id);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card/90">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Live Session Chat</span>
          <span className={`h-2 w-2 rounded-full ${conversation?.id ? 'bg-green-500' : 'bg-yellow-500'}`} />
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {conversationLoading ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Connecting to task conversation...</p>
        ) : unavailable ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/35 p-4 text-center">
            <p className="text-sm font-semibold">Conversation chat unavailable</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Booked live sessions use the task conversation. Public live chat is not enabled yet.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Messages sent here will stay in the task conversation.
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_email === user?.email;
            const isSystem = message.message_type === 'system';
            return (
              <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                {isSystem ? (
                  <p className="w-full py-1 text-center text-xs text-muted-foreground">{message.content}</p>
                ) : (
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-secondary text-foreground rounded-bl-sm'
                  }`}>
                    <p>{message.content}</p>
                    <p className={`mt-0.5 text-[10px] ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {isMine ? 'You' : (message.sender_name || otherName)} - {timeLabel(message.created_date)}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && send()}
          placeholder={conversation?.id ? 'Type a message...' : 'Conversation not connected'}
          disabled={!conversation?.id || sendMessage.isPending}
          className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Button size="icon" onClick={send} disabled={!conversation?.id || !input.trim() || sendMessage.isPending} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
