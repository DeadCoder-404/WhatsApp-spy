import React, { useState } from 'react';
import { WhatsAppStatus } from '../types';
import { Smartphone, Check, Copy, AlertCircle, X, ShieldCheck, KeyRound, Loader2, ArrowRight } from 'lucide-react';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: WhatsAppStatus;
}

export function PairingModal({ isOpen, onClose, status }: PairingModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(status.phoneNumber || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRequestPairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/whatsapp/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to request pairing code');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (status.pairingCode) {
      navigator.clipboard.writeText(status.pairingCode.replace(/-/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="relative w-full max-w-lg rounded-lg bg-zinc-900 border border-zinc-800 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded bg-zinc-950 text-emerald-400 border border-zinc-800">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Link with Phone Number</h2>
              <p className="text-xs text-zinc-400">WhatsApp Multi-Device 8-Digit Pairing Code</p>
            </div>
          </div>
          <button
            id="close-pairing-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded bg-rose-950/30 border border-rose-800/40 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRequestPairing} className="space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Phone Number (with Country Code):
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="pairing-phone-input"
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +1 234 567 8900 or +44 7123 456789"
                  className="w-full pl-9 pr-3 py-2 rounded bg-zinc-950 border border-zinc-800 focus:border-zinc-600 text-xs text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none"
                />
              </div>
              <button
                id="get-pairing-code-btn"
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_8px_rgba(34,197,94,0.3)]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {status.pairingCode ? 'Regenerate' : 'Get Code'}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              Include country code (e.g. +1 for US, +44 for UK, +91 for India, +55 for Brazil).
            </p>
          </form>

          {/* Pairing Code Display */}
          {status.pairingCode ? (
            <div className="p-4 rounded bg-zinc-950 border border-emerald-500/40 text-center space-y-3 animate-fade-in shadow-inner">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Your 8-Digit Pairing Code
              </span>
              <div className="flex items-center justify-center gap-3">
                <div className="font-mono text-3xl md:text-4xl font-black text-emerald-400 tracking-widest px-4 py-2 bg-zinc-900 rounded border border-emerald-500/30 shadow-inner">
                  {status.pairingCode}
                </div>
                <button
                  id="copy-pairing-code-btn"
                  onClick={handleCopyCode}
                  title="Copy Pairing Code"
                  className="p-3 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all active:scale-90 shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-zinc-400">
                Code will expire in a few minutes. Enter it immediately in WhatsApp.
              </p>
            </div>
          ) : status.state === 'pairing' ? (
            <div className="flex items-center justify-center gap-2 p-4 rounded bg-zinc-950 border border-zinc-800 text-amber-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Requesting pairing code from WhatsApp Multi-Device handshake...</span>
            </div>
          ) : null}

          {/* Instructions Step-by-Step */}
          <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              How to Link on your Phone:
            </h3>
            <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside font-mono">
              <li>Open <strong className="text-zinc-200">WhatsApp</strong> on your mobile device.</li>
              <li>Tap <strong className="text-zinc-200">Settings</strong> (iOS) or <strong className="text-zinc-200">Three Dots ⋮</strong> (Android) &gt; <strong className="text-zinc-200">Linked Devices</strong>.</li>
              <li>Tap <strong className="text-zinc-200">Link a device</strong>.</li>
              <li>Tap <strong className="text-zinc-200">&ldquo;Link with phone number instead&rdquo;</strong> at the bottom of the QR scanner.</li>
              <li>Enter the <strong className="text-emerald-400 font-bold">8-character pairing code</strong> shown above.</li>
            </ol>
          </div>

          {/* Connected State Banner */}
          {status.connected && (
            <div className="flex items-center justify-between p-3.5 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                <span className="font-bold">Successfully Connected: {status.userName || status.phoneNumber}</span>
              </div>
              <button
                id="connected-close-btn"
                onClick={onClose}
                className="px-3 py-1 rounded bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
