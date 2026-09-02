import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { Terminal as TerminalIcon, Play, Trash2, Copy, Check, CornerDownLeft, Sparkles, HelpCircle } from 'lucide-react';

interface TerminalViewProps {
  onOpenPairing: () => void;
}

export function TerminalView({ onOpenPairing }: TerminalViewProps) {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const xtermInstance = useRef<XTerm | null>(null);
  const fitAddonInstance = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [inputCommand, setInputCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [copied, setCopied] = useState(false);
  const [connectedWs, setConnectedWs] = useState(false);

  // Quick Command Chips
  const quickCommands = [
    { label: 'help', cmd: 'help', desc: 'Show all commands' },
    { label: 'status', cmd: 'status', desc: 'Bot health & status' },
    { label: 'rules', cmd: 'rules', desc: 'List auto-reply rules' },
    { label: 'listen', cmd: 'listen', desc: 'Live listener summary' },
    { label: 'ai on', cmd: 'ai on', desc: 'Enable Gemini AI agent' },
    { label: 'story', cmd: 'story Online and active 🚀', desc: 'Post status story' },
    { label: 'profile bio', cmd: 'profile about WhatsApp Automation Bot 🤖', desc: 'Change bio' },
  ];

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize XTerm
    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: '"Fira Code", monospace, "Courier New"',
      fontSize: 13,
      lineHeight: 1.4,
      theme: {
        background: '#09090b',
        foreground: '#d4d4d8',
        cursor: '#22c55e',
        selectionBackground: '#22c55e33',
        black: '#18181b',
        red: '#f43f5e',
        green: '#22c55e',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#d946ef',
        cyan: '#06b6d4',
        white: '#f4f4f5',
        brightBlack: '#52525b',
        brightRed: '#fb7185',
        brightGreen: '#4ade80',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#e879f9',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
      convertEol: true,
      scrollback: 2000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermInstance.current = term;
    fitAddonInstance.current = fitAddon;

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal`;
    
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectedWs(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'terminal_output' && typeof payload.data === 'string') {
            term.write(payload.data);
          }
        } catch {
          term.write(event.data);
        }
      };

      ws.onclose = () => {
        setConnectedWs(false);
        term.writeln('\r\n\x1b[90m[!] WebSocket stream disconnected. Reconnecting in 3s...\x1b[0m');
      };
    } catch (e) {
      console.error('WS error:', e);
    }

    // Direct terminal typing input handling
    let currentLine = '';
    term.onData((data) => {
      if (data === '\r') {
        // Enter
        term.write('\r\n');
        if (currentLine.trim()) {
          sendCommand(currentLine.trim());
          currentLine = '';
        }
      } else if (data === '\u007F') {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data >= ' ') {
        currentLine += data;
        term.write(data);
      }
    });

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      term.dispose();
    };
  }, []);

  const sendCommand = (cmd: string) => {
    if (!cmd.trim()) return;

    // Add to history
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'command', command: cmd }));
    } else {
      // Fallback to HTTP POST
      fetch('/api/whatsapp/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      }).catch((e) => console.error(e));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCommand.trim()) return;
    sendCommand(inputCommand.trim());
    setInputCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputCommand(commandHistory[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputCommand('');
      } else {
        setHistoryIndex(nextIndex);
        setInputCommand(commandHistory[nextIndex]);
      }
    }
  };

  const handleClear = () => {
    if (xtermInstance.current) {
      xtermInstance.current.clear();
    }
    sendCommand('clear');
  };

  const handleCopyLogs = () => {
    if (xtermInstance.current) {
      xtermInstance.current.selectAll();
      const selection = xtermInstance.current.getSelection();
      xtermInstance.current.clearSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-zinc-800 border border-zinc-700 text-emerald-400">
            <TerminalIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                WhatsApp Terminal Console
              </h2>
              <span className={`w-2 h-2 rounded-full ${connectedWs ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500'}`} />
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Bi-directional CLI stream. Execute commands directly or link with phone number.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="term-link-quick-btn"
            onClick={onOpenPairing}
            className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Link Phone
          </button>
          <button
            id="term-copy-btn"
            onClick={handleCopyLogs}
            className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            id="term-clear-btn"
            onClick={handleClear}
            className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            Clear
          </button>
        </div>
      </div>

      {/* Terminal View Container */}
      <div className="relative rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-xs text-zinc-400 font-mono">whatsapp-bot@multi-device: ~</span>
          </div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
            Baileys v2.5 / Python CLI Bridge
          </div>
        </div>

        {/* XTerm Screen */}
        <div className="p-3 min-h-[380px] max-h-[500px] bg-zinc-950">
          <div ref={terminalRef} className="h-[380px] w-full" />
        </div>

        {/* Command Input Bar */}
        <div className="border-t border-zinc-800 bg-zinc-900/90 p-3">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-bold select-none pl-1">
              &gt;
            </span>
            <input
              id="terminal-cli-input"
              type="text"
              value={inputCommand}
              onChange={(e) => setInputCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type command here (e.g. login +1234567890, status, help)..."
              className="flex-1 bg-transparent text-zinc-100 text-xs focus:outline-none placeholder:text-zinc-600 font-mono"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              id="terminal-exec-btn"
              type="submit"
              disabled={!inputCommand.trim()}
              className="px-3 py-1.5 rounded bg-emerald-500 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 font-bold text-xs flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(34,197,94,0.3)]"
            >
              <Play className="w-3 h-3 fill-current" />
              Run
            </button>
          </form>
        </div>
      </div>

      {/* Quick Command Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 flex items-center gap-1 font-mono pr-1">
          <HelpCircle className="w-3 h-3 text-zinc-500" /> Quick Cmds:
        </span>
        {quickCommands.map((q) => (
          <button
            key={q.cmd}
            id={`quick-cmd-${q.label.replace(/\s+/g, '-')}`}
            onClick={() => {
              setInputCommand(q.cmd);
              sendCommand(q.cmd);
            }}
            title={q.desc}
            className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-mono transition-all flex items-center gap-1.5"
          >
            <span>{q.label}</span>
            <CornerDownLeft className="w-2.5 h-2.5 text-zinc-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
