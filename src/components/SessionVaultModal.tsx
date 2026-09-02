import React, { useState, useEffect } from 'react';
import { SessionMetadata, WhatsAppStatus } from '../types';
import {
  ShieldCheck,
  KeyRound,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Database,
  X,
  FileCheck2,
  Lock,
} from 'lucide-react';

interface SessionVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: WhatsAppStatus;
  onRefreshStatus: () => void;
}

export function SessionVaultModal({ isOpen, onClose, status, onRefreshStatus }: SessionVaultModalProps) {
  const [meta, setMeta] = useState<SessionMetadata | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [importTokenInput, setImportTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSessionData();
    }
  }, [isOpen]);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      const [metaRes, exportRes] = await Promise.all([
        fetch('/api/whatsapp/session'),
        fetch('/api/whatsapp/session/export'),
      ]);
      const metaData = await metaRes.json();
      const exportData = await exportRes.json();

      setMeta(metaData);
      if (exportData?.token) {
        setToken(exportData.token);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImportToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTokenInput.trim()) return;

    setImporting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/whatsapp/session/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: importTokenInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Session token imported! WhatsApp is reconnecting...' });
        setImportTokenInput('');
        fetchSessionData();
        onRefreshStatus();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to import session token' });
      }
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setImporting(false);
    }
  };

  const handleForceReconnect = async () => {
    setReconnecting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/whatsapp/session/reconnect', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Reconnection signal sent to WhatsApp Engine' });
        fetchSessionData();
        onRefreshStatus();
      } else {
        setFeedback({ type: 'error', message: data.message });
      }
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Error' });
    } finally {
      setReconnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="relative w-full max-w-2xl rounded-lg bg-zinc-900 border border-zinc-800 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded bg-zinc-950 text-emerald-400 border border-zinc-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                Persistent Session Vault
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-semibold">
                  Zero-Login Auto-Restore
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Cryptographic key persistence across reboots & server restarts</p>
            </div>
          </div>
          <button
            id="close-session-vault-btn"
            onClick={onClose}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback notification */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-800/60 text-rose-400'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="py-4 overflow-y-auto space-y-5 pr-1">
          {/* Status Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                <span>Vault State</span>
                <Lock className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                {meta?.isStored ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#22c55e]" />
                    <span className="text-emerald-400">Stored & Protected</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-zinc-600" />
                    <span className="text-zinc-500">No Session Stored</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">
                {meta?.isStored ? 'Auto-loaded on startup' : 'Link phone to generate'}
              </p>
            </div>

            <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                <span>Auth Keys</span>
                <KeyRound className="w-3 h-3 text-cyan-400" />
              </div>
              <div className="text-sm font-bold text-zinc-100">
                {meta?.keysCount || 0} Key Files
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">
                Size: {((meta?.credsSize || 0) / 1024).toFixed(1)} KB snapshot
              </p>
            </div>

            <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                <span>Last Snapshot</span>
                <FileCheck2 className="w-3 h-3 text-purple-400" />
              </div>
              <div className="text-xs font-bold text-zinc-200 truncate">
                {meta?.storedAt ? new Date(meta.storedAt).toLocaleTimeString() : 'Never'}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono truncate">
                {meta?.userName ? `${meta.userName}` : 'No user linked'}
              </p>
            </div>
          </div>

          {/* Explain Banner */}
          <div className="p-4 rounded bg-zinc-950 border border-emerald-900/40 text-xs text-zinc-300 space-y-2">
            <div className="font-bold text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              How Persistent Zero-Login Storage Works:
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Every time you pair your WhatsApp account via phone number, all Multi-Device Signal keys, app state sync,
              and AES credentials are saved to disk and backed up to <code className="text-emerald-300">data/session_vault.json</code>.
              When the server or container restarts, the bot automatically restores and re-authenticates without asking you for any code or QR scan.
            </p>
          </div>

          {/* Export Token Box */}
          <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Portable Session String Token
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Export your session to instantly migrate or backup without re-pairing
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/api/whatsapp/session/download-backup"
                  download="whatsapp-session-vault.json"
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 border border-zinc-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  JSON Vault
                </a>
              </div>
            </div>

            {token ? (
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    readOnly
                    rows={3}
                    value={token}
                    className="w-full p-2.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-300 focus:outline-none resize-none"
                  />
                  <button
                    id="copy-session-token-btn"
                    onClick={handleCopyToken}
                    className="absolute right-2 top-2 p-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-1 shadow transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Keep this token secure. Anyone with this token can authenticate with your WhatsApp bot session.
                </p>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic p-3 bg-zinc-900 rounded border border-zinc-800/80">
                No active session token available yet. Link your phone number first.
              </div>
            )}
          </div>

          {/* Import Token Form */}
          <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              Restore / Import Session from Token
            </h3>
            <form onSubmit={handleImportToken} className="space-y-3">
              <textarea
                value={importTokenInput}
                onChange={(e) => setImportTokenInput(e.target.value)}
                placeholder="Paste your WABOT_SESSION_... base64 token here to restore session without phone login"
                rows={2}
                className="w-full p-2.5 rounded bg-zinc-900 border border-zinc-800 focus:border-zinc-600 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">
                  Importing will overwrite current session keys and reboot connection.
                </span>
                <button
                  id="import-session-token-btn"
                  type="submit"
                  disabled={importing || !importTokenInput.trim()}
                  className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {importing ? 'Importing...' : 'Restore Session'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between shrink-0">
          <button
            id="force-reconnect-session-btn"
            onClick={handleForceReconnect}
            disabled={reconnecting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono border border-zinc-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${reconnecting ? 'animate-spin' : ''}`} />
            <span>Force Reconnect Socket</span>
          </button>

          <button
            id="done-session-vault-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
}
