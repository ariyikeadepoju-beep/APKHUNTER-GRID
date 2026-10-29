'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Sparkles,
  Tv,
  Users,
  Radio,
  Smartphone,
  Code2,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function ServicesPage() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/services/catalog')
      .then((res) => res.json())
      .then((data) => setCatalog(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const icons: Record<string, any> = {
    'iptv-subscriptions': Tv,
    'reseller-panels': Users,
    'restream-services': Radio,
    'app-rebranding': Smartphone,
    'custom-app-development': Code2
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={22} className="text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Target Service Offerings & Matching</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            5 specialized business service domains with automated evidence-backed buyer matching rules.
          </p>
        </div>

        <Link
          href="/outreach"
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-400 transition-all"
        >
          <Sparkles size={14} />
          Create Service Proposal
        </Link>
      </div>

      {/* Catalog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {catalog.map((item) => {
          const Icon = icons[item.id] || Layers;
          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-all shadow-md group"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 p-2.5 text-white shadow-md shadow-cyan-500/10">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-cyan-400 font-mono">{item.tagline}</p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-300 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/90 p-3 text-xs">
                  <span className="font-semibold text-slate-400 block text-[11px] uppercase tracking-wider font-mono">
                    Target Buyer Persona:
                  </span>
                  <p className="text-slate-200 mt-1 font-medium">{item.target_buyer}</p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <Link
                  href={`/leads?service=${encodeURIComponent(item.name.replace(' Services', '').replace(' Solutions', ''))}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  View Matched Leads <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
