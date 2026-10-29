'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Users,
  CheckCircle,
  TrendingUp,
  FileSpreadsheet,
  PieChart,
  RefreshCw
} from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/analytics/overview');
      if (res.ok) setAnalytics(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={22} className="text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Analytics & Performance Reports</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real performance tracking, qualification ratios, and one-click database CSV export.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://127.0.0.1:8000/api/v1/analytics/export/leads-csv"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-300"
          >
            <Download size={13} />
            Export Leads CSV
          </a>
          <a
            href="http://127.0.0.1:8000/api/v1/analytics/export/communities-csv"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-300"
          >
            <FileSpreadsheet size={13} />
            Export Communities CSV
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400 font-medium">Total Captured Leads</p>
          <p className="mt-2 text-2xl font-black text-white">{analytics?.total_leads ?? 0}</p>
          <span className="mt-1 block text-[11px] text-slate-500">100% voluntary/public records</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400 font-medium">Qualified Leads</p>
          <p className="mt-2 text-2xl font-black text-emerald-400">{analytics?.qualified_leads ?? 0}</p>
          <span className="mt-1 block text-[11px] text-slate-500">
            {analytics?.qualification_rate_percent ?? 0}% Qualification Rate
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400 font-medium">Authorized Contacts</p>
          <p className="mt-2 text-2xl font-black text-cyan-400">{analytics?.contacted_leads ?? 0}</p>
          <span className="mt-1 block text-[11px] text-slate-500">In discussions</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400 font-medium">Converted Clients</p>
          <p className="mt-2 text-2xl font-black text-purple-400">{analytics?.converted_leads ?? 0}</p>
          <span className="mt-1 block text-[11px] text-slate-500">
            {analytics?.conversion_rate_percent ?? 0}% Conversion Rate
          </span>
        </div>
      </div>

      {/* Service Breakdown & CRM Status Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Service Interest */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <PieChart size={16} className="text-cyan-400" />
            Distribution by Service Interest
          </h2>

          <div className="space-y-3">
            {analytics?.by_service?.map((item: any, idx: number) => {
              const total = analytics?.total_leads || 1;
              const percent = Math.round((item.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{item.service}</span>
                    <span className="text-slate-400 font-mono">{item.count} leads ({percent}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                      style={{ width: `${Math.max(percent, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leads by Pipeline Status */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <TrendingUp size={16} className="text-cyan-400" />
            Leads by Pipeline Stage
          </h2>

          <div className="space-y-3">
            {analytics?.by_status?.map((item: any, idx: number) => {
              const total = analytics?.total_leads || 1;
              const percent = Math.round((item.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{item.status}</span>
                    <span className="text-slate-400 font-mono">{item.count} leads</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${Math.max(percent, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
