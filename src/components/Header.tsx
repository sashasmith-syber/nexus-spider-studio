import React from 'react';
import {
  Terminal,
  Database,
  ShieldCheck,
  History,
  Settings,
  Cpu,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'terminal' | 'explorer' | 'query' | 'history' | 'settings';
  setActiveTab: (tab: 'terminal' | 'explorer' | 'query' | 'history' | 'settings') => void;
  llmConnected: boolean;
  dbConnected: boolean;
  autoExecute: boolean;
  onResetDb: () => void;
  tableCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  llmConnected,
  dbConnected,
  autoExecute,
  onResetDb,
  tableCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-mono font-bold text-xl">
              🕸️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">Nexus Spider Agent</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Privacy-focused SQL assistant powered by local LLMs
              </p>
            </div>
          </div>

          {/* Status indicators */}
          <div className="hidden md:flex items-center space-x-3 text-xs">
            {/* Privacy Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span className="font-medium">100% Local / Zero Data Leak</span>
            </div>

            {/* DB Status */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border ${
                dbConnected
                  ? 'bg-blue-950/40 border-blue-800/40 text-blue-400'
                  : 'bg-red-950/40 border-red-800/40 text-red-400'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>SQLite ({tableCount} tables)</span>
            </div>

            {/* LLM Status */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border ${
                llmConnected
                  ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                  : 'bg-amber-950/40 border-amber-800/40 text-amber-400'
              }`}
              title={llmConnected ? 'Connected to LM Studio' : 'LM Studio offline (Smart offline synthesizer active)'}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{llmConnected ? 'LM Studio: Online' : 'LM Studio: Standalone'}</span>
            </div>

            {/* Auto execute warning */}
            {autoExecute && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                ⚡ Auto-Execute
              </span>
            )}
          </div>

          {/* Quick actions & settings */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onResetDb}
              title="Reset Database to Demo State"
              className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-md border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo DB</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              title="Configure LM Studio & Agent"
              className={`p-2 rounded-md border transition-colors ${
                activeTab === 'settings'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 -mb-px border-t border-slate-800/60">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeTab === 'terminal'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Interactive CLI (nexus&gt;)</span>
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeTab === 'explorer'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('query')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeTab === 'query'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Safety &amp; Query Workbench</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Query History</span>
          </button>
        </div>
      </div>
    </header>
  );
};
