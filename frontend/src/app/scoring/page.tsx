'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Sliders,
  CheckCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

export default function ScoringPage() {
  const [weights, setWeights] = useState({
    expressed_need_max: 30.0,
    business_activity_max: 20.0,
    service_match_max: 20.0,
    signal_recency_max: 15.0,
    permission_max: 15.0
  });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Interactive Simulator State
  const [simNeed, setSimNeed] = useState('explicit');
  const [simBiz, setSimBiz] = useState('full');
  const [simMatch, setSimMatch] = useState('direct');
  const [simRecency, setSimRecency] = useState('multi');
  const [simPerm, setSimPerm] = useState('explicit');

  const fetchWeights = async () => {
    try {
      const res = await fetch('/api/v1/lead-scoring/weights');
      if (res.ok) setWeights(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWeights();
  }, []);

  const handleSaveWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/v1/lead-scoring/weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weights)
      });
      if (res.ok) {
        setSaveStatus('Scoring weights saved and logged to audit trail.');
      } else {
        setSaveStatus('Error saving weights.');
      }
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Compute simulated score live
  const calculateSimulatedScore = () => {
    let need = simNeed === 'explicit' ? weights.expressed_need_max : simNeed === 'project' ? weights.expressed_need_max * 0.7 : 0;
    let biz = simBiz === 'full' ? weights.business_activity_max : simBiz === 'partial' ? weights.business_activity_max * 0.6 : 0;
    let match = simMatch === 'direct' ? weights.service_match_max : simMatch === 'secondary' ? weights.service_match_max * 0.5 : 0;
    let rec = simRecency === 'multi' ? weights.signal_recency_max : simRecency === 'single' ? weights.signal_recency_max * 0.65 : 0;
    let perm = simPerm === 'explicit' ? weights.permission_max : simPerm === 'public' ? weights.permission_max * 0.65 : 0;

    return {
      total: Math.round(need + biz + match + rec + perm),
      breakdown: { need, biz, match, rec, perm }
    };
  };

  const simResult = calculateSimulatedScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Target size={22} className="text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Lead Scoring Engine</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Configure transparent 0–100 evidence weighting criteria and simulate lead scoring models.
          </p>
        </div>
      </div>

      {saveStatus && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-xs text-cyan-300">
          {saveStatus}
        </div>
      )}

      {/* Grid: Weights Config & Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurable Weights Form */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders size={16} className="text-cyan-400" />
            Configurable Criteria Weights (Sum: 100 Max)
          </h2>

          <form onSubmit={handleSaveWeights} className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1">
                <span>1. Expressed Need for Service</span>
                <span className="text-cyan-400">{weights.expressed_need_max} pts max</span>
              </div>
              <input
                type="number"
                min="0"
                max="50"
                value={weights.expressed_need_max}
                onChange={(e) => setWeights({ ...weights, expressed_need_max: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
              />
              <p className="mt-1 text-[11px] text-slate-500">Explicit RFPs, buyer inquiries, or documented customization requests.</p>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1">
                <span>2. Relevant Business Activity</span>
                <span className="text-cyan-400">{weights.business_activity_max} pts max</span>
              </div>
              <input
                type="number"
                min="0"
                max="40"
                value={weights.business_activity_max}
                onChange={(e) => setWeights({ ...weights, business_activity_max: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
              />
              <p className="mt-1 text-[11px] text-slate-500">Documented commercial brand, registered business, or active portfolio.</p>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1">
                <span>3. Match with Offered Services</span>
                <span className="text-cyan-400">{weights.service_match_max} pts max</span>
              </div>
              <input
                type="number"
                min="0"
                max="40"
                value={weights.service_match_max}
                onChange={(e) => setWeights({ ...weights, service_match_max: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
              />
              <p className="mt-1 text-[11px] text-slate-500">Direct alignment with IPTV, Resellers, Restreams, Rebranding, or App Dev.</p>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1">
                <span>4. Recent Public Business Signal</span>
                <span className="text-cyan-400">{weights.signal_recency_max} pts max</span>
              </div>
              <input
                type="number"
                min="0"
                max="30"
                value={weights.signal_recency_max}
                onChange={(e) => setWeights({ ...weights, signal_recency_max: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
              />
              <p className="mt-1 text-[11px] text-slate-500">Signal activity corroboration within recent 30–90 day evaluation window.</p>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1">
                <span>5. Verified Permission / Outreach Basis</span>
                <span className="text-cyan-400">{weights.permission_max} pts max</span>
              </div>
              <input
                type="number"
                min="0"
                max="30"
                value={weights.permission_max}
                onChange={(e) => setWeights({ ...weights, permission_max: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
              />
              <p className="mt-1 text-[11px] text-slate-500">Explicit inquiry consent or authorized public commercial exchange.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 font-bold text-white shadow hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50"
              >
                {saving ? 'Updating Scoring Engine...' : 'Save & Apply Scoring Weights'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Simulator */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-400" />
              Interactive Lead Score Simulator
            </h2>
            <div className="text-right">
              <span className="text-3xl font-black text-cyan-400">{simResult.total}</span>
              <span className="text-xs text-slate-500 block font-normal">/ 100 Score</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Expressed Need Signal:</label>
              <select
                value={simNeed}
                onChange={(e) => setSimNeed(e.target.value)}
                className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-white"
              >
                <option value="explicit">Explicit Direct Service Inquiry (100% need pts)</option>
                <option value="project">Documented Public Project Need (70% need pts)</option>
                <option value="none">No Documented Need (0 pts)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Business Footprint:</label>
              <select
                value={simBiz}
                onChange={(e) => setSimBiz(e.target.value)}
                className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-white"
              >
                <option value="full">Verified Brand Name + Public Portfolio URL (100% biz pts)</option>
                <option value="partial">Partial Business Footprint (60% biz pts)</option>
                <option value="none">No Verifiable Business Signal (0 pts)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Service Match Alignment:</label>
              <select
                value={simMatch}
                onChange={(e) => setSimMatch(e.target.value)}
                className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-white"
              >
                <option value="direct">Direct Match to 1 of 5 Core Services (100% match pts)</option>
                <option value="secondary">Peripheral Media Interest (50% match pts)</option>
                <option value="none">Unrelated Requirement (0 pts)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Signal Corroboration & Recency:</label>
              <select
                value={simRecency}
                onChange={(e) => setSimRecency(e.target.value)}
                className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-white"
              >
                <option value="multi">Multiple Corroborating Signals (100% recency pts)</option>
                <option value="single">Single Recent Signal (65% recency pts)</option>
                <option value="none">Stale or Uncorroborated (0 pts)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Outreach Permission Status:</label>
              <select
                value={simPerm}
                onChange={(e) => setSimPerm(e.target.value)}
                className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-white"
              >
                <option value="explicit">Initiated Contact / Explicit Permission (100% perm pts)</option>
                <option value="public">Public Commercial Channel Post (65% perm pts)</option>
                <option value="none">Strict Safeguard Active (0 pts)</option>
              </select>
            </div>

            {/* Strict Safeguard Reminder */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-slate-300 text-[11px] flex items-start gap-2">
              <ShieldAlert size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>System Rule:</strong> High score does not override missing permission. Leads without explicit permission remain ineligible for automated contact.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
