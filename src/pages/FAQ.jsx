import React from 'react';
import InfoPageHeader from '@/components/layout/InfoPageHeader';
import Footer from '@/components/landing/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: 'What is CoTask?', a: 'CoTask is a live human presence marketplace. It connects people and businesses with local avatars who can physically go to a location and act as your remote eyes, hands, and guide in real time.' },
  { q: 'How is this different from a video call?', a: "Unlike video calls, your CoTask avatar is physically at the location. They walk, interact, pick things up, ask questions, and stream everything live. It's real-world presence, not screen-to-screen communication." },
  { q: 'What can I use CoTask for?', a: 'Live city tours, property walkthroughs, shopping assistance, event attendance, queue standing, campus tours, business site inspections, product demos, family support, and much more.' },
  { q: 'How do I become an agent?', a: 'Sign up, choose "Local Agent" as your role, complete your profile, pass verification, and start accepting tasks. All you need is a smartphone and reliable internet connection.' },
  { q: 'How much do avatars earn?', a: 'Avatars set their own rates and keep 85% of every booking. Rates vary by service type, location, and experience. Most avatars earn between $25???$100 per hour.' },
  { q: 'Is CoTask safe?', a: 'Yes. All avatars go through identity verification. Every session is tracked. Both parties can rate and review. We have a dedicated trust and safety team.' },
  { q: 'What equipment do avatars need?', a: 'At minimum, a smartphone with good data connection. For premium experiences, a headset, 360?? camera, or specialized equipment may be beneficial.' },
  { q: 'Does CoTask support businesses?', a: 'Absolutely. Our Enterprise plan offers bulk booking, custom invoicing, team management, and dedicated support for business use cases like site inspections and field operations.' },
  { q: 'How do payments work?', a: 'Users pay securely through the platform when booking. Avatars receive payouts after sessions are completed. Enterprise clients can opt for monthly invoicing.' },
  { q: 'What about live video streaming?', a: 'We are actively developing real-time video, audio, and 360?? streaming capabilities. The current beta focuses on booking, coordination, and session management. Full live streaming is coming soon.' },
];

export default function FAQ() {
  return (
    <div className="min-h-screen">
      <InfoPageHeader />
      <div className="pt-24 pb-20 px-6 max-w-3xl mx-auto">
        <div className="relative overflow-hidden rounded-lg border border-border bg-foreground p-6 md:p-8 text-center text-background shadow-sm mb-12">
          <p className="text-xs font-bold tracking-[0.18em] text-primary">Help center</p>
          <h1 className="text-4xl font-black mt-3 mb-4 text-white">Frequently Asked Questions</h1>
          <p className="text-white/70">Everything you need to know about CoTask</p>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="surface-panel rounded-lg border-border px-6">
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <Footer />
    </div>
  );
}

