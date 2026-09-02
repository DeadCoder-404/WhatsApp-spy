import React, { useState, useEffect } from 'react';
import { AutoReplyRule, BotConfig } from '../types';
import { Sparkles, Plus, Trash2, Edit2, Check, Brain, Sliders, Play, AlertCircle, ToggleLeft, ToggleRight, Clock } from 'lucide-react';

export function AutoReplyManager() {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // New/Edit Rule Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [matchType, setMatchType] = useState<AutoReplyRule['matchType']>('contains');
  const [triggerPattern, setTriggerPattern] = useState('');
  const [replyText, setReplyText] = useState('');
  const [applyTo, setApplyTo] = useState<AutoReplyRule['applyTo']>('all');
  const [delaySeconds, setDelaySeconds] = useState(1);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiThinking, setAiThinking] = useState(false);

  // Test Simulator State
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, configRes] = await Promise.all([
        fetch('/api/whatsapp/rules'),
        fetch('/api/whatsapp/config'),
      ]);
      const rulesData = await rulesRes.json();
      const configData = await configRes.json();
      if (rulesData.rules) setRules(rulesData.rules);
      if (configData) setConfig(configData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGlobal = async (key: keyof BotConfig, val: unknown) => {
    if (!config) return;
    const updated = { ...config, [key]: val };
    setConfig(updated);
    try {
      await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // ignore
    }
  };

  const handleToggleRule = async (rule: AutoReplyRule) => {
    const updatedRule = { ...rule, enabled: !rule.enabled };
    setRules((prev) => prev.map((r) => (r.id === rule.id ? updatedRule : r)));
    try {
      await fetch(`/api/whatsapp/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRule),
      });
    } catch {
      fetchData();
    }
  };

  const handleDeleteRule = async (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    try {
      await fetch(`/api/whatsapp/rules/${id}`, { method: 'DELETE' });
    } catch {
      fetchData();
    }
  };

  const handleOpenAddModal = () => {
    setEditingRuleId(null);
    setRuleName('');
    setMatchType('contains');
    setTriggerPattern('');
    setReplyText('');
    setApplyTo('all');
    setDelaySeconds(1);
    setAiPrompt('');
    setAiThinking(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: AutoReplyRule) => {
    setEditingRuleId(rule.id);
    setRuleName(rule.name);
    setMatchType(rule.matchType);
    setTriggerPattern(rule.triggerPattern);
    setReplyText(rule.replyText);
    setApplyTo(rule.applyTo);
    setDelaySeconds(rule.delaySeconds || 1);
    setAiPrompt(rule.aiPrompt || '');
    setAiThinking(rule.aiThinking || false);
    setIsModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !triggerPattern.trim()) return;

    const payload = {
      name: ruleName.trim(),
      matchType,
      triggerPattern: triggerPattern.trim(),
      replyText: replyText.trim(),
      applyTo,
      delaySeconds,
      aiPrompt: aiPrompt.trim(),
      aiThinking,
      priority: 5,
      enabled: true,
    };

    try {
      if (editingRuleId) {
        await fetch(`/api/whatsapp/rules/${editingRuleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/whatsapp/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunSimulator = () => {
    if (!testInput.trim()) return;
    const input = testInput.toLowerCase().trim();

    for (const rule of rules.filter((r) => r.enabled)) {
      let matched = false;
      if (rule.matchType === 'exact') {
        matched = rule.triggerPattern.toLowerCase().split(',').map((t) => t.trim()).includes(input);
      } else if (rule.matchType === 'contains') {
        matched = rule.triggerPattern.toLowerCase().split(',').some((t) => t.trim() && input.includes(t.trim()));
      } else if (rule.matchType === 'startsWith') {
        matched = rule.triggerPattern.toLowerCase().split(',').some((t) => t.trim() && input.startsWith(t.trim()));
      } else if (rule.matchType === 'regex') {
        try {
          matched = new RegExp(rule.triggerPattern, 'i').test(testInput);
        } catch {
          matched = false;
        }
      } else if (rule.matchType === 'ai') {
        matched = true;
      }

      if (matched) {
        setTestResult(`Matched [${rule.name}]: "${rule.replyText || '✨ (Gemini AI Dynamic Generated Response)'}"`);
        return;
      }
    }

    if (config?.aiAutoReplyEnabled) {
      setTestResult(`No exact rule matched -> Falls back to Gemini AI Auto-Responder (${config.aiModel})`);
    } else {
      setTestResult('No auto-reply rule matched.');
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner: Global Auto-Responder & AI Switch */}
      {config && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Global Auto-Reply
              </span>
              <p className="text-[11px] text-zinc-400">Trigger rule-based replies on incoming chats</p>
            </div>
            <button
              id="toggle-global-autoreply-btn"
              onClick={() => handleToggleGlobal('autoReplyGlobalEnabled', !config.autoReplyGlobalEnabled)}
              className="text-2xl transition-colors"
            >
              {config.autoReplyGlobalEnabled ? (
                <ToggleRight className="w-8 h-8 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-zinc-600" />
              )}
            </button>
          </div>

          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-emerald-400" />
                Groq AI Auto-Reply (LLaMA-3.1)
              </span>
              <p className="text-[11px] text-zinc-400">
                Contextual chat replies (llama-3.1-8b-instant @ temp {config.groqTemperature ?? 0.4})
              </p>
            </div>
            <button
              id="toggle-ai-agent-btn"
              onClick={() => handleToggleGlobal('aiAutoReplyEnabled', !config.aiAutoReplyEnabled)}
              className="text-2xl transition-colors"
            >
              {config.aiAutoReplyEnabled ? (
                <ToggleRight className="w-8 h-8 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-zinc-600" />
              )}
            </button>
          </div>

          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Typing Simulation
              </span>
              <p className="text-[11px] text-zinc-400">Show typing presence before responding</p>
            </div>
            <button
              id="toggle-typing-indicator-btn"
              onClick={() => handleToggleGlobal('typingIndicator', !config.typingIndicator)}
              className="text-2xl transition-colors"
            >
              {config.typingIndicator ? (
                <ToggleRight className="w-8 h-8 text-amber-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-zinc-600" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Section: Rule Builder & Test Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rules Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                Automated Reply Rules ({rules.length})
              </h3>
              <p className="text-[11px] text-zinc-400">Configure trigger conditions and dynamic replies</p>
            </div>
            <button
              id="add-new-rule-btn"
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_8px_rgba(34,197,94,0.3)]"
            >
              <Plus className="w-3.5 h-3.5" />
              New Rule
            </button>
          </div>

          <div className="space-y-2.5">
            {rules.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      onClick={() => handleToggleRule(r)}
                      className={`cursor-pointer px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        r.enabled
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      {r.enabled ? 'ACTIVE' : 'PAUSED'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/60">
                      {r.matchType}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Target: {r.applyTo}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-100 truncate">{r.name}</h4>
                  </div>

                  <div className="text-xs font-mono text-zinc-300 flex items-center gap-2">
                    <span className="text-zinc-500">Trigger:</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-950 text-amber-400 border border-zinc-800">
                      {r.triggerPattern}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {r.replyText ? (
                      r.replyText
                    ) : (
                      <span className="text-cyan-400 flex items-center gap-1 font-mono text-[11px]">
                        <Brain className="w-3.5 h-3.5" /> AI Gemini Dynamic Reply
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-zinc-800">
                  <button
                    id={`edit-rule-${r.id}`}
                    onClick={() => handleOpenEditModal(r)}
                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id={`del-rule-${r.id}`}
                    onClick={() => handleDeleteRule(r.id)}
                    className="p-1.5 rounded bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-800/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI Persona Settings & Rule Simulator */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Persona Prompt Editor */}
          {config && (
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-emerald-400" />
                  Groq LLaMA-3.1 Persona
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-mono">
                  temp: {config.groqTemperature ?? 0.4}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Bot System Instructions & Tone:
                </label>
                <textarea
                  id="ai-system-prompt-input"
                  rows={4}
                  value={config.aiSystemPrompt}
                  onChange={(e) => handleToggleGlobal('aiSystemPrompt', e.target.value)}
                  placeholder="Set instructions for Groq LLaMA-3.1 automated agent..."
                  className="w-full p-2.5 rounded bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs text-zinc-200 resize-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-zinc-500">Model Engine:</span>
                  <div className="font-bold text-zinc-200 truncate">{config.groqModel || 'llama-3.1-8b-instant'}</div>
                </div>
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-zinc-500">Context Memory:</span>
                  <div className="font-bold text-emerald-400">Multi-Turn History</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1">
                <span className="text-zinc-500">Fast inference via api.groq.com</span>
                <span className="text-emerald-400 font-semibold">Auto-saved</span>
              </div>
            </div>
          )}

          {/* Test Simulator */}
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              Rule Match Simulator
            </h4>
            <p className="text-[11px] text-zinc-400">Type a sample incoming message to test trigger logic:</p>
            <div className="flex items-center gap-2">
              <input
                id="rule-test-input"
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="e.g. Hello, what is your price?"
                className="flex-1 px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none font-mono"
              />
              <button
                id="run-rule-test-btn"
                onClick={handleRunSimulator}
                className="px-3 py-1.5 rounded bg-emerald-500 text-zinc-950 font-bold text-xs shadow-[0_0_8px_rgba(34,197,94,0.3)]"
              >
                Test
              </button>
            </div>
            {testResult && (
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300">
                {testResult}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Form for Add/Edit Rule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
          <div className="w-full max-w-lg rounded-lg bg-zinc-900 border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              {editingRuleId ? 'Edit Auto-Reply Rule' : 'Create Auto-Reply Rule'}
            </h3>

            <form onSubmit={handleSaveRule} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Rule Name:</label>
                <input
                  id="modal-rule-name-input"
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. FAQ Pricing / Business Info"
                  className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Match Type:</label>
                  <select
                    id="modal-match-type-select"
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value as AutoReplyRule['matchType'])}
                    className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none font-mono"
                  >
                    <option value="contains">Contains Keyword</option>
                    <option value="exact">Exact Match</option>
                    <option value="startsWith">Starts With</option>
                    <option value="regex">Regular Expression</option>
                    <option value="ai">AI Dynamic Agent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Apply To:</label>
                  <select
                    id="modal-apply-to-select"
                    value={applyTo}
                    onChange={(e) => setApplyTo(e.target.value as AutoReplyRule['applyTo'])}
                    className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none font-mono"
                  >
                    <option value="all">All Chats &amp; Groups</option>
                    <option value="direct">Direct Chats Only</option>
                    <option value="groups">Groups Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Trigger Keywords (comma-separated):
                </label>
                <input
                  id="modal-trigger-input"
                  type="text"
                  required
                  value={triggerPattern}
                  onChange={(e) => setTriggerPattern(e.target.value)}
                  placeholder="e.g. price,cost,pricing"
                  className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none font-mono"
                />
              </div>

              {matchType !== 'ai' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Reply Message:
                  </label>
                  <textarea
                    id="modal-reply-input"
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Hello {sender}! Our pricing plans are listed on..."
                    className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none resize-none font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Available tags: {'{sender}'}, {'{time}'}, {'{date}'}, {'{message}'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  id="modal-cancel-btn"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="modal-save-rule-btn"
                  type="submit"
                  className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
