'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckSquare,
  Bot
} from 'lucide-react';

export default function OutreachPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [selectedLeadId, setSelectedLeadId] = useState<number | ''>('');
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | ''>('');
  const [selectedChannelId, setSelectedChannelId] = useState<number | ''>('');
  
  const [editorSubject, setEditorSubject] = useState('');
  const [editorContent, setEditorContent] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchOutreachData = async () => {
    try {
      const [tplRes, dftRes, ldRes, comRes, gldRes] = await Promise.all([
        fetch('/api/v1/outreach/templates'),
        fetch('/api/v1/outreach/drafts'),
        fetch('/api/v1/leads/'),
        fetch('/api/v1/communities/'),
        fetch('/api/v1/discord/guilds')
      ]);

      if (tplRes.ok) setTemplates(await tplRes.json());
      if (dftRes.ok) setDrafts(await dftRes.json());
      if (ldRes.ok) setLeads(await ldRes.json());
      if (comRes.ok) setCommunities(await comRes.json());
      
      if (gldRes.ok) {
        const guilds = await gldRes.json();
        const allChannels = guilds.flatMap((g: any) => g.channels || []);
        setChannels(allChannels);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOutreachData();
  }, []);

  const handleTemplateSelect = (tplId: number) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;

    const lead = leads.find((l) => l.id === Number(selectedLeadId));
    const comm = communities.find((c) => c.id === Number(selectedCommunityId));
    const ch = channels.find((c) => c.id === Number(selectedChannelId));

    let renderedContent = tpl.body_template;
    let renderedSubject = tpl.subject || '';

    const replacements: Record<string, string> = {
      contact_name: lead?.display_name || 'Partner',
      business_name: lead?.business_name || lead?.display_name || 'your project',
      service_name: lead?.service_interest || 'our streaming services',
      community_name: comm?.name || 'your community',
      channel_name: ch?.name || 'promotions',
      admin_name: 'Server Admin',
      custom_evidence: lead?.evidences?.[0]?.description || 'your streaming requirements'
    };

    for (const [k, v] of Object.entries(replacements)) {
      renderedContent = renderedContent.replaceAll(`{${k}}`, v);
      renderedSubject = renderedSubject.replaceAll(`{${k}}`, v);
    }

    setEditorSubject(renderedSubject);
    setEditorContent(renderedContent);
  };

  const handleGenerateAndSave = async (submitForReview: boolean = false) => {
    setGenerating(true);
    setNotification(null);
    try {
      const res = await fetch('/api/v1/outreach/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLeadId || null,
          community_id: selectedCommunityId || null,
          target_channel_id: selectedChannelId || null,
          template_id: selectedTemplateId || null,
          subject: editorSubject,
          content: editorContent
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to save draft');
      }

      const draft = await res.json();

      if (submitForReview) {
        await fetch(`/api/v1/outreach/drafts/${draft.id}/submit-for-approval`, {
          method: 'POST'
        });
        setNotification(`Draft #${draft.id} successfully queued for human operator approval!`);
      } else {
        setNotification(`Draft #${draft.id} saved successfully!`);
      }

      fetchOutreachData();
    } catch (err: any) {
      setNotification(`Error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Send size={22} className="text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Outreach Message Studio</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Professional personalized proposal drafting, variable context interpolation, and human-in-the-loop approval routing.
          </p>
        </div>

        <Link
          href="/approvals"
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-300"
        >
          <CheckSquare size={14} className="text-cyan-400" />
          Review Approvals Queue →
        </Link>
      </div>

      {notification && (
        <div
          className={`rounded-xl border p-4 text-xs flex items-center justify-between ${
            notification.startsWith('Error')
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context Configuration */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles size={16} className="text-cyan-400" />
            1. Select Target & Template
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Outreach Template (9 Scenarios)
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateSelect(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">-- Choose Template --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Target Lead Prospect (Optional)
            </label>
            <select
              value={selectedLeadId}
              onChange={(e) => {
                setSelectedLeadId(e.target.value ? Number(e.target.value) : '');
                if (selectedTemplateId) handleTemplateSelect(Number(selectedTemplateId));
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">-- No specific lead (General) --</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.display_name} ({l.service_interest} - {l.lead_score} pts)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Target Community
            </label>
            <select
              value={selectedCommunityId}
              onChange={(e) => {
                setSelectedCommunityId(e.target.value ? Number(e.target.value) : '');
                if (selectedTemplateId) handleTemplateSelect(Number(selectedTemplateId));
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">-- Choose community --</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.fit_tier})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Approved Destination Channel
            </label>
            <select
              value={selectedChannelId}
              onChange={(e) => {
                setSelectedChannelId(e.target.value ? Number(e.target.value) : '');
                if (selectedTemplateId) handleTemplateSelect(Number(selectedTemplateId));
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">-- Choose Discord Channel --</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  #{ch.name} {ch.is_promotional_approved ? '✓ Approved' : '✗ Locked'}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Posting is strictly blocked unless the destination channel is marked as approved.
            </p>
          </div>

          {/* Compliance Card */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
              <ShieldCheck size={14} />
              Human Approval Required
            </div>
            <p className="text-[11px]">
              Every draft enters &quot;Draft&quot; or &quot;Pending Review&quot; status. The bot will refuse dispatch until a signed approval record is logged in the database.
            </p>
          </div>
        </div>

        {/* Right 2 Columns: Draft Editor & Preview */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText size={16} className="text-cyan-400" />
              2. Review & Personalize Content
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Subject Line / Topic Header
              </label>
              <input
                type="text"
                value={editorSubject}
                onChange={(e) => setEditorSubject(e.target.value)}
                placeholder="Subject line..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Message Body
              </label>
              <textarea
                rows={11}
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder="Select a template or write personalized outreach draft..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-white font-sans leading-relaxed focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <div className="text-[11px] text-slate-500">
              Character Count: <strong className="text-slate-300">{editorContent.length}</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleGenerateAndSave(false)}
                disabled={generating || !editorContent}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleGenerateAndSave(true)}
                disabled={generating || !editorContent}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50"
              >
                <CheckSquare size={14} />
                {generating ? 'Submitting...' : 'Submit for Human Approval'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Drafts Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Eye size={16} className="text-cyan-400" />
          Recent Drafts & Approval Status
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-semibold uppercase text-slate-400 font-mono">
              <tr>
                <th className="py-2.5 px-3">Draft ID</th>
                <th className="py-2.5 px-3">Subject / Lead</th>
                <th className="py-2.5 px-3">Target Channel</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Duplicate Check</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {drafts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No message drafts recorded yet.
                  </td>
                </tr>
              ) : (
                drafts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono text-cyan-400">#{d.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{d.subject || 'No subject'}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-sm">{d.content}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      Channel #{d.target_channel_id || 'Not Set'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          d.approval_status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : d.approval_status === 'Delivered'
                            ? 'bg-blue-500/20 text-cyan-300 border border-cyan-500/40'
                            : d.approval_status === 'Rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {d.approval_status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {d.is_duplicate_check_passed ? (
                        <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                          <CheckCircle size={12} /> Clear (No recent post)
                        </span>
                      ) : (
                        <span className="text-amber-400 text-[11px] flex items-center gap-1">
                          <AlertTriangle size={12} /> Duplicate Risk
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {d.approval_status === 'Draft' && (
                        <button
                          onClick={async () => {
                            await fetch(`/api/v1/outreach/drafts/${d.id}/submit-for-approval`, { method: 'POST' });
                            fetchOutreachData();
                          }}
                          className="rounded bg-cyan-600/30 border border-cyan-500/40 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-600/50"
                        >
                          Submit Review
                        </button>
                      )}
                      {d.approval_status === 'Approved' && (
                        <Link
                          href="/discord"
                          className="rounded bg-emerald-600/30 border border-emerald-500/40 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-600/50"
                        >
                          Dispatch in Discord →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
