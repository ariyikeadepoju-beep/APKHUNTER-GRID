'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle,
  ExternalLink,
  Target,
  Sparkles,
  Layers,
  ChevronDown,
  RefreshCw,
  FileText,
  AlertTriangle
} from 'lucide-react';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Selected Lead for Detail Modal
  const [activeLead, setActiveLead] = useState<any | null>(null);

  // New Lead Modal State
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBiz, setNewBiz] = useState('');
  const [newSource, setNewSource] = useState('Manual Discovery');
  const [newService, setNewService] = useState('App Rebranding');
  const [newEvidence, setNewEvidence] = useState('');
  const [newContact, setNewContact] = useState('');
  const [creating, setCreating] = useState(false);

  // Add Evidence Modal State
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [evidenceType, setEvidenceType] = useState('Explicit Service Inquiry');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [addingEvidence, setAddingEvidence] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (selectedService) params.append('service', selectedService);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await fetch(`/api/v1/leads/?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLeads(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedService, selectedStatus]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/v1/leads/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: newName,
          business_name: newBiz,
          discovery_source: newSource,
          service_interest: newService,
          contact_url: newContact,
          initial_evidence: newEvidence,
          outreach_eligibility: 'Eligible - Explicit Inquiry',
          status: 'Qualified'
        })
      });
      if (res.ok) {
        setIsNewLeadOpen(false);
        setNewName('');
        setNewBiz('');
        setNewEvidence('');
        setNewContact('');
        fetchLeads();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;
    setAddingEvidence(true);
    try {
      const res = await fetch(`/api/v1/leads/${activeLead.id}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signal_type: evidenceType,
          description: evidenceDesc
        })
      });
      if (res.ok) {
        // Refresh single lead
        const updated = await fetch(`/api/v1/leads/${activeLead.id}`);
        if (updated.ok) {
          const leadData = await updated.json();
          setActiveLead(leadData);
        }
        setIsEvidenceOpen(false);
        setEvidenceDesc('');
        fetchLeads();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingEvidence(false);
    }
  };

  const handleStatusChange = async (leadId: int, newStatus: string) => {
    try {
      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchLeads();
        if (activeLead && activeLead.id === leadId) {
          setActiveLead({ ...activeLead, status: newStatus });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Users size={22} className="text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Lead Management CRM</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Permission-first prospecting records with transparent 0–100 evidence scoring and service recommendations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://127.0.0.1:8000/api/v1/analytics/export/leads-csv"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:border-cyan-500 hover:text-cyan-300"
          >
            Export CSV
          </a>
          <button
            onClick={() => setIsNewLeadOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-400 transition-all"
          >
            <Plus size={15} />
            Create Lead
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search leads by name, business, or signals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Services</option>
          <option value="App Rebranding">App Rebranding</option>
          <option value="Reseller Panels">Reseller Panels</option>
          <option value="Restream Services">Restream Services</option>
          <option value="Custom App Development">Custom App Development</option>
          <option value="IPTV Subscriptions">IPTV Subscriptions</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Needs review">Needs Review</option>
          <option value="Qualified">Qualified</option>
          <option value="Contact authorized">Contact Authorized</option>
          <option value="Draft prepared">Draft Prepared</option>
          <option value="Contacted">Contacted</option>
          <option value="Replied">Replied</option>
          <option value="Interested">Interested</option>
          <option value="Converted">Converted</option>
        </select>
      </div>

      {/* CRM Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
              <tr>
                <th className="py-3 px-4">Lead / Business</th>
                <th className="py-3 px-4">Target Service</th>
                <th className="py-3 px-4 text-center">Score (0–100)</th>
                <th className="py-3 px-4">Outreach Eligibility</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Discovery Source</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="mx-auto h-5 w-5 animate-spin text-cyan-400" />
                    <p className="mt-2">Loading lead database records...</p>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No leads found matching query.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const score = lead.lead_score;
                  const isHigh = score >= 80;
                  const isMed = score >= 60;
                  return (
                    <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{lead.display_name}</div>
                        {lead.business_name && (
                          <div className="text-[11px] text-slate-400 font-medium">{lead.business_name}</div>
                        )}
                        {lead.contact_url && (
                          <a
                            href={lead.contact_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:underline mt-0.5"
                          >
                            Portfolio / Profile <ExternalLink size={9} />
                          </a>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300 border border-blue-500/20">
                          {lead.service_interest}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setActiveLead(lead)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shadow-sm ${
                            isHigh
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : isMed
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                          title="Click to view full score breakdown and explanation"
                        >
                          <Target size={12} />
                          {lead.lead_score}
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                            lead.outreach_eligibility.includes('Eligible')
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {lead.outreach_eligibility}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-200 focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="New">New</option>
                          <option value="Needs review">Needs review</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Contact authorized">Contact authorized</option>
                          <option value="Draft prepared">Draft prepared</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Replied">Replied</option>
                          <option value="Interested">Interested</option>
                          <option value="Converted">Converted</option>
                          <option value="Do not contact">Do not contact</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {lead.discovery_source}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setActiveLead(lead)}
                          className="rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700"
                        >
                          Details
                        </button>
                        <Link
                          href={`/outreach?lead_id=${lead.id}`}
                          className="rounded bg-cyan-600/30 border border-cyan-500/40 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-600/50"
                        >
                          Draft
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail & Score Breakdown Modal */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-[#0c1220] p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  Lead Profile #{activeLead.id}
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">{activeLead.display_name}</h2>
                <p className="text-xs text-slate-400">{activeLead.business_name || 'Independent Operator'}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-black text-cyan-400">{activeLead.lead_score}</div>
                  <span className="text-[10px] text-slate-500">Transparent Score</span>
                </div>
                <button
                  onClick={() => setActiveLead(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Score Criteria Breakdown */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                <Target size={14} className="text-cyan-400" />
                Score Criteria Breakdown
              </h3>
              
              {activeLead.score_details ? (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded border border-slate-800 bg-slate-900 p-2">
                      <span className="text-slate-400 block">Expressed Need</span>
                      <span className="font-bold text-white text-sm">+{activeLead.score_details.expressed_need_score}</span> / 30 pts
                    </div>
                    <div className="rounded border border-slate-800 bg-slate-900 p-2">
                      <span className="text-slate-400 block">Business Activity</span>
                      <span className="font-bold text-white text-sm">+{activeLead.score_details.business_activity_score}</span> / 20 pts
                    </div>
                    <div className="rounded border border-slate-800 bg-slate-900 p-2">
                      <span className="text-slate-400 block">Service Match</span>
                      <span className="font-bold text-white text-sm">+{activeLead.score_details.service_match_score}</span> / 20 pts
                    </div>
                    <div className="rounded border border-slate-800 bg-slate-900 p-2">
                      <span className="text-slate-400 block">Signal Recency</span>
                      <span className="font-bold text-white text-sm">+{activeLead.score_details.signal_recency_score}</span> / 15 pts
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3 mt-2">
                    <p className="text-[11px] font-semibold text-cyan-300 mb-1">Generated Auditor Explanation:</p>
                    <p className="text-[11px] text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                      {activeLead.score_details.explanation}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No score breakdown record found.</p>
              )}
            </div>

            {/* Service Recommendations */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                <Layers size={14} className="text-cyan-400" />
                Service Recommendation Rationale
              </h3>
              {activeLead.service_matches?.map((m: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{m.recommended_service}</span>
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-300 font-semibold">
                      {m.match_strength}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{m.evidence_rationale}</p>
                </div>
              ))}
            </div>

            {/* Evidence List & Add Evidence Action */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <FileText size={14} className="text-cyan-400" />
                  Verified Evidence Signals ({activeLead.evidences?.length || 0})
                </h3>
                <button
                  onClick={() => setIsEvidenceOpen(true)}
                  className="rounded bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-cyan-400 hover:bg-slate-700"
                >
                  + Add Signal
                </button>
              </div>

              <div className="space-y-2">
                {activeLead.evidences?.map((ev: any) => (
                  <div key={ev.id} className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-cyan-400">{ev.signal_type}</span>
                      <span className="text-[10px] text-slate-500">Verified</span>
                    </div>
                    <p className="mt-1 text-slate-300 text-[11px]">{ev.description}</p>
                    {ev.source_url && (
                      <a
                        href={ev.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-cyan-400"
                      >
                        Source Link <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-[11px] text-slate-500">
                Outreach eligibility: <strong className="text-slate-300">{activeLead.outreach_eligibility}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveLead(null)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Close
                </button>
                <Link
                  href={`/outreach?lead_id=${activeLead.id}`}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-md hover:from-blue-500 hover:to-cyan-400"
                >
                  Generate Proposal Draft
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Evidence Modal */}
      {isEvidenceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0c1220] p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">Add Verified Evidence Signal</h3>
            <form onSubmit={handleAddEvidence} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Signal Type</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                >
                  <option value="Explicit Service Inquiry">Explicit Service Inquiry</option>
                  <option value="App Customization Request">App Customization Request</option>
                  <option value="Reseller Inquiry">Reseller Inquiry</option>
                  <option value="Public Project Need">Public Project Need</option>
                  <option value="Profile Bio Signal">Profile Bio Signal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Documented Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Founder posted in public forum seeking 500-credit reseller panel..."
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEvidenceOpen(false)}
                  className="rounded border border-slate-800 px-3 py-1.5 text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingEvidence}
                  className="rounded bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 font-bold text-white shadow"
                >
                  {addingEvidence ? 'Saving & Re-scoring...' : 'Save & Re-score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {isNewLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0c1220] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Plus size={18} className="text-cyan-400" />
              Create Business Lead
            </h3>
            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Display Name *</label>
                <input
                  required
                  placeholder="e.g. Apex Stream Founder"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Business Name</label>
                <input
                  placeholder="e.g. Apex Media Networks"
                  value={newBiz}
                  onChange={(e) => setNewBiz(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Service Interest</label>
                <select
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
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
                <label className="block text-slate-400 mb-1">Public Portfolio / Contact URL</label>
                <input
                  placeholder="https://..."
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Initial Discovered Need / Signal</label>
                <textarea
                  rows={2}
                  placeholder="Quote or describe their explicit stated requirement..."
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewLeadOpen(false)}
                  className="rounded border border-slate-800 px-3 py-1.5 text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 font-bold text-white shadow"
                >
                  {creating ? 'Saving & Scoring...' : 'Create & Score Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
