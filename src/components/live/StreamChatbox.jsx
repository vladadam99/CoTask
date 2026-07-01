import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StreamChatbox({ clientName, avatarName, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { id: 1, from: 'system', text: `Session started with ${clientName || 'Client'}`, ts: new Date() },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const localAgentName = avatarName || 'Local Agent';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, {
      id: Date.now(),
      from: 'avatar',
      text: input.trim(),
      ts: new Date(),
    }]);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card/90">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Live Session Chat</span>
          <span className="h-2 w-2 rounded-full bg-green-500" />
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.from === 'avatar' ? 'justify-end' : 'justify-start'}`}
          >
            {message.from === 'system' ? (
              <p className="w-full py-1 text-center text-xs text-muted-foreground">{message.text}</p>
            ) : (
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                message.from === 'avatar'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-secondary text-foreground rounded-bl-sm'
              }`}>
                <p>{message.text}</p>
                <p className={`mt-0.5 text-[10px] ${message.from === 'avatar' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {message.from === 'avatar' ? localAgentName : clientName || 'Client'} - {message.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && send()}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <Button size="icon" onClick={send} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
