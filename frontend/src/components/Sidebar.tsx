'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  Server,
  Users,
  Target,
  Layers,
  Send,
  CheckSquare,
  Bot,
  Megaphone,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface SidebarProps {
  pendingApprovalsCount?: number;
}

export default function Sidebar({ pendingApprovalsCount = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Community Discovery', href: '/discovery', icon: Compass },
    { label: 'Server Intelligence', href: '/servers', icon: Server },
    { label: 'Lead CRM', href: '/leads', icon: Users },
    { label: 'Lead Scoring Engine', href: '/scoring', icon: Target },
    { label: 'Service Matching', href: '/services', icon: Layers },
    { label: 'Outreach Studio', href: '/outreach', icon: Send },
    {
      label: 'Approvals Queue',
      href: '/approvals',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { label: 'Discord Integration', href: '/discord', icon: Bot },
    { label: 'Campaign Manager', href: '/campaigns', icon: Megaphone },
    { label: 'Analytics & Reports', href: '/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800 bg-[#080d1a] transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-cyan-500/20">
              <Radio className="h-5 w-5 text-white animate-pulse" />
              <div className="absolute inset-0 rounded-lg border border-cyan-400/40"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-white text-base">APK HUNTER</span>
                <span className="rounded bg-cyan-500/20 px-1 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/30">GRID</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">B2B PROSPECT INTELLIGENCE</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-cyan-500/20">
            <Radio className="h-5 w-5 text-white" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Compliance Pill */}
      {!collapsed && (
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
          <ShieldCheck size={14} className="shrink-0 text-emerald-400" />
          <span className="font-medium text-[11px] leading-tight">Human-in-Loop Safeguards Active</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className={`shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.badge !== undefined && (
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-500/40">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Workspace Footer */}
      <div className="border-t border-slate-800/80 p-3 bg-slate-900/40">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400">
              HQ
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold text-slate-200">APK Hunter HQ</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                API Connected
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          </div>
        )}
      </div>
    </aside>
  );
}
