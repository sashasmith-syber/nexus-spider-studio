import React, { useState, useEffect, useRef } from 'react';
import { NexusSpiderAgent } from './services/agent';
import { Header } from './components/Header';
import { TerminalView } from './components/TerminalView';
import { DatabaseExplorer } from './components/DatabaseExplorer';
import { QueryWorkbench } from './components/QueryWorkbench';
import { HistoryView } from './components/HistoryView';
import { SettingsModal } from './components/SettingsModal';
import { ShieldAlert, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'explorer' | 'query' | 'history' | 'settings'>('terminal');
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [llmConnected, setLlmConnected] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [tableCount, setTableCount] = useState(0);
  const [version, setVersion] = useState(0);

  // Maintain single agent instance
  const agentRef = useRef<NexusSpiderAgent | null>(null);

  if (!agentRef.current) {
    agentRef.current = new NexusSpiderAgent('database.db', 'http://localhost:1234/v1', false);
  }
  const agent = agentRef.current;

  const refreshState = () => {
    if (!agent) return;
    setTableCount(agent.listTables().length);
    setDbConnected(agent.dbManager.isConnected());
    setVersion((v) => v + 1);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await agent.initialize();
        if (!res.success) {
          setInitError(res.message);
        } else {
          setDbConnected(true);
          setLlmConnected(res.llmConnected);
          setTableCount(agent.listTables().length);
        }
      } catch (err: any) {
        setInitError(err?.message || 'Failed to initialize agent');
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  const handleResetDb = () => {
    if (confirm('Reset SQLite database to default demo schema and data?')) {
      agent.dbManager.resetDatabase(true);
      refreshState();
    }
  };

  const handleRunQueryInWorkbench = (query: string) => {
    setActiveTab('query');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-xl shadow-cyan-500/20 mx-auto animate-pulse">
            🕸️
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Nexus Spider Agent</h1>
          <p className="text-xs text-slate-400 font-mono">
            Initializing local SQLite WebAssembly engine &amp; security sandbox...
          </p>
          <div className="w-48 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-cyan-500 animate-[shimmer_1.5s_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="p-6 bg-red-950/40 border border-red-800/60 rounded-xl max-w-md space-y-3">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Initialization Error</h2>
          <p className="text-xs text-red-300 font-mono">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        llmConnected={llmConnected}
        dbConnected={dbConnected}
        autoExecute={agent.autoExecute}
        onResetDb={handleResetDb}
        tableCount={tableCount}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'terminal' && (
          <TerminalView
            key={`term-${version}`}
            agent={agent}
            onRefreshExplorer={refreshState}
          />
        )}

        {activeTab === 'explorer' && (
          <DatabaseExplorer
            key={`exp-${version}`}
            agent={agent}
          />
        )}

        {activeTab === 'query' && (
          <QueryWorkbench
            key={`query-${version}`}
            agent={agent}
            onRefreshExplorer={refreshState}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            key={`hist-${version}`}
            agent={agent}
            onRunQuery={handleRunQueryInWorkbench}
            onRefresh={refreshState}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            agent={agent}
            onClose={() => setActiveTab('terminal')}
            onRefreshAll={refreshState}
          />
        )}
      </main>

      {/* Sub-footer banner */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-6 text-center text-[11px] text-slate-500 font-mono">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>🔒 Privacy Architecture: Zero data leaves client environment</span>
          <span>&bull;</span>
          <span>🛡️ SQL Injection Prevention Active</span>
          <span>&bull;</span>
          <span>🤖 LM Studio / Local LLM Compatible</span>
        </div>
      </footer>
    </div>
  );
};
