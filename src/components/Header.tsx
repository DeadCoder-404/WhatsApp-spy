import React from 'react';
import { WhatsAppStatus } from '../types';
import { Terminal, Shield, Wifi, WifiOff, RefreshCw, LogOut, Smartphone, Sparkles, Code2, Activity, Database, Monitor, Laptop } from 'lucide-react';

interface HeaderProps {
  status: WhatsAppStatus;
  onOpenPairing: () => void;
  onOpenSessionVault: () => void;
  onOpenDesktop: () => void;
  onOpenLocalhost: () => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Header({ status, onOpenPairing, onOpenSessionVault, onOpenDesktop, onOpenLocalhost, onLogout, activeTab, setActiveTab }: HeaderProps) {
  const isConnected = status.connected;

  const navItems = [
    { id: 'terminal', label: 'Terminal CLI', icon: Terminal },
    { id: 'profile', label: 'Identity & Status', icon: Smartphone },
    { id: 'autoreply', label: 'Auto-Replies & AI', icon: Sparkles },
    { id: 'listener', label: 'Live Monitor', icon: Shield },
    { id: 'python', label: 'Python Script', icon: Code2 },
  ];

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-md transition-colors">
      {/* Top Telemetry & Status Bar */}
      <div className="border-b border-zinc-800/80 px-4 lg:px-6 py-2 bg-zinc-950/60">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                isConnected
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.7)] animate-pulse'
                  : status.state === 'pairing'
                  ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
              }`}
            />
            <span className="text-zinc-200 font-bold tracking-widest">
              W-Bot Controller v2.5.0
            </span>
            <span className="text-zinc-700 hidden sm:inline">|</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-zinc-400">
              <Activity className="w-3 h-3 text-emerald-400" />
              Engine: Baileys v2.5 / Python Bridge
            </span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <span>
              Session: <strong className="text-zinc-200 font-mono">0x{status.userJid ? status.userJid.slice(0, 5).toUpperCase() : '88F2A'}</strong>
            </span>
            <span>
              Uptime: <strong className="text-zinc-200 font-mono">{formatUptime(status.uptimeSeconds)}</strong>
            </span>
            <span>
              Linked:{' '}
              <strong className={isConnected ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                {status.phoneNumber ? `+${status.phoneNumber}` : 'None (Unlinked)'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 shadow-inner">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-100 font-mono tracking-tight">
                {status.userName || 'Remote_Alpha'}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-semibold border ${
                  isConnected
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                    : status.state === 'pairing'
                    ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                    : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                }`}
              >
                {status.state}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono truncate max-w-xs">
              {status.userStatus || 'Available for CLI deployment'}
            </p>
          </div>
        </div>

        {/* Center: Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-btn-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all whitespace-nowrap border ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm shadow-black/40'
                    : 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            id="header-localhost-btn"
            onClick={onOpenLocalhost}
            title="Auto Run Web App on Localhost :4044"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700 text-emerald-400 font-mono text-xs transition-colors"
          >
            <Laptop className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Localhost :4044</span>
          </button>

          <button
            id="header-desktop-program-btn"
            onClick={onOpenDesktop}
            title="Download Standalone Desktop Application"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700 text-zinc-200 font-mono text-xs transition-colors"
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Desktop App</span>
          </button>

          <button
            id="header-session-vault-btn"
            onClick={onOpenSessionVault}
            title="Persistent Session Vault (Zero-Login Key Store)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700 text-zinc-200 font-mono text-xs transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Session Vault</span>
          </button>

          {!isConnected ? (
            <button
              id="header-link-btn"
              onClick={onOpenPairing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-mono font-bold text-xs transition-all shadow-[0_0_12px_rgba(34,197,94,0.3)]"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Link Phone Number
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="header-pairing-btn"
                onClick={onOpenPairing}
                title="Pairing Info"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-mono text-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Re-Link</span>
              </button>
              <button
                id="header-logout-btn"
                onClick={onLogout}
                title="Disconnect & Logout"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-rose-400 font-mono text-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

