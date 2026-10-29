'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Server,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  ExternalLink,
  Users,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react';

export default function ServersPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<any | null>(null);

  // Policy Edit State
  const [editPolicy, setEditPolicy] = useState('Permitted');
  const [editSummary, setEditSummary] = useState('');
  const [editProof, setEditProof] = useState('');
  const [adminGranted, setAdminGranted] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyMessage, setPolicyMessage] = useState<string | null>(null);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/communities/');
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
        if (data.length > 0 && !selectedCommunity) {
          setSelectedCommunity(data[0]);
          loadCommunityForm(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityForm = (comm: any) => {
    if (comm.rules) {
      setEditPolicy(comm.rules.advertising_policy || 'Not Yet Reviewed');
      setEditSummary(comm.rules.rule_summary || '');
      setEditProof(comm.rules.admin_permission_proof || '');
      setAdminGranted(comm.rules.admin_permission_granted || false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommunity) return;
    setSavingPolicy(true);
    setPolicyMessage(null);
    try {
      const res = await fetch(`/api/v1/communities/${selectedCommunity.id}/rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertising_policy: editPolicy,
          rule_summary: editSummary,
          admin_permission_granted: adminGranted,
          admin_permission_proof: editProof
        })
      });
      if (res.ok) {
        setPolicyMessage('Moderation rules and advertising policy updated successfully.');
        fetchCommunities();
      }
    } catch (err: any) {
      setPolicyMessage(`Error: ${err.message}`);
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Server size={22} className="text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Server Intelligence & Moderation Rules</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Inspect community server policies, track advertising allowances, and record administrator permission proofs.
          </p>
        </div>

        <Link
          href="/discovery"
          className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-300"
        >
          Discover New Servers →
        </Link>
      </div>

      {policyMessage && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-300">
          {policyMessage}
        </div>
      )}

      {/* Grid: Server List & Server Detail / Rules Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Community Select List */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            Communities ({communities.length})
          </h2>

          <div className="space-y-2">
            {communities.map((c) => {
              const isSelected = selectedCommunity?.id === c.id;
              const policy = c.rules?.advertising_policy || 'Not Yet Reviewed';
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCommunity(c);
                    loadCommunityForm(c);
                  }}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    isSelected
                      ? 'border-cyan-500/50 bg-slate-800/80 shadow-sm'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white">{c.name}</h3>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">{c.suitability_score}/100</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{c.member_count.toLocaleString()} members</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                        policy === 'Permitted'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : policy === 'Strictly Prohibited'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {policy}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Server Intelligence Detail & Rules Editor */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-5">
          {selectedCommunity ? (
            <>
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{selectedCommunity.name}</h2>
                    <a
                      href={selectedCommunity.invite_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 hover:text-cyan-400"
                      title="Open Official Discord Invite Flow"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedCommunity.description}</p>
                </div>

                <div className="text-right">
                  <span className="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs font-extrabold text-cyan-400">
                    {selectedCommunity.suitability_score} / 100
                  </span>
                  <span className="block text-[11px] text-emerald-400 font-semibold mt-1">
                    {selectedCommunity.fit_tier}
                  </span>
                </div>
              </div>

              {/* Server Stats Strip */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Members</span>
                  <span className="font-bold text-white text-sm">{selectedCommunity.member_count.toLocaleString()}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Review Status</span>
                  <span className="font-bold text-cyan-300 text-sm">{selectedCommunity.review_status}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Category</span>
                  <span className="font-bold text-white text-sm truncate block">{selectedCommunity.category}</span>
                </div>
              </div>

              {/* Rules and Advertising Moderation Form */}
              <form onSubmit={handleSaveRules} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <Shield size={14} className="text-cyan-400" />
                  Advertising Policy & Rules Audit
                </h3>

                <div>
                  <label className="block text-slate-400 mb-1">Advertising Policy</label>
                  <select
                    value={editPolicy}
                    onChange={(e) => setEditPolicy(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-white"
                  >
                    <option value="Permitted">Permitted (Promotional channel exists)</option>
                    <option value="Requires Admin Approval">Requires Admin Approval</option>
                    <option value="Strictly Prohibited">Strictly Prohibited (Commercial ban)</option>
                    <option value="Not Yet Reviewed">Not Yet Reviewed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Rules Channel Summary / Policy Details</label>
                  <textarea
                    rows={2}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    placeholder="e.g. Commercial posts allowed in #developer-marketplace only..."
                    className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="adminGranted"
                    checked={adminGranted}
                    onChange={(e) => setAdminGranted(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <label htmlFor="adminGranted" className="text-slate-300 font-medium cursor-pointer">
                    Explicit Administrator Permission Granted for Service Postings
                  </label>
                </div>

                {adminGranted && (
                  <div>
                    <label className="block text-slate-400 mb-1">Permission Proof / Evidence Link</label>
                    <input
                      type="text"
                      value={editProof}
                      onChange={(e) => setEditProof(e.target.value)}
                      placeholder="Discord message link or screenshot URL..."
                      className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-white"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingPolicy}
                    className="rounded bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 font-bold text-white shadow disabled:opacity-50"
                  >
                    {savingPolicy ? 'Saving Rules...' : 'Save & Enforce Policy'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <p className="text-xs text-slate-500">Select a community from the left list.</p>
          )}
        </div>
      </div>
    </div>
  );
}
