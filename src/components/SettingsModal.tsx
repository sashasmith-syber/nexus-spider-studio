import React, { useState } from 'react';
import { NexusSpiderAgent } from '../services/agent';
import { LLMConfig } from '../types';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  Database,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  Shield,
} from 'lucide-react';

interface SettingsModalProps {
  agent: NexusSpiderAgent;
  onClose: () => void;
  onRefreshAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  agent,
  onClose,
  onRefreshAll,
}) => {
  const [config, setConfig] = useState<LLMConfig>({ ...agent.llmClient.config });
  const [autoExecute, setAutoExecute] = useState<boolean>(agent.autoExecute);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setStatusMessage('');
    agent.llmClient.updateConfig(config);
    try {
      const isOnline = await agent.llmClient.checkConnection();
      setConnectionStatus(isOnline);
      if (isOnline) {
        setStatusMessage('Connected to LM Studio successfully!');
      } else {
        setStatusMessage(
          'Could not reach LM Studio on the configured URL. Ensure LM Studio server is running on ' +
            config.baseUrl
        );
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    agent.llmClient.updateConfig(config);
    agent.autoExecute = autoExecute;
    onRefreshAll();
    onClose();
  };

  const handleExportDb = () => {
    const data = agent.dbManager.exportDatabaseBinary();
    if (!data) return;
    const blob = new Blob([data as any], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = agent.dbManager.dbPath || 'database.db';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const u8 = new Uint8Array(buffer);
        const ok = agent.dbManager.importDatabaseBinary(u8);
        if (ok) {
          alert('Database imported successfully!');
          onRefreshAll();
        } else {
          alert('Failed to parse SQLite database.');
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Agent &amp; LM Studio Configuration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure local model parameters, endpoints, and SQLite storage settings.
          </p>
        </div>

        {/* Section 1: LM Studio Connectivity */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>LM Studio API Connection</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-mono text-slate-300">API Base URL</label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="http://localhost:1234/v1"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500">
                Default LM Studio endpoint is <code className="text-slate-400">http://localhost:1234/v1</code>.
              </span>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 flex items-center justify-center space-x-2 transition"
              >
                {testingConnection ? (
                  <span>Testing...</span>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ping LM Studio</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
                connectionStatus
                  ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-800/40 text-amber-300'
              }`}
            >
              {connectionStatus ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Fallback Option */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-white">Smart Offline Synthesizer</div>
              <p className="text-[11px] text-slate-400">
                When LM Studio is unreachable, synthesizes valid SQLite queries locally for testing and demonstration.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.useLocalFallbackWhenOffline}
              onChange={(e) =>
                setConfig({ ...config, useLocalFallbackWhenOffline: e.target.checked })
              }
              className="w-4 h-4 accent-cyan-500"
            />
          </div>
        </div>

        {/* Section 2: Execution & Security Mode */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Execution Safety Rules</span>
          </h3>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5 max-w-xl">
              <div className="text-xs font-medium text-white flex items-center space-x-2">
                <span>Auto-Execute Queries</span>
                <span className="text-[10px] bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded border border-amber-800/50">
                  Caution
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                When disabled (default), the agent prompts for confirmation before executing generated queries.
                When enabled, valid queries are executed immediately.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoExecute}
              onChange={(e) => setAutoExecute(e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </div>
        </div>

        {/* Section 3: Database Management */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>SQLite Database Operations</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                if (confirm('Reset database to demo seed data (users and products tables)?')) {
                  agent.dbManager.resetDatabase(true);
                  onRefreshAll();
                  alert('Database reset to demo state.');
                }
              }}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition"
            >
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-200">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>Reset Demo Tables</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Re-seeds `users` and `products` from demo_without_llm.py
              </p>
            </button>

            <button
              onClick={handleExportDb}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition"
            >
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-200">
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Export SQLite (.db)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Download the real SQLite binary file to your computer
              </p>
            </button>

            <label className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition cursor-pointer">
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-200">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Import SQLite (.db)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Upload an existing SQLite database file
              </p>
              <input
                type="file"
                accept=".db,.sqlite,.sqlite3"
                onChange={handleImportDb}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition shadow"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
