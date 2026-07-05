import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="border-t border-border bg-background px-6 py-24 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-lg border border-border bg-card p-8 text-center shadow-sm md:p-12"
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">Get started</p>
          <h2 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">
            Need trusted eyes on the ground?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Create a clear task or discover a Local Agent who can help with a specific location, proof, or live session.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/PostJob">
              <button className="group flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto">
                New Task <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <Link to="/FindPeople">
              <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-8 py-3.5 text-sm font-bold text-foreground transition-colors hover:bg-secondary/60 sm:w-auto">
                Discover Local Agents
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

