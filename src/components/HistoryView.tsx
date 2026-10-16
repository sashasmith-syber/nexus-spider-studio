import React, { useState } from 'react';
import { NexusSpiderAgent } from '../services/agent';
import { QueryHistoryItem } from '../types';
import {
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Trash2,
  RotateCcw,
  Check,
  Search,
} from 'lucide-react';

interface HistoryViewProps {
  agent: NexusSpiderAgent;
  onRunQuery: (query: string) => void;
  onRefresh: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ agent, onRunQuery, onRefresh }) => {
  const [filter, setFilter] = useState<'all' | 'executed' | 'unexecuted'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const history = agent.getConversationHistory();

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear conversation history?')) {
      agent.clearHistory();
      onRefresh();
    }
  };

  const filteredHistory = history
    .slice()
    .reverse()
    .filter((item) => {
      if (filter === 'executed' && !item.executed) return false;
      if (filter === 'unexecuted' && item.executed) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.command.toLowerCase().includes(q) || item.query.toLowerCase().includes(q);
      }
      return true;
    });

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Top Header & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Conversation &amp; Query History</h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit log of all natural language prompts, generated SQL queries, and direct executions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter tabs */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md transition ${
                filter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setFilter('executed')}
              className={`px-3 py-1.5 rounded-md transition ${
                filter === 'executed'
                  ? 'bg-slate-800 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Executed ({history.filter((h) => h.executed).length})
            </button>
            <button
              onClick={() => setFilter('unexecuted')}
              className={`px-3 py-1.5 rounded-md transition ${
                filter === 'unexecuted'
                  ? 'bg-slate-800 text-amber-400 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Drafts ({history.filter((h) => !h.executed).length})
            </button>
          </div>

          <button
            onClick={handleClear}
            className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-950/30 border border-slate-800 transition"
            title="Clear History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search conversation history or SQL queries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
        />
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
            {history.length === 0
              ? 'No conversation history recorded yet. Interact with the CLI or generate queries!'
              : 'No history records match the current filter.'}
          </div>
        ) : (
          filteredHistory.map((item: QueryHistoryItem) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.executed ? (
                    <span className="flex items-center space-x-1 text-xs font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>EXECUTED</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-xs font-mono font-medium text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                      <Circle className="w-3.5 h-3.5" />
                      <span>GENERATED ONLY</span>
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400">&bull; {item.timestamp}</span>
                  {item.rowCount !== undefined && (
                    <span className="text-xs font-mono text-slate-400">
                      &bull; {item.rowCount} row{item.rowCount === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleCopy(item.id, item.query)}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition text-xs flex items-center space-x-1"
                    title="Copy SQL"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => onRunQuery(item.query)}
                    className="p-1.5 text-cyan-400 hover:text-cyan-300 rounded hover:bg-cyan-950/60 transition text-xs flex items-center space-x-1"
                    title="Run Query in Workbench"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-mono">Run</span>
                  </button>
                </div>
              </div>

              {/* Natural Language Prompt */}
              <div className="text-xs font-medium text-slate-200">
                <span className="text-cyan-400 font-mono mr-2">Prompt:</span>
                <span>{item.command}</span>
              </div>

              {/* SQL Query */}
              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-amber-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {item.query}
              </pre>

              {item.error && (
                <div className="text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-900/40 font-mono">
                  {item.error}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
