'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  Users,
  Target,
  Send,
  CheckSquare,
  TrendingUp,
  ShieldAlert,
  Radio,
  ArrowUpRight,
  Activity,
  Layers,
  Sparkles,
  Server,
  RefreshCw
} from 'lucide-react';

export default function OverviewDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/dashboard/');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const statCards = [
    {
      title: 'Discovered Communities',
      value: data?.total_discovered_communities ?? 0,
      sub: `${data?.communities_approved_outreach ?? 0} approved for outreach`,
      icon: Compass,
      color: 'from-blue-600 to-cyan-500',
      href: '/discovery'
    },
    {
      title: 'Total Prospect Leads',
      value: data?.total_saved_leads ?? 0,
      sub: `${data?.high_priority_leads ?? 0} high-priority (≥80 pts)`,
      icon: Users,
      color: 'from-cyan-500 to-teal-400',
      href: '/leads'
    },
    {
      title: 'Pending Approvals',
      value: data?.pending_message_approvals ?? 0,
      sub: 'Requires human-in-the-loop review',
      icon: CheckSquare,
      color: 'from-amber-500 to-orange-500',
      href: '/approvals'
    },
    {
      title: 'Authorized Posts Sent',
      value: data?.messages_sent_authorized_channels ?? 0,
      sub: 'In strictly approved channels only',
      icon: Send,
      color: 'from-emerald-500 to-teal-600',
      href: '/discord'
    },
    {
      title: 'Qualified Opportunities',
      value: data?.qualified_opportunities ?? 0,
      sub: 'Genuine business interest signals',
      icon: Target,
      color: 'from-purple-600 to-indigo-500',
      href: '/leads'
    }
  ];

  const serviceCategories = [
    { title: 'IPTV Subscription Services', badge: 'Active Lineup', desc: 'Premium multi-screen streaming channels, VOD & EPG.' },
    { title: 'Reseller Panel Solutions', badge: 'B2B Scaling', desc: 'Multi-tier reseller management, API top-ups & automated credits.' },
    { title: 'Authorized Restream Services', badge: 'High Bandwidth', desc: 'Redundant origin feeds & high-capacity direct streams.' },
    { title: 'Streaming App Rebranding', badge: 'White-Label APK', desc: 'Custom DNS hardcoding, splash screens & branded players.' },
    { title: 'Custom App Development', badge: 'Bespoke OTT', desc: 'Native Android TV, Fire TV, & Smart TV player engineering.' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-[#0d1629] to-slate-900/90 p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
              PROSPECT INTELLIGENCE COMMAND
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            APK Hunter Grid Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Real-time Discord community discovery, lead qualification, and authorized outreach management for IPTV, reseller panels, and custom streaming applications.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-cyan-500 hover:text-cyan-300 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
          <Link
            href="/discovery"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-400 transition-all"
          >
            <Compass size={14} />
            Discover Communities
          </Link>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              href={card.href}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 hover:border-slate-700 hover:bg-slate-900/90 transition-all duration-200 shadow-md hover:shadow-cyan-500/5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">{card.title}</p>
                  <p className="mt-2 text-2xl font-extrabold text-white tracking-tight">
                    {loading ? '...' : card.value}
                  </p>
                </div>
                <div className={`rounded-lg bg-gradient-to-br ${card.color} p-2 text-white shadow-md`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px] text-slate-400">
                <span className="truncate">{card.sub}</span>
                <ArrowUpRight size={13} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Conversion Funnel & Service Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Conversion Funnel */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-cyan-400" />
                Lead Qualification Funnel
              </h2>
              <p className="text-xs text-slate-400">
                Stage progression from public discovery signal to conversion
              </p>
            </div>
            <Link href="/leads" className="text-xs font-semibold text-cyan-400 hover:underline">
              View CRM Table →
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {data?.lead_conversion_funnel?.map((step: any, idx: number) => {
              const total = data?.total_saved_leads || 1;
              const percent = Math.min(Math.round((step.count / total) * 100), 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{step.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{step.count}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({percent}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(percent, 4)}%`,
                        backgroundColor: step.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compliance Assurance Box */}
          <div className="mt-6 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-slate-300 flex items-start gap-3">
            <ShieldAlert size={18} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-cyan-300">Safe Outreach Policy:</span> Automated unsolicited direct messages and arbitrary guild joining are permanently blocked. Outreach requires explicitly authorized destination channels and signed human operator approvals.
            </div>
          </div>
        </div>

        {/* Target Service Categories */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers size={16} className="text-cyan-400" />
                Target Service Offerings
              </h2>
              <Link href="/services" className="text-xs font-semibold text-cyan-400 hover:underline">
                Catalog →
              </Link>
            </div>

            <div className="mt-4 space-y-2.5">
              {serviceCategories.map((serv, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-800/80 bg-slate-900/80 p-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-200">{serv.title}</h3>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-slate-700">
                      {serv.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{serv.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <Link
              href="/outreach"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              <Sparkles size={13} />
              Generate Service Proposal Drafts →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity Stream & Weekly Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Prospecting Activity */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <TrendingUp size={16} className="text-cyan-400" />
            Weekly Prospecting Performance
          </h2>
          <div className="mt-4 grid grid-cols-7 gap-2 text-center">
            {data?.weekly_performance?.map((w: any, idx: number) => (
              <div key={idx} className="rounded-lg border border-slate-800/80 bg-slate-900/80 p-2">
                <p className="text-[10px] font-mono text-slate-400 uppercase">{w.day}</p>
                <p className="mt-1 text-base font-bold text-white">{w.new_leads}</p>
                <p className="text-[9px] text-slate-500">Leads</p>
                <div className="mt-2 pt-1 border-t border-slate-800">
                  <span className="text-[10px] font-semibold text-cyan-400">{w.posts_dispatched}</span>
                  <span className="text-[8px] text-slate-500 block">Posts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Trail Activity */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              Verified Activity Trail
            </h2>
            <Link href="/settings" className="text-xs font-semibold text-slate-400 hover:text-cyan-400">
              Audit Logs →
            </Link>
          </div>

          <div className="mt-4 space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {data?.recent_activity?.length > 0 ? (
              data.recent_activity.map((act: any) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-800/60 bg-slate-900/70 p-2.5 text-xs"
                >
                  <div className="h-2 w-2 rounded-full bg-cyan-400 mt-1.5 shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{act.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{act.details}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No recent actions recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
