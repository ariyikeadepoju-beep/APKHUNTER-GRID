'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Search,
  Plus,
  Filter,
  ExternalLink,
  Users,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';

export default function DiscoveryPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  
  // Submit Invite Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteCategory, setInviteCategory] = useState('Streaming Infrastructure');
  const [inviteNotes, setInviteNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const suggestedKeywords = [
    'Streaming app developer',
    'Streaming app branding',
    'Android TV applications',
    'Fire TV app development',
    'Smart TV application developer',
    'Streaming service owner',
    'Reseller panel software',
    'Streaming infrastructure',
    'OTT platform development'
  ];

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedTier) params.append('fit_tier', selectedTier);

      const res = await fetch(`/api/v1/discovery/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setCommunities(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/v1/discovery/sources');
      if (res.ok) {
        const json = await res.json();
        setSources(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCommunities();
    fetchSources();
  }, [selectedCategory, selectedTier]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCommunities();
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch('/api/v1/discovery/submit-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_url_or_code: inviteInput,
          category: inviteCategory,
          notes: inviteNotes
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || 'Failed to submit invitation.');
      }

      setSubmitSuccess(`Community '${json.name}' recorded successfully with Suitability Score ${json.suitability_score} (${json.fit_tier})!`);
      setInviteInput('');
      setInviteNotes('');
      fetchCommunities();
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(null);
      }, 2000);
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting invite');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Compass size={22} className="text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Community Discovery</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Prospecting workspace for permitted public directories, niche developer hubs, and manually submitted Discord servers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-400 transition-all"
          >
            <Plus size={15} />
            Submit Server Invite
          </button>
        </div>
      </div>

      {/* Suggested Keywords Pill Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles size={13} className="text-cyan-400" />
          Targeted Prospecting Keywords:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {suggestedKeywords.map((kw, i) => (
            <button
              key={i}
              onClick={() => {
                setSearchTerm(kw);
              }}
              className="rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1 text-[11px] text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search communities by name, topic, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-20 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-cyan-400 hover:bg-slate-700"
          >
            Search
          </button>
        </form>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="Streaming Infrastructure">Streaming Infrastructure</option>
          <option value="App Development">App Development</option>
          <option value="Resellers & Panels">Resellers & Panels</option>
          <option value="General">General</option>
        </select>

        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Fit Tiers</option>
          <option value="Excellent fit">Excellent Fit (≥80 pts)</option>
          <option value="Good fit">Good Fit (65-79 pts)</option>
          <option value="Possible fit">Possible Fit (50-64 pts)</option>
          <option value="Needs review">Needs Review (&lt;50 pts)</option>
        </select>
      </div>

      {/* Discovery Sources Strip */}
      <div className="flex items-center gap-3 overflow-x-auto text-xs text-slate-400 pb-1">
        <span className="font-semibold text-slate-300 shrink-0">Configured Sources:</span>
        {sources.map((src) => (
          <span
            key={src.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-0.5 text-[11px] text-slate-300 shrink-0"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            {src.name}
          </span>
        ))}
      </div>

      {/* Discovered Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-cyan-400" />
            <p className="mt-2 text-xs">Querying discovered community records...</p>
          </div>
        ) : communities.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-xl border border-dashed border-slate-800 p-8">
            <Compass className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-2 text-sm font-semibold text-slate-300">No communities matching filter criteria</p>
            <p className="mt-1 text-xs text-slate-500">Submit a new Discord server invitation or broaden your search keywords.</p>
          </div>
        ) : (
          communities.map((comm) => {
            const isExcellent = comm.fit_tier === 'Excellent fit';
            const isGood = comm.fit_tier === 'Good fit';
            return (
              <div
                key={comm.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-all shadow-md relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {comm.name}
                      </h3>
                      <p className="text-[11px] text-cyan-400 font-mono mt-0.5">{comm.category}</p>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-white border border-slate-700">
                        {comm.suitability_score}
                        <span className="text-[9px] text-slate-400 font-normal">/100</span>
                      </div>
                      <span
                        className={`block text-[10px] font-semibold mt-1 ${
                          isExcellent ? 'text-emerald-400' : isGood ? 'text-cyan-400' : 'text-amber-400'
                        }`}
                      >
                        {comm.fit_tier}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {comm.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-slate-500" />
                      {comm.member_count.toLocaleString()} members
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                      {comm.review_status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/servers?id=${comm.id}`}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-800/60 py-1.5 text-center text-xs font-medium text-slate-200 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
                    >
                      Inspect Server
                    </Link>
                    <a
                      href={comm.invite_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-800/30 p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      title="Open Official Discord Invite Flow"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Invite Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0c1220] p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-cyan-400" />
                Submit Discord Server Invitation
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Discord Server Invite Link or Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://discord.gg/streamingdevs or code"
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  System verifies format and normalizes invite code to prevent duplicate submissions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary Category
                </label>
                <select
                  value={inviteCategory}
                  onChange={(e) => setInviteCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Streaming Infrastructure">Streaming Infrastructure</option>
                  <option value="App Development">App Development</option>
                  <option value="Resellers & Panels">Resellers & Panels</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Operator Notes or Verification Context
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Android TV player discussion forum with 2k developers..."
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {submitError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle size={15} />
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle size={15} />
                  {submitSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-md hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50"
                >
                  {submitting ? 'Evaluating & Saving...' : 'Submit & Score Community'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
