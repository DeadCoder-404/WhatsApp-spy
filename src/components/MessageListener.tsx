import React, { useState, useEffect } from 'react';
import { IncomingMessage } from '../types';
import { MessageSquare, Search, Send, Trash2, User, Users, RefreshCw, Loader2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export function MessageListener() {
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [filterText, setFilterText] = useState('');
  const [chatTypeFilter, setChatTypeFilter] = useState<'all' | 'direct' | 'groups'>('all');
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/whatsapp/messages?limit=100');
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch {
      // ignore
    }
  };

  const handleClear = async () => {
    try {
      await fetch('/api/whatsapp/messages', { method: 'DELETE' });
      setMessages([]);
    } catch {
      // ignore
    }
  };

  const handleSendQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: selectedRecipient,
          message: replyMessage.trim(),
        }),
      });
      setReplyMessage('');
      fetchMessages();
    } catch (e) {
      console.error(e);
    } finally {
      setSendingReply(false);
    }
  };

  const filtered = messages.filter((m) => {
    if (chatTypeFilter === 'direct' && m.isGroup) return false;
    if (chatTypeFilter === 'groups' && !m.isGroup) return false;
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      return (
        m.text.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        m.senderNumber.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 font-mono">
      {/* Filter and Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-zinc-900 border border-zinc-800 p-3.5 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id="message-listener-search"
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search captured messages or phone numbers..."
              className="w-full pl-9 pr-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs text-zinc-100 placeholder:text-zinc-600 font-mono"
            />
          </div>
          <select
            id="chat-type-filter-select"
            value={chatTypeFilter}
            onChange={(e) => setChatTypeFilter(e.target.value as 'all' | 'direct' | 'groups')}
            className="px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none font-mono"
          >
            <option value="all">All Chats</option>
            <option value="direct">Direct Only</option>
            <option value="groups">Groups Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400">
            Captured: <strong className="text-emerald-400">{messages.length}</strong>
          </span>
          <button
            id="refresh-messages-btn"
            onClick={fetchMessages}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            id="clear-messages-btn"
            onClick={handleClear}
            className="px-2.5 py-1.5 rounded bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-800/40 text-xs flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Messages Feed Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl">
        <div className="divide-y divide-zinc-800 max-h-[480px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-xs font-mono">No incoming messages captured yet.</p>
              <p className="text-[11px] text-zinc-600">Send a WhatsApp message to the linked number to see it stream live.</p>
            </div>
          ) : (
            filtered.map((msg) => (
              <div
                key={msg.id}
                onClick={() => setSelectedRecipient(msg.senderJid)}
                className={`p-3.5 hover:bg-zinc-800/60 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-2 ${
                  selectedRecipient === msg.senderJid ? 'bg-zinc-800/80 border-l-2 border-emerald-500' : ''
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                      msg.fromMe
                        ? 'bg-purple-950/40 text-purple-400 border-purple-800/60'
                        : msg.isGroup
                        ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                        : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                    }`}
                  >
                    {msg.fromMe ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : msg.isGroup ? (
                      <Users className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-zinc-100 truncate">{msg.senderName}</span>
                      <span className="text-[10px] font-mono text-zinc-400">+{msg.senderNumber}</span>
                      {msg.isGroup && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-950/40 text-amber-300 border border-amber-800/60">
                          Group
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 break-words font-mono">{msg.text}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    id={`reply-to-${msg.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecipient(msg.senderJid);
                    }}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-mono transition-colors"
                  >
                    Reply
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Reply Bar */}
        {selectedRecipient && (
          <form
            onSubmit={handleSendQuickReply}
            className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center gap-2"
          >
            <span className="text-xs font-mono text-emerald-400 whitespace-nowrap">
              &gt; Reply to {selectedRecipient.split('@')[0]}:
            </span>
            <input
              id="listener-quick-reply-input"
              type="text"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type instant message response..."
              className="flex-1 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
            />
            <button
              id="send-listener-reply-btn"
              type="submit"
              disabled={sendingReply || !replyMessage.trim()}
              className="px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1 transition-all shadow-[0_0_8px_rgba(34,197,94,0.3)]"
            >
              {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
