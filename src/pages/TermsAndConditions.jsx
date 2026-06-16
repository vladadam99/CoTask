import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections = [
  {
    title: '1. Who is CoTask?',
    content: `CoTask is a tech company that provides an online platform where independent contractors ("Agents") and clients can connect to arrange for the performance of remote presence and task-based assignments. CoTask is operated by CoTask Ltd, registered in the United Kingdom.`,
  },
  {
    title: '2. How Does CoTask Work?',
    content: `Clients can post a job or booking on the CoTask platform. Agents can respond to these opportunities, and both parties agree on the terms under which the Agent will provide services. If an agreement is reached, they enter into a contract with each other. CoTask is not a party to that agreement — we only facilitate the connection.`,
  },
  {
    title: "3. CoTask's Role",
    content: `CoTask ensures that Agents and clients can find each other and facilitates the arrangement of assignments. CoTask does not manage or give instructions to Agents, does not monitor the implementation of assignments, and does not in any way determine how, when, or by whom work is performed. These are matters you agree upon with the client.`,
  },
  {
    title: '4. Role of the Agent',
    content: `As an Agent on CoTask, you are an independent self-employed contractor. You are responsible for arranging assignments and making agreements with clients. You have multiple clients (variable income), you determine how you carry out work, and you comply with all rules applicable to independent contractors in your jurisdiction. You have the absolute right not to respond to any opportunity and are under no obligation to accept any work.`,
  },
  {
    title: '5. Your Profile',
    content: `Your profile is your calling card on CoTask. You are solely responsible for the accuracy, completeness, and legality of all information on your profile. Profile content must not be misleading, insulting, discriminatory, or otherwise unlawful. CoTask is not liable for the content of your profile.`,
  },
  {
    title: '6. Bookings and Assignments',
    content: `When you arrange a booking or assignment through CoTask, both parties agree to the terms of that specific engagement. CoTask provides tools to facilitate these arrangements but is not a party to any agreement between users. Payments are processed securely through the platform, with Agents receiving their earnings after sessions are completed.`,
  },
  {
    title: '7. Ratings and Reviews',
    content: `The platform allows clients and Agents to rate each other. These ratings appear on profiles. CoTask is not involved in ratings and is not responsible for their content. All reviews must be honest, fair, and comply with our community guidelines.`,
  },
  {
    title: '8. Guarantees and Liability',
    content: `CoTask operates the platform and ensures its proper functioning. All information regarding clients, jobs, Agents, and assignments originates from users and third parties — CoTask is not responsible for accuracy or completeness. To the extent permitted by law, CoTask accepts no liability for any damage suffered by users, regardless of type. This does not limit liability that cannot legally be excluded, including liability for death or personal injury caused by negligence.`,
  },
  {
    title: '9. Use of the Platform',
    content: `The platform may only be used for its intended purpose — connecting clients with Agents for legitimate assignments. You may not use automated systems or bots to access the platform. Your login credentials are personal and must be kept confidential. CoTask may suspend or remove access if there is evidence of misuse, fraud, or violation of these terms.`,
  },
  {
    title: '10. Identity Verification',
    content: `CoTask requires identity verification for Agents to ensure trust and safety on the platform. Verification is powered by Stripe Identity. By completing verification, you consent to your identity documents being processed by Stripe in accordance with their privacy policy. CoTask does not store your identity documents.`,
  },
  {
    title: '11. Payments and Earnings',
    content: `Clients pay securely through the platform when booking. Agents receive payouts after sessions are completed and approved. Agents keep 85% of every booking. CoTask charges a 15% platform fee. Enterprise clients may have custom payment arrangements. In the case of a dispute, CoTask may facilitate resolution but is not obligated to make payments on behalf of either party.`,
  },
  {
    title: '12. Termination',
    content: `Both you and CoTask have the right to terminate use of the platform at any time without prior notice. Termination does not affect obligations under any current assignments. CoTask may remove or suspend access for violations of these terms, including but not limited to fraudulent activity, misuse, or repeated complaints.`,
  },
  {
    title: '13. Changes to These Terms',
    content: `These terms may change from time to time. We will inform you of any significant changes and ask you to agree to them. The most current version of the terms is always available on the CoTask platform. Continued use of the platform after changes constitutes acceptance of the updated terms.`,
  },
  {
    title: '14. Data Protection & Privacy (UK GDPR / EU GDPR)',
    content: `CoTask processes your personal data in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and the EU General Data Protection Regulation (GDPR 2016/679) where applicable. We collect only the data necessary to operate the platform (name, email, address, phone number, and identity verification data). Your data is stored securely and never sold to third parties. You have the right to access, rectify, erase, restrict, and port your data at any time by contacting us at privacy@cotask.com. Our lawful basis for processing is performance of contract (Article 6(1)(b)) and legitimate interests (Article 6(1)(f)). Identity verification data is processed by Stripe Identity under their own privacy policy. You may withdraw consent or request deletion of your account at any time.`,
  },
  {
    title: '15. Governing Law',
    content: `These terms and conditions are governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales. For users based in the European Union, nothing in these terms limits your rights under applicable EU consumer protection laws.`,
  },
];

export default function TermsAndConditions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-strong border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-sm">Terms & Conditions</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="mb-10">
          <Link to="/" className="text-2xl font-black mb-4 inline-block">
            Co<span className="text-primary">Task</span>
          </Link>
          <h1 className="text-3xl font-bold mb-3">Terms & Conditions</h1>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to CoTask. These terms govern the relationship between CoTask and all users of the platform — both clients and Agents. Please read them carefully. By using CoTask, you agree to these terms.
          </p>
          <p className="text-xs text-muted-foreground mt-3">Last updated: May 2026</p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title} className="glass rounded-2xl p-6">
              <h2 className="font-semibold mb-3 text-foreground">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-10 text-center text-xs text-muted-foreground">
          <p>Questions about these terms? <Link to="/Contact" className="text-primary hover:underline">Contact us</Link></p>
          <p className="mt-1">© 2026 CoTask. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}