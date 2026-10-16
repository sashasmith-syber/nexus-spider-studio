import React, { useState, useRef, useEffect } from 'react';
import { NexusSpiderAgent } from '../services/agent';
import { TerminalEntry } from '../types';
import { Play, Sparkles, Send, Trash2, HelpCircle } from 'lucide-react';

interface TerminalViewProps {
  agent: NexusSpiderAgent;
  onRefreshExplorer: () => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ agent, onRefreshExplorer }) => {
  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      id: 'init-banner',
      type: 'banner',
      content: `╔═══════════════════════════════════════════════════════════╗
║       Nexus Spider Agent - Database Assistant             ║
║  Privacy-focused SQL agent powered by local LLMs          ║
╚═══════════════════════════════════════════════════════════╝`,
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'init-help-hint',
      type: 'system',
      content: 'Type natural language commands to generate SQL, or /help for available slash commands.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [localHistory, setLocalHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    query: string;
    command: string;
  } | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, isProcessing, pendingConfirmation]);

  const addEntry = (entry: Omit<TerminalEntry, 'id' | 'timestamp'>) => {
    const newEntry: TerminalEntry = {
      ...entry,
      id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setEntries((prev) => [...prev, newEntry]);
  };

  const executePendingQuery = (confirm: boolean) => {
    if (!pendingConfirmation) return;
    const { query } = pendingConfirmation;
    setPendingConfirmation(null);

    if (!confirm) {
      addEntry({
        type: 'system',
        content: 'Execution cancelled by user.',
      });
      return;
    }

    addEntry({
      type: 'system',
      content: `Executing query: ${query}`,
    });

    const res = agent.executeQuery(query);
    onRefreshExplorer();

    if (res.success) {
      if (res.results) {
        addEntry({
          type: 'result',
          content: formatResults(res.results),
          metadata: { results: res.results },
        });
      } else {
        addEntry({
          type: 'result',
          content: res.message,
        });
      }
    } else {
      addEntry({
        type: 'error',
        content: `Error: ${res.message}`,
      });
    }
  };

  const formatResults = (results: Record<string, any>[]): string => {
    if (!results || results.length === 0) {
      return 'No results found.';
    }
    const lines: string[] = ['Results:'];
    results.forEach((row, idx) => {
      lines.push(`${idx + 1}. ${JSON.stringify(row, null, 2)}`);
    });
    lines.push(`\nTotal rows: ${results.length}`);
    return lines.join('\n');
  };

  const handleSlashCommand = (cmd: string) => {
    const parts = cmd.split(/\s+/);
    const mainCmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();

    switch (mainCmd) {
      case '/help':
        addEntry({
          type: 'system',
          content: `Available Commands:
  - Type natural language queries to generate SQL
  - /execute <query> - Execute a SQL query directly
  - /schema [table] - Show database schema (optionally for specific table)
  - /tables - List all tables in the database
  - /info <table> - Show detailed information about a table
  - /history - Show conversation history
  - /clear - Clear conversation history
  - /help - Show this help message
  - /quit or /exit - Reset terminal session

Examples:
  > Show me all users
  > Users older than 30
  > Products under $100
  > Top 5 most expensive products
  > Create a table called products with id, name, and price columns
  > Insert a new user with name John and email john@example.com
  > /schema users
  > /execute SELECT * FROM users LIMIT 10`,
        });
        break;

      case '/tables': {
        const tables = agent.listTables();
        if (tables.length > 0) {
          addEntry({
            type: 'result',
            content: `Tables in database:\n${tables.map((t) => `  - ${t}`).join('\n')}`,
          });
        } else {
          addEntry({
            type: 'result',
            content: 'No tables found in database.',
          });
        }
        break;
      }

      case '/schema': {
        const schema = agent.getSchema(arg || undefined);
        if (schema) {
          addEntry({
            type: 'result',
            content: schema,
          });
        } else {
          addEntry({
            type: 'error',
            content: arg ? `No schema found for table '${arg}'` : 'No schema information available.',
          });
        }
        break;
      }

      case '/info': {
        if (!arg) {
          addEntry({
            type: 'error',
            content: 'Error: Please provide a table name. Example: /info users',
          });
          return;
        }
        const info = agent.getTableInfo(arg);
        if (info && info.length > 0) {
          const lines = [`Table: ${arg}`, '', 'Columns:'];
          info.forEach((col) => {
            const pk = col.pk ? ' (PRIMARY KEY)' : '';
            const nn = col.notnull ? ' NOT NULL' : '';
            const def = col.default_value ? ` DEFAULT ${col.default_value}` : '';
            lines.push(`  - ${col.name}: ${col.type}${nn}${def}${pk}`);
          });
          addEntry({
            type: 'result',
            content: lines.join('\n'),
          });
        } else {
          addEntry({
            type: 'error',
            content: `Table '${arg}' not found or error retrieving information.`,
          });
        }
        break;
      }

      case '/execute': {
        if (!arg) {
          addEntry({
            type: 'error',
            content: 'Error: Please provide a SQL query to execute. Example: /execute SELECT * FROM users',
          });
          return;
        }
        addEntry({
          type: 'system',
          content: `Executing query: ${arg}`,
        });
        const res = agent.executeQuery(arg);
        onRefreshExplorer();
        if (res.success) {
          if (res.results) {
            addEntry({
              type: 'result',
              content: formatResults(res.results),
              metadata: { results: res.results },
            });
          } else {
            addEntry({
              type: 'result',
              content: res.message,
            });
          }
        } else {
          addEntry({
            type: 'error',
            content: `Error: ${res.message}`,
          });
        }
        break;
      }

      case '/history': {
        const history = agent.getConversationHistory();
        if (history.length > 0) {
          const lines = ['Conversation History:'];
          history.forEach((h, i) => {
            const status = h.executed ? '✓' : '○';
            lines.push(`\n${i + 1}. [${status}] Command: ${h.command}\n   Query: ${h.query}`);
          });
          addEntry({
            type: 'result',
            content: lines.join('\n'),
          });
        } else {
          addEntry({
            type: 'result',
            content: 'No conversation history.',
          });
        }
        break;
      }

      case '/clear':
        agent.clearHistory();
        setEntries([
          {
            id: 'init-cleared',
            type: 'system',
            content: 'Conversation history and terminal cleared.',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        break;

      case '/quit':
      case '/exit':
        addEntry({
          type: 'system',
          content: 'Session closed. Type /help or enter a natural language command to resume.',
        });
        break;

      default:
        addEntry({
          type: 'error',
          content: `Unknown command: ${mainCmd}\nType /help for available commands.`,
        });
    }
  };

  const handleNaturalLanguage = async (command: string) => {
    setIsProcessing(true);
    addEntry({
      type: 'system',
      content: `Processing: ${command}\nGenerating SQL query...`,
    });

    try {
      const res = await agent.processCommand(command, false);

      if (res.query) {
        addEntry({
          type: 'query',
          content: `Generated Query:\n${res.query}`,
          metadata: { query: res.query },
        });

        // Check if query is valid
        const validation = agent.dbManager.validateQuery(res.query);
        if (!validation.isValid) {
          addEntry({
            type: 'error',
            content: `Invalid query: ${validation.error}`,
          });
          setIsProcessing(false);
          return;
        }

        if (agent.autoExecute) {
          addEntry({
            type: 'system',
            content: 'Auto-executing generated query...',
          });
          const execRes = agent.executeQuery(res.query);
          onRefreshExplorer();
          if (execRes.success) {
            if (execRes.results) {
              addEntry({
                type: 'result',
                content: formatResults(execRes.results),
                metadata: { results: execRes.results },
              });
            } else {
              addEntry({
                type: 'result',
                content: execRes.message,
              });
            }
          } else {
            addEntry({
              type: 'error',
              content: `Error: ${execRes.message}`,
            });
          }
        } else {
          // Ask user confirmation
          setPendingConfirmation({
            query: res.query,
            command,
          });
        }
      } else {
        addEntry({
          type: 'error',
          content: `Error: ${res.message || 'Failed to generate SQL query'}`,
        });
      }
    } catch (err: any) {
      addEntry({
        type: 'error',
        content: `Error: ${err?.message || err}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    // Check if we are waiting for confirmation (y/n)
    if (pendingConfirmation) {
      const lower = trimmed.toLowerCase();
      if (lower === 'y' || lower === 'yes') {
        addEntry({ type: 'user', content: trimmed });
        executePendingQuery(true);
      } else if (lower === 'n' || lower === 'no') {
        addEntry({ type: 'user', content: trimmed });
        executePendingQuery(false);
      } else {
        addEntry({
          type: 'error',
          content: 'Please enter "y" to execute or "n" to cancel.',
        });
      }
      setInput('');
      return;
    }

    // Add to local history for up/down arrow recall
    setLocalHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    // Print user prompt
    addEntry({
      type: 'user',
      content: trimmed,
    });
    setInput('');

    if (trimmed.startsWith('/')) {
      handleSlashCommand(trimmed);
    } else {
      handleNaturalLanguage(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (localHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? localHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInput(localHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= localHistory.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIdx);
        setInput(localHistory[nextIdx]);
      }
    }
  };

  const quickChips = [
    'Show me all users',
    'Users older than 30',
    'Top 5 most expensive products',
    'Products under $100',
    'Total inventory value',
    'Products by category',
    '/tables',
    '/schema',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-mono">
      {/* Terminal Title Bar */}
      <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          <span className="text-xs text-slate-400 font-semibold ml-2">nexus-spider-agent@localhost:~/cli</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleSlashCommand('/help')}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Commands</span>
          </button>
          <button
            onClick={() => handleSlashCommand('/clear')}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/60 flex items-center space-x-2 overflow-x-auto text-xs">
        <span className="text-slate-400 flex items-center space-x-1 whitespace-nowrap text-[11px]">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Quick:</span>
        </span>
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInput(chip);
              inputRef.current?.focus();
            }}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950/80 hover:text-cyan-300 text-slate-300 border border-slate-700/80 hover:border-cyan-700/60 text-xs whitespace-nowrap transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-xs sm:text-sm">
        {entries.map((entry) => {
          if (entry.type === 'banner') {
            return (
              <pre
                key={entry.id}
                className="text-cyan-400 whitespace-pre font-bold text-xs sm:text-sm leading-tight select-none opacity-95"
              >
                {entry.content}
              </pre>
            );
          }

          if (entry.type === 'user') {
            return (
              <div key={entry.id} className="flex items-start space-x-2 text-slate-200">
                <span className="text-cyan-400 font-bold select-none">nexus&gt;</span>
                <span className="font-medium text-white">{entry.content}</span>
              </div>
            );
          }

          if (entry.type === 'system') {
            return (
              <div key={entry.id} className="text-slate-400 whitespace-pre-wrap pl-4 border-l-2 border-slate-700 py-0.5">
                {entry.content}
              </div>
            );
          }

          if (entry.type === 'query') {
            return (
              <div
                key={entry.id}
                className="my-2 p-3 bg-slate-900/90 rounded-lg border border-cyan-800/60 shadow-inner"
              >
                <div className="text-[11px] text-cyan-400 uppercase tracking-wider font-semibold mb-1 flex items-center justify-between">
                  <span>Generated SQL Query</span>
                  <span className="text-slate-400 lowercase">{entry.timestamp}</span>
                </div>
                <pre className="text-amber-300 font-bold text-xs sm:text-sm whitespace-pre-wrap overflow-x-auto">
                  {entry.content.replace(/^Generated Query:\n/, '')}
                </pre>
              </div>
            );
          }

          if (entry.type === 'result') {
            return (
              <div
                key={entry.id}
                className="my-2 p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-slate-200 overflow-x-auto"
              >
                <pre className="whitespace-pre-wrap text-emerald-400/90 leading-relaxed text-xs sm:text-sm">
                  {entry.content}
                </pre>
              </div>
            );
          }

          if (entry.type === 'error') {
            return (
              <div
                key={entry.id}
                className="my-1.5 p-2.5 bg-red-950/40 rounded-lg border border-red-800/60 text-red-300 text-xs sm:text-sm"
              >
                {entry.content}
              </div>
            );
          }

          return null;
        })}

        {/* Processing loader */}
        {isProcessing && (
          <div className="flex items-center space-x-2 text-cyan-400 pl-4 py-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
            <span className="animate-pulse">Orchestrating agent &amp; analyzing database schema...</span>
          </div>
        )}

        {/* Pending Confirmation prompt */}
        {pendingConfirmation && (
          <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-lg space-y-3 my-2">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-semibold text-xs sm:text-sm">
                Execute this query? (y/n):
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => executePendingQuery(true)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs flex items-center space-x-1 transition shadow"
                >
                  <Play className="w-3 h-3" />
                  <span>Execute [y]</span>
                </button>
                <button
                  onClick={() => executePendingQuery(false)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-xs transition"
                >
                  Cancel [n]
                </button>
              </div>
            </div>
            <pre className="text-xs text-amber-200/90 font-mono bg-slate-950 p-2 rounded border border-amber-900/40">
              {pendingConfirmation.query}
            </pre>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Input Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 p-3 sm:p-4 border-t border-slate-800 flex items-center space-x-3"
      >
        <div className="text-cyan-400 font-bold select-none text-sm sm:text-base flex items-center space-x-1">
          <span>nexus&gt;</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            pendingConfirmation
              ? 'Type "y" to execute or "n" to cancel...'
              : 'Enter natural language prompt (e.g. "Show me all users") or /help...'
          }
          disabled={isProcessing}
          className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition font-mono"
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-xs sm:text-sm flex items-center space-x-1.5 transition shadow-lg shadow-cyan-600/20"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
