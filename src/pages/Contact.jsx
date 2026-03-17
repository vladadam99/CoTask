import React, { useState } from 'react';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MessageSquare, Building2, Check } from 'lucide-react';

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="pt-24 pb-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Get in touch</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Have a question, partnership inquiry, or need support? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Mail, title: 'General', desc: 'hello@cotask.com' },
            { icon: MessageSquare, title: 'Support', desc: 'support@cotask.com' },
            { icon: Building2, title: 'Enterprise', desc: 'sales@cotask.com' },
          ].map(item => (
            <GlassCard key={item.title} className="p-6 text-center">
              <item.icon className="w-6 h-6 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-sm">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-8 max-w-xl mx-auto">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Message sent!</h3>
              <p className="text-sm text-muted-foreground">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); setSent(true); }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Name</label>
                  <Input placeholder="Your name" className="bg-muted/50 border-white/5" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email</label>
                  <Input type="email" placeholder="you@email.com" className="bg-muted/50 border-white/5" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Subject</label>
                <Select>
                  <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue placeholder="Choose a topic" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="support">Technical Support</SelectItem>
                    <SelectItem value="enterprise">Enterprise Sales</SelectItem>
                    <SelectItem value="avatar">Becoming an Avatar</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Message</label>
                <Textarea placeholder="Tell us how we can help..." className="bg-muted/50 border-white/5 h-32" />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Send Message</Button>
            </form>
          )}
        </GlassCard>
      </div>
      <Footer />
    </div>
  );
}