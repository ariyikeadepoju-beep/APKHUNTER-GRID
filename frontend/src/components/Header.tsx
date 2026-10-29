'use client';

import React, { useState } from 'react';
import { Search, Bell, Shield, Bot, ExternalLink, Terminal } from 'lucide-react';

export default function Header() {
  const [query, setQuery] = useState('');

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#090e1b]/90 px-6 backdrop-blur">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search communities, prospects, or IPTV keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-1.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Action Indicators */}
      <div className="flex items-center gap-4">
        {/* Compliance Guardrail Pill */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
          <Shield size={13} className="text-blue-400" />
          <span>Zero Self-Bot / Anti-Spam Enforced</span>
        </div>

        {/* Discord Bot Status Pill */}
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Bot size={13} />
          <span>Official Bot Gateway</span>
        </div>

        {/* API Docs Quick Link */}
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
        >
          <Terminal size={13} />
          <span>REST API Docs</span>
          <ExternalLink size={11} className="text-slate-500" />
        </a>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-xs text-white">
            OP
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-200">System Operator</p>
            <p className="text-[10px] text-cyan-400 font-mono">admin@apkhunter.grid</p>
          </div>
        </div>
      </div>
    </header>
  );
}
