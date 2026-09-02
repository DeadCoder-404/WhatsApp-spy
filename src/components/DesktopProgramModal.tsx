import React, { useState } from 'react';
import { Download, Monitor, Terminal, Check, Copy, ExternalLink, ShieldCheck, Cpu, Zap, Radio, X } from 'lucide-react';

interface DesktopProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DesktopProgramModal({ isOpen, onClose }: DesktopProgramModalProps) {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-zinc-900 border border-zinc-800 p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                WhatsApp Bot Desktop Program
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Native GUI
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Standalone desktop application with Groq LLaMA-3.1-8b-instant &amp; Zero-Login Vault</p>
            </div>
          </div>
          <button
            id="close-desktop-modal-btn"
            onClick={onClose}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Zap className="w-3.5 h-3.5" />
              Forever Session
            </div>
            <p className="text-[11px] text-zinc-400">Never logs out; persists encryption keys across app restarts.</p>
          </div>

          <div className="p-3 rounded bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
              <Cpu className="w-3.5 h-3.5" />
              Groq LLaMA-3.1
            </div>
            <p className="text-[11px] text-zinc-400">Automated replies @ temp 0.4 with multi-turn chat memory.</p>
          </div>

          <div className="p-3 rounded bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
              <Radio className="w-3.5 h-3.5" />
              Multi-Device
            </div>
            <p className="text-[11px] text-zinc-400">Links directly via 8-digit phone number pairing codes.</p>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
            Download Desktop Program Package:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              id="download-desktop-py-btn"
              href="/api/whatsapp/desktop/download-gui"
              download="whatsapp_desktop.py"
              className="flex items-center justify-center gap-2 p-3 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-[0_0_12px_rgba(34,197,94,0.3)]"
            >
              <Download className="w-4 h-4" />
              whatsapp_desktop.py
            </a>

            <a
              id="download-windows-bat-btn"
              href="/api/whatsapp/desktop/download-windows-bat"
              download="run_desktop.bat"
              className="flex items-center justify-center gap-2 p-3 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-bold text-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              run_desktop.bat (Win)
            </a>

            <a
              id="download-macos-sh-btn"
              href="/api/whatsapp/desktop/download-macos-sh"
              download="run_desktop.sh"
              className="flex items-center justify-center gap-2 p-3 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-bold text-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              run_desktop.sh (Mac/Linux)
            </a>
          </div>
        </div>

        {/* Quick Launch Commands */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
            How to Run on Your Computer:
          </h3>

          {/* Windows */}
          <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
              <span>Windows (PowerShell / Command Prompt):</span>
              <button
                onClick={() => copyToClipboard('python whatsapp_desktop.py', 'win')}
                className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1"
              >
                {copiedCmd === 'win' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedCmd === 'win' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-2.5 rounded bg-black/60 text-emerald-400 text-xs overflow-x-auto">
              python whatsapp_desktop.py
            </pre>
            <p className="text-[11px] text-zinc-400">Or simply double-click <strong className="text-zinc-200">run_desktop.bat</strong>.</p>
          </div>

          {/* macOS / Linux */}
          <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
              <span>macOS &amp; Linux (Terminal):</span>
              <button
                onClick={() => copyToClipboard('chmod +x run_desktop.sh && ./run_desktop.sh', 'unix')}
                className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1"
              >
                {copiedCmd === 'unix' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedCmd === 'unix' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-2.5 rounded bg-black/60 text-emerald-400 text-xs overflow-x-auto">
              chmod +x run_desktop.sh && ./run_desktop.sh
            </pre>
          </div>
        </div>

        {/* Server Connection Note */}
        <div className="p-3 rounded bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-zinc-200">Remote Sync:</strong> The desktop app automatically syncs with your WhatsApp bot instance at <span className="text-emerald-400 font-mono">{currentHost}</span> or can run locally.
          </div>
        </div>
      </div>
    </div>
  );
}
