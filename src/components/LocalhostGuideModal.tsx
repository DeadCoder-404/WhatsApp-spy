import React, { useState } from 'react';
import { Play, Download, Terminal, Check, Copy, ExternalLink, Zap, Shield, Laptop, X, Globe } from 'lucide-react';

interface LocalhostGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocalhostGuideModal({ isOpen, onClose }: LocalhostGuideModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-zinc-900 border border-zinc-800 p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                Auto Run on Localhost :4044
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Port 4044
                </span>
              </h2>
              <p className="text-xs text-zinc-400">1-Click Automated Startup for Windows, macOS &amp; Linux</p>
            </div>
          </div>
          <button
            id="close-localhost-modal-btn"
            onClick={onClose}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Port 4044 Banner */}
        <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              Automated Local Web URL:
            </span>
            <span className="text-xs font-bold font-mono text-emerald-300 bg-emerald-900/50 px-2.5 py-0.5 rounded border border-emerald-700">
              http://localhost:4044
            </span>
          </div>
          <p className="text-[11px] text-zinc-300">
            The automated launcher will verify Node.js, install dependencies automatically with <code className="text-emerald-400">npm install</code>, start the web server on <strong className="text-emerald-300">port 4044</strong>, and automatically pop open your default web browser!
          </p>
        </div>

        {/* 1-Click Launchers Download */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
            1-Click Automated Launchers:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              id="download-start-bat-btn"
              href="/api/whatsapp/localhost/download-windows-bat"
              download="start_localhost.bat"
              className="flex items-center justify-center gap-2 p-3 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-[0_0_12px_rgba(34,197,94,0.3)]"
            >
              <Download className="w-4 h-4" />
              start_localhost.bat (Win)
            </a>

            <a
              id="download-start-sh-btn"
              href="/api/whatsapp/localhost/download-macos-sh"
              download="start_localhost.sh"
              className="flex items-center justify-center gap-2 p-3 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-bold text-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              start_localhost.sh (Mac/Linux)
            </a>

            <a
              id="download-auto-py-btn"
              href="/api/whatsapp/localhost/download-auto-py"
              download="auto_run.py"
              className="flex items-center justify-center gap-2 p-3 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-bold text-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              auto_run.py (Python)
            </a>
          </div>
        </div>

        {/* Terminal Run Instructions */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
            Quick Terminal Commands (Local Project Folder):
          </h3>

          {/* Windows / NPM Command */}
          <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
              <span>Option A: Via NPM Scripts</span>
              <button
                onClick={() => copyToClipboard('npm run dev:4044', 'npm')}
                className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1"
              >
                {copiedId === 'npm' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedId === 'npm' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-2.5 rounded bg-black/60 text-emerald-400 text-xs overflow-x-auto">
              npm run dev:4044
            </pre>
          </div>

          {/* Direct Python Auto Runner */}
          <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
              <span>Option B: Cross-Platform Python Auto-Runner</span>
              <button
                onClick={() => copyToClipboard('python auto_run.py', 'py')}
                className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1"
              >
                {copiedId === 'py' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedId === 'py' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-2.5 rounded bg-black/60 text-emerald-400 text-xs overflow-x-auto">
              python auto_run.py
            </pre>
          </div>
        </div>

        {/* Feature Preservation Summary */}
        <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
          <div className="font-bold text-zinc-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            All Features Fully Preserved on Localhost :4044
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-zinc-400">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              8-Digit Phone Pairing Code Login
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Groq LLaMA-3.1 AI Auto-Reply Engine
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Forever Session Vault (Zero Re-login)
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Profile Name, Bio &amp; Story Broadcaster
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
