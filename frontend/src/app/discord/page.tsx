'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Send,
  RefreshCw,
  Server,
  Hash,
  Terminal,
  Lock,
  Unlock,
  Radio
} from 'lucide-react';

export default function DiscordPage() {
  const [botStatus, setBotStatus] = useState<any>(null);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<any | null>(null);
  const [approvedDrafts, setApprovedDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Test Message State
  const [testChannelId, setTestChannelId] = useState('123456789012345679');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  // Dispatch Draft State
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);

  const fetchDiscordData = async () => {
    try {
      setLoading(true);
      const [botRes, gldRes, dftRes] = await Promise.all([
        fetch('/api/v1/discord/bot-status'),
        fetch('/api/v1/discord/guilds'),
        fetch('/api/v1/outreach/drafts?status=Approved')
      ]);

      if (botRes.ok) setBotStatus(await botRes.json());
      if (gldRes.ok) {
        const glds = await gldRes.json();
        setGuilds(glds);
        if (glds.length > 0 && !selectedGuild) {
          setSelectedGuild(glds[0]);
        }
      }
      if (dftRes.ok) setApprovedDrafts(await dftRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscordData();
  }, []);

  const handleToggleGuildAuth = async (guildId: number, currentAuth: boolean) => {
    try {
      const res = await fetch(`/api/v1/discord/guilds/${guildId}/authorize`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_authorized: !currentAuth })
      });
      if (res.ok) fetchDiscordData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleChannelPromo = async (channelId: number, currentApproved: boolean) => {
    try {
      const res = await fetch(`/api/v1/discord/channels/${channelId}/approve-promotional`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_promotional_approved: !currentApproved })
      });
      if (res.ok) fetchDiscordData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/v1/discord/test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: testChannelId })
      });
      const json = await res.json();
      setTestResult(json);
    } catch (err: any) {
      setTestResult({ status: 'error', message: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  const handlePublishDraft = async (draftId: number) => {
    setDispatching(true);
    setDispatchStatus(null);
    try {
      const res = await fetch(`/api/v1/discord/publish-draft/${draftId}`, {
        method: 'POST'
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || 'Dispatch failed');
      setDispatchStatus(`Successfully published draft #${draftId} to destination channel! Delivery Status: ${json.delivery_status}`);
      fetchDiscordData();
    } catch (err: any) {
      setDispatchStatus(`Error: ${err.message}`);
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Bot size={22} className="text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Official Discord Bot Integration</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Official Developer Gateway socket connection, permission diagnostics, and authorized-channel promotional dispatcher.
          </p>
        </div>

        <button
          onClick={fetchDiscordData}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-300"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Sync Bot Status
        </button>
      </div>

      {dispatchStatus && (
        <div
          className={`rounded-xl border p-4 text-xs flex items-center justify-between ${
            dispatchStatus.startsWith('Error')
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          <span>{dispatchStatus}</span>
          <button onClick={() => setDispatchStatus(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Bot Identity & Gateway Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400">Bot Service Status</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-lg font-bold text-white capitalize">{botStatus?.bot_status || 'Online'}</span>
          </div>
          <p className="mt-1 text-[11px] text-cyan-400 font-mono">{botStatus?.bot_username || 'APK Hunter Bot'}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400">Client ID / App Identity</p>
          <p className="mt-2 text-sm font-bold text-white font-mono truncate">{botStatus?.client_id || 'Configured'}</p>
          <span className="mt-1 block text-[11px] text-slate-500">Official Discord Application</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400">Authorized Guilds</p>
          <p className="mt-2 text-xl font-black text-white">{botStatus?.authorized_guild_count ?? 0}</p>
          <span className="mt-1 block text-[11px] text-slate-500">{botStatus?.total_guild_count ?? 0} total joined</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400">Promotional Channels Approved</p>
          <p className="mt-2 text-xl font-black text-cyan-400">{botStatus?.approved_channel_count ?? 0}</p>
          <span className="mt-1 block text-[11px] text-slate-500">Outreach permitted destinations</span>
        </div>
      </div>

      {/* Invite Flow & Staging Setup */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-blue-900/20 via-slate-900/60 to-slate-900/40 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio size={16} className="text-cyan-400" />
            Official Bot OAuth2 Installation Flow
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Invite the bot to your private test server using Discord&apos;s official OAuth2 authorization. The bot requests only least-privilege permissions: Send Messages, View Channel, and Embed Links (Permission code: 542128).
          </p>
        </div>

        {botStatus?.invite_url && (
          <a
            href={botStatus.invite_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-400 transition-all shrink-0"
          >
            <Bot size={15} />
            Authorize Bot to Guild
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Guilds & Channels Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guilds List */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server size={16} className="text-cyan-400" />
            Connected Guilds ({guilds.length})
          </h2>

          <div className="space-y-2">
            {guilds.map((g) => {
              const isSelected = selectedGuild?.id === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGuild(g)}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    isSelected
                      ? 'border-cyan-500/50 bg-slate-800/80 shadow-sm'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white">{g.name}</h3>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        g.is_authorized
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {g.is_authorized ? 'Authorized' : 'Pending Auth'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{g.member_count} members</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleGuildAuth(g.id, g.is_authorized);
                      }}
                      className="text-cyan-400 hover:underline font-semibold"
                    >
                      {g.is_authorized ? 'De-authorize' : 'Authorize Guild'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Guild Channels */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Hash size={16} className="text-cyan-400" />
                Channel Permissions: {selectedGuild?.name || 'Select a guild'}
              </h2>
              <p className="text-xs text-slate-400">
                Outbound promotional posts can only be dispatched to channels explicitly toggled &quot;Approved&quot;.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] uppercase text-slate-400 font-mono">
                <tr>
                  <th className="py-2 px-3">Channel Name</th>
                  <th className="py-2 px-3">Permissions</th>
                  <th className="py-2 px-3">Promotional Status</th>
                  <th className="py-2 px-3 text-right">Safeguard Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {selectedGuild?.channels?.map((ch: any) => (
                  <tr key={ch.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Hash size={13} className="text-slate-500" />
                        {ch.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{ch.channel_id}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex gap-1 text-[10px]">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-400">Send ✓</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-400">Embed ✓</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {ch.is_promotional_approved ? (
                        <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold">
                          ✓ PROMOTIONS APPROVED
                        </span>
                      ) : (
                        <span className="rounded bg-slate-800 text-slate-400 px-2 py-0.5 text-[10px]">
                          LOCKED (Non-commercial)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleChannelPromo(ch.id, ch.is_promotional_approved)}
                        className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all ${
                          ch.is_promotional_approved
                            ? 'border border-rose-500/40 text-rose-300 hover:bg-rose-500/20'
                            : 'border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                        }`}
                      >
                        {ch.is_promotional_approved ? 'Revoke Approval' : 'Approve for Outreach'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dispatch Approved Drafts Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Send size={16} className="text-cyan-400" />
          Publish Approved Messages ({approvedDrafts.length} ready)
        </h2>

        {approvedDrafts.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No approved drafts ready for publishing. Review drafts in the <Link href="/approvals" className="text-cyan-400 underline">Approvals Queue</Link>.
          </p>
        ) : (
          <div className="space-y-3">
            {approvedDrafts.map((d) => (
              <div
                key={d.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/80 p-3.5 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Draft #{d.id}: {d.subject || 'Outreach Post'}</span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300 font-bold">
                      Operator Signed ✓
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">{d.content}</p>
                </div>

                <button
                  onClick={() => handlePublishDraft(d.id)}
                  disabled={dispatching}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-3.5 py-2 text-xs font-semibold text-white shadow hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 shrink-0"
                >
                  <Send size={13} />
                  {dispatching ? 'Verifying Safeguards...' : 'Publish to Authorized Channel'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Diagnostic Dispatch Tool */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Terminal size={16} className="text-cyan-400" />
          Test Diagnostic Dispatch Tool
        </h2>

        <form onSubmit={handleSendTestMessage} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="Target Channel ID for diagnostic test..."
            value={testChannelId}
            onChange={(e) => setTestChannelId(e.target.value)}
            className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sendingTest}
            className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-slate-700 disabled:opacity-50"
          >
            {sendingTest ? 'Sending Diagnostic...' : 'Dispatch Test Ping'}
          </button>
        </form>

        {testResult && (
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 font-mono">
            <span className="text-cyan-400 font-bold block mb-1">Diagnostic Output:</span>
            <pre className="whitespace-pre-wrap">{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
