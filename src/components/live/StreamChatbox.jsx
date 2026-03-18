import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StreamChatbox({ clientName, avatarName, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { id: 1, from: 'system', text: `Session started with ${clientName}`, ts: new Date() },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      from: 'avatar',
      text: input.trim(),
      ts: new Date(),
    }]);
    setInput('');
    // Simulate client reply after 1.5s
    const msg = input.trim();
    setTimeout(() => {
      const replies = [
        'Got it, thanks!',
        'Perfect 👍',
        'Can you zoom in a bit?',
        'Looks great!',
        'Could you turn left?',
      ];
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: 'client',
        text: replies[Math.floor(Math.random() * replies.length)],
        ts: new Date(),
      }]);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-card/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Live Chat</span>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex ${m.from === 'avatar' ? 'justify-end' : 'justify-start'}`}
          >
            {m.from === 'system' ? (
              <p className="text-xs text-muted-foreground text-center w-full py-1">{m.text}</p>
            ) : (
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                m.from === 'avatar'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-secondary text-foreground rounded-bl-sm'
              }`}>
                <p>{m.text}</p>
                <p className={`text-[10px] mt-0.5 ${m.from === 'avatar' ? 'text-white/60' : 'text-muted-foreground'}`}>
                  {m.from === 'avatar' ? 'You' : clientName} · {m.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type a message…"
          className="flex-1 bg-secondary/60 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <Button size="icon" onClick={send} className="shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}