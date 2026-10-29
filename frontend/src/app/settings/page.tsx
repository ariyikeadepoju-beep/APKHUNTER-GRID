'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Bot,
  Key,
  Database,
  Activity,
  CheckCircle,
  ExternalLink,
  Lock,
  RefreshCw,
  Terminal
} from 'lucide-react';

export default function SettingsPage() {
  const [settingsData, setSettingsData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [botToken, setBotToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchSettingsAndAudit = async () => {
    try {
      const [stRes, adRes] = await Promise.all([
        fetch('/api/v1/settings/'),
        fetch('/api/v1/audit-logs/?limit=25')
      ]);

      if (stRes.ok) {
        const data = await stRes.json();
        setSettingsData(data);
        setClientId(data.discord?.client_id || '');
      }
      if (adRes.ok) {
        setAuditLogs(await adRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettingsAndAudit();
  }, []);

  const handleSaveDiscord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/v1/settings/discord-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, bot_token: botToken })
      });
      if (res.ok) {
        setStatusMsg('Discord configuration saved and token encrypted securely.');
        setBotToken('');
        fetchSettingsAndAudit();
      } else {
        setStatusMsg('Error updating configuration.');
      }
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Settings size={22} className="text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Platform Settings & Security</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Workspace configuration, Discord Developer credentials, compliance audit trail, and database telemetry.
          </p>
        </div>

        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-300"
        >
          <Terminal size={14} className="text-cyan-400" />
          Interactive OpenAPI Docs
          <ExternalLink size={12} />
        </a>
      </div>

      {statusMsg && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-300">
          {statusMsg}
        </div>
      )}

      {/* Grid: Credentials & Setup Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credentials Form */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Bot size={16} className="text-cyan-400" />
            Official Discord Bot Credentials
          </h2>

          <form onSubmit={handleSaveDiscord} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Application Client ID</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g. 1344685002930262100"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Bot Token</label>
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder={settingsData?.discord?.bot_token_configured ? '•••••••••••• (Configured — enter new token to update)' : 'Paste Discord bot token...'}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white font-mono"
              />
              <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <Lock size={11} className="text-emerald-400" />
                Tokens are encrypted in the database and never shown in plain text.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3 text-[11px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Token Status:</span>
                <span className="font-semibold text-white">
                  {settingsData?.discord?.bot_token_configured ? 'Active (Masked: ' + settingsData.discord.bot_token_masked + ')' : 'Not Configured'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Database Engine:</span>
                <span className="font-semibold text-cyan-400">{settingsData?.workspace?.database_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data Retention:</span>
                <span className="font-semibold text-slate-200">{settingsData?.data_retention_days} Days</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 font-bold text-white shadow hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50"
            >
              {saving ? 'Encrypting & Saving...' : 'Save Discord Configuration'}
            </button>
          </form>
        </div>

        {/* Discord Portal Setup Guide */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Key size={16} className="text-cyan-400" />
            Discord Developer Portal Setup Guide
          </h2>

          <div className="space-y-2.5 text-xs text-slate-300">
            {settingsData?.setup_guide &&
              Object.entries(settingsData.setup_guide).map(([stepKey, stepText]: [string, any], idx) => (
                <div key={stepKey} className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-900/80 p-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-400">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{stepText}</p>
                </div>
              ))}
          </div>

          <a
            href="https://discord.com/developers/applications"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 py-2 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:border-cyan-500 transition-colors"
          >
            Open Discord Developer Portal <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Immutable Audit Logs Viewer */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Activity size={16} className="text-cyan-400" />
          Security & Operational Audit Log
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-semibold uppercase text-slate-400 font-mono">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Resource</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-cyan-400 font-bold whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                    {log.resource_type} #{log.resource_id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans text-xs">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
