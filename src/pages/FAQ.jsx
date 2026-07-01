import React from 'react';
import InfoPageHeader from '@/components/layout/InfoPageHeader';
import Footer from '@/components/landing/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    q: 'What is CoTask?',
    a: 'CoTask is a marketplace for remote physical tasks. It connects people and businesses with Local Agents who can visit a location, inspect something, record proof, or livestream when available.',
  },
  {
    q: 'How is this different from a video call?',
    a: 'A Local Agent is physically at the location. They can follow your instructions, show details on camera, ask local questions, and upload proof for review.',
  },
  {
    q: 'What can I use CoTask for?',
    a: 'Common uses include property walkthroughs, vehicle checks, local errands, event attendance, queue checks, campus visits, business site inspections, product demos, and local verification tasks.',
  },
  {
    q: 'How do I become a Local Agent?',
    a: 'Sign up, choose Local Agent as your role, complete your profile, add services and availability, and complete any required verification steps shown in the app.',
  },
  {
    q: 'How do Local Agents set prices?',
    a: 'Local Agents set their own rates or task prices. The final amount is shown before a request is sent or a Secure Payment checkout is started.',
  },
  {
    q: 'Is CoTask safe?',
    a: 'CoTask includes profile reviews, task records, proof uploads, messaging, verification workflows where available, and issue reporting so both sides have context if a task needs review.',
  },
  {
    q: 'What equipment do Local Agents need?',
    a: 'At minimum, a smartphone with a reliable data connection. Some tasks may request extra equipment such as a headset, vehicle, laptop, drone, or 360-degree camera.',
  },
  {
    q: 'How do payments work?',
    a: 'Clients fund Secure Payment when required. Funds are held for the task and released after approval or a reviewed resolution.',
  },
  {
    q: 'Does CoTask support businesses?',
    a: 'Yes. Enterprise workflows are designed for teams coordinating remote inspections, site checks, field support, and repeat multi-location tasks.',
  },
  {
    q: 'What about live video streaming?',
    a: 'Live video is available for supported sessions and devices. If live video is not part of a task, messaging and proof uploads can still be used for coordination and review.',
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      <InfoPageHeader />
      <main className="px-6 pb-20 pt-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 rounded-lg border border-border bg-card p-6 text-center shadow-sm md:p-8">
            <p className="text-xs font-bold tracking-[0.18em] text-primary">Help center</p>
            <h1 className="mt-3 text-4xl font-black text-foreground">Frequently Asked Questions</h1>
            <p className="mt-3 text-muted-foreground">Clear answers about tasks, Local Agents, live sessions, and Secure Payment.</p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`faq-${i}`} className="surface-panel rounded-lg border-border px-6">
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
}
