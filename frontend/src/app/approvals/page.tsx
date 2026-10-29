'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Eye,
  Bot
} from 'lucide-react';

export default function ApprovalsPage() {
  const [pendingDrafts, setPendingDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState<Record<number, string>>({});
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/approvals/pending');
      if (res.ok) {
        setPendingDrafts(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleDecision = async (draftId: number, decision: 'approve' | 'reject') => {
    const comments = commentInput[draftId] || '';
    setActionStatus(null);
    try {
      const res = await fetch(`/api/v1/approvals/${draftId}/${decision}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: decision === 'approve' ? 'Approved' : 'Rejected', comments })
      });
      if (res.ok) {
        setActionStatus(`Draft #${draftId} successfully ${decision === 'approve' ? 'APPROVED' : 'REJECTED'} by operator.`);
        fetchApprovals();
      } else {
        const errJson = await res.json();
        setActionStatus(`Error: ${errJson.detail}`);
      }
    } catch (err: any) {
      setActionStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare size={22} className="text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Approvals & Moderation Queue</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Mandatory human-in-the-loop audit before any outbound promotional post can be published.
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-300"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh Queue
        </button>
      </div>

      {actionStatus && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-xs text-cyan-300 flex items-center justify-between">
          <span>{actionStatus}</span>
          <button onClick={() => setActionStatus(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Checklist Banner */}
      <div className="rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-900/20 to-slate-900/50 p-4 text-xs text-slate-300">
        <h3 className="font-bold text-cyan-300 flex items-center gap-2 mb-1.5">
          <ShieldCheck size={16} />
          Operator Verification Checklist Prior to Approval:
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-400">
          <li className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            Bot is officially authorized in guild
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            Channel is explicitly promotional-approved
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            Server rules permit service introduction
          </li>
        </ul>
      </div>

      {/* Pending Items */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-cyan-400" />
          <p className="mt-2 text-xs">Loading pending approval queue...</p>
        </div>
      ) : pendingDrafts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-emerald-400/80" />
          <p className="mt-2 text-sm font-semibold text-slate-200">No Pending Approvals</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            All outbound message drafts have been reviewed or are in draft editing. Go to the Outreach Studio to prepare new drafts.
          </p>
          <Link
            href="/outreach"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow"
          >
            Go to Outreach Studio →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingDrafts.map((draft) => (
            <div
              key={draft.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                    PENDING OPERATOR AUDIT
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    {draft.subject || `Message Draft #${draft.id}`}
                  </h3>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <span>Target Channel: </span>
                  <strong className="text-cyan-300">#{draft.target_channel_id || 'Not Designated'}</strong>
                </div>
              </div>

              {/* Message Content Preview Box */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 font-sans text-xs text-slate-200 whitespace-pre-line leading-relaxed shadow-inner">
                {draft.content}
              </div>

              {/* Decision Section */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <input
                  type="text"
                  placeholder="Audit verification comment or reason..."
                  value={commentInput[draft.id] || ''}
                  onChange={(e) => setCommentInput({ ...commentInput, [draft.id]: e.target.value })}
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDecision(draft.id, 'reject')}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                  >
                    <XCircle size={14} />
                    Reject Draft
                  </button>
                  <button
                    onClick={() => handleDecision(draft.id, 'approve')}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-400"
                  >
                    <CheckCircle size={14} />
                    Approve Draft
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
