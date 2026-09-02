import { useState } from 'react';
import { Code2, Download, Copy, Check, Terminal, Play, Server, Smartphone, BookOpen, ExternalLink } from 'lucide-react';

export function PythonCliGuide() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'link' | 'status' | 'profile' | 'story' | 'send' | 'listen' | 'interactive'>('interactive');
  const [phoneParam, setPhoneParam] = useState('+1234567890');
  const [textParam, setTextParam] = useState('Automated Hello from Python CLI!');

  const samplePythonSnippet = `#!/usr/bin/env python3
# WhatsApp Multi-Device Automation Bot (Python Terminal Edition)
# Run anywhere: Linux, Termux, VPS, Raspberry Pi, Mac, Windows

import sys, os, time, json, urllib.request

DEFAULT_URL = os.environ.get("WHATSAPP_BOT_URL", "http://localhost:3000")

def link_account(phone_number):
    print(f"[*] Requesting WhatsApp Pairing Code for {phone_number}...")
    req = urllib.request.Request(
        f"{DEFAULT_URL}/api/whatsapp/pair",
        data=json.dumps({"phoneNumber": phone_number}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res = json.loads(urllib.request.urlopen(req).read())
    print("[*] Response:", res)

# Execute interactive shell:
# python3 whatsapp_bot.py
# Or command line flags:
# python3 whatsapp_bot.py --link +1234567890
# python3 whatsapp_bot.py --profile-name "Support Bot"
# python3 whatsapp_bot.py --story "Status update!"
# python3 whatsapp_bot.py --listen`;

  const getGeneratedCommand = () => {
    switch (selectedAction) {
      case 'link':
        return `python3 scripts/whatsapp_bot.py --link ${phoneParam || '+1234567890'}`;
      case 'status':
        return `python3 scripts/whatsapp_bot.py --status`;
      case 'profile':
        return `python3 scripts/whatsapp_bot.py --profile-name "WhatsApp Bot" --profile-status "Active 24/7"`;
      case 'story':
        return `python3 scripts/whatsapp_bot.py --story "${textParam || 'Automated Status Update'}"`;
      case 'send':
        return `python3 scripts/whatsapp_bot.py --send "${phoneParam || '+1234567890'}" --message "${textParam || 'Hello from CLI'}"`;
      case 'listen':
        return `python3 scripts/whatsapp_bot.py --listen`;
      case 'interactive':
      default:
        return `python3 scripts/whatsapp_bot.py`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(samplePythonSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(getGeneratedCommand());
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleDownloadScript = () => {
    window.location.href = '/api/whatsapp/download-script';
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-lg bg-zinc-900 border border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded bg-zinc-950 text-emerald-400 border border-zinc-800">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Standalone Python CLI Bot Script</h2>
            <p className="text-xs text-zinc-400">
              Run remotely on VPS, Termux on Android, Linux terminal, or daemon service.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="download-python-script-btn"
            onClick={handleDownloadScript}
            className="px-3.5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_8px_rgba(34,197,94,0.3)]"
          >
            <Download className="w-4 h-4" />
            Download whatsapp_bot.py
          </button>
        </div>
      </div>

      {/* Interactive Command Builder */}
      <div className="p-5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
          <Play className="w-3.5 h-3.5 text-emerald-400" />
          CLI Command Synthesizer
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { id: 'interactive', label: 'Shell REPL' },
            { id: 'link', label: 'Link Number' },
            { id: 'status', label: 'Check Status' },
            { id: 'profile', label: 'Set Profile' },
            { id: 'story', label: 'Post Story' },
            { id: 'send', label: 'Send Message' },
            { id: 'listen', label: 'Live Listen' },
          ].map((act) => (
            <button
              key={act.id}
              onClick={() => setSelectedAction(act.id as typeof selectedAction)}
              className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${
                selectedAction === act.id
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400 font-bold shadow-sm'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {act.label}
            </button>
          ))}
        </div>

        {/* Dynamic Inputs for generator */}
        {(selectedAction === 'link' || selectedAction === 'send') && (
          <div className="flex items-center gap-3">
            <label className="text-xs text-zinc-400 uppercase tracking-wider text-[10px] font-bold">Target Phone:</label>
            <input
              type="text"
              value={phoneParam}
              onChange={(e) => setPhoneParam(e.target.value)}
              placeholder="+1234567890"
              className="px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
        )}

        {(selectedAction === 'story' || selectedAction === 'send') && (
          <div className="flex items-center gap-3">
            <label className="text-xs text-zinc-400 uppercase tracking-wider text-[10px] font-bold">Message Text:</label>
            <input
              type="text"
              value={textParam}
              onChange={(e) => setTextParam(e.target.value)}
              placeholder="Your message content..."
              className="flex-1 px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
        )}

        {/* Generated Terminal Box */}
        <div className="flex items-center justify-between p-3.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-emerald-400">
          <span className="truncate pr-3">$ {getGeneratedCommand()}</span>
          <button
            id="copy-generated-cmd-btn"
            onClick={handleCopyCmd}
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-1 shrink-0"
          >
            {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCmd ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-100 font-bold text-xs uppercase tracking-wider">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            1. Linux / VPS Deployment
          </div>
          <p className="text-xs text-zinc-400">
            Copy <code className="text-emerald-400 font-mono">scripts/whatsapp_bot.py</code> to your server and run inside tmux:
          </p>
          <pre className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
            tmux new -s bot{"\n"}python3 whatsapp_bot.py
          </pre>
        </div>

        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-100 font-bold text-xs uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            2. Termux on Android
          </div>
          <p className="text-xs text-zinc-400">
            Run the bot directly on Android via Termux CLI:
          </p>
          <pre className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
            pkg update && pkg install python{"\n"}python3 whatsapp_bot.py -i
          </pre>
        </div>

        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-100 font-bold text-xs uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            3. Remote Target Env Var
          </div>
          <p className="text-xs text-zinc-400">
            Export the bot endpoint to manage remotely:
          </p>
          <pre className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
            export WHATSAPP_BOT_URL="{window.location.origin}"
          </pre>
        </div>
      </div>
    </div>
  );
}
