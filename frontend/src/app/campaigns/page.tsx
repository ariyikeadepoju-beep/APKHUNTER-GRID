'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Layers,
  Calendar
} from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [service, setService] = useState('App Rebranding');
  const [maxPosts, setMaxPosts] = useState(5);
  const [creating, setCreating] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/campaigns/');
      if (res.ok) setCampaigns(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/v1/campaigns/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          target_service: service,
          max_approved_posts: maxPosts,
          target_community_ids: [1, 2]
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        fetchCampaigns();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (campId: number, newStatus: string) => {
    try {
      await fetch(`/api/v1/campaigns/${campId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchCampaigns();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone size={22} className="text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Campaign Manager</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Organize authorized promotional initiatives across verified communities with rate limit pacing and post quotas.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-400"
        >
          <Plus size={15} />
          Create Campaign
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-cyan-400" />
            <p className="mt-2 text-xs">Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-slate-800 p-8">
            <Megaphone className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-2 text-sm font-semibold text-slate-300">No campaigns launched yet</p>
            <p className="mt-1 text-xs text-slate-500">Create a campaign to organize outbound drafts to authorized destinations.</p>
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-cyan-400 font-bold">
                    {camp.target_service}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      camp.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : camp.status === 'Completed'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {camp.status}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-white">{camp.name}</h3>

                <div className="mt-4 space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Target Quota:</span>
                    <strong className="text-white">{camp.max_approved_posts} max posts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Posts Dispatched:</span>
                    <strong className="text-cyan-400">{camp.posts_sent_count} published</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href="/outreach"
                  className="text-xs font-semibold text-cyan-400 hover:underline"
                >
                  Generate Drafts →
                </Link>

                <div className="flex gap-1.5">
                  {camp.status === 'Active' ? (
                    <button
                      onClick={() => handleStatusChange(camp.id, 'Paused')}
                      className="rounded bg-slate-800 p-1.5 text-slate-300 hover:text-white"
                      title="Pause Campaign"
                    >
                      <Pause size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(camp.id, 'Active')}
                      className="rounded bg-slate-800 p-1.5 text-cyan-400 hover:text-cyan-300"
                      title="Activate Campaign"
                    >
                      <Play size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0c1220] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Create Outreach Campaign</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Campaign Name *</label>
                <input
                  required
                  placeholder="e.g. Q4 Android TV Rebranding Push"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Service</label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                >
                  <option value="App Rebranding">App Rebranding</option>
                  <option value="Reseller Panels">Reseller Panels</option>
                  <option value="Restream Services">Restream Services</option>
                  <option value="Custom App Development">Custom App Development</option>
                  <option value="IPTV Subscriptions">IPTV Subscriptions</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Maximum Approved Posts</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={maxPosts}
                  onChange={(e) => setMaxPosts(parseInt(e.target.value) || 5)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-slate-800 px-3 py-1.5 text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 font-bold text-white shadow"
                >
                  {creating ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
