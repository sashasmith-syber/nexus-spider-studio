import React, { useState, useEffect } from 'react';
import { NexusSpiderAgent } from '../services/agent';
import { TableColumn } from '../types';
import {
  Database,
  Table as TableIcon,
  Key,
  Search,
  Code,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface DatabaseExplorerProps {
  agent: NexusSpiderAgent;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({ agent }) => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [schemaSql, setSchemaSql] = useState<string>('');
  const [subTab, setSubTab] = useState<'data' | 'schema'>('data');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});
  const [newTableName, setNewTableName] = useState('');
  const [showNewTableModal, setShowNewTableModal] = useState(false);

  const loadTables = () => {
    const list = agent.listTables();
    setTables(list);
    if (list.length > 0 && (!selectedTable || !list.includes(selectedTable))) {
      setSelectedTable(list[0]);
    } else if (list.length === 0) {
      setSelectedTable('');
    }
  };

  const loadTableDetails = (tableName: string) => {
    if (!tableName) {
      setColumns([]);
      setRows([]);
      setSchemaSql('');
      return;
    }

    setIsLoading(true);
    try {
      const colInfo = agent.getTableInfo(tableName) || [];
      setColumns(colInfo);

      const ddl = agent.getSchema(tableName) || '';
      setSchemaSql(ddl);

      // Fetch rows
      const res = agent.dbManager.executeQuery(`SELECT * FROM ${tableName} LIMIT 200`);
      if (res.success && res.results) {
        setRows(res.results);
      } else {
        setRows([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableDetails(selectedTable);
    }
  }, [selectedTable]);

  const handleAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;

    const colNames = Object.keys(newRowData).filter((k) => newRowData[k].trim() !== '');
    if (colNames.length === 0) return;

    const values = colNames.map((k) => `'${newRowData[k].replace(/'/g, "''")}'`);
    const sql = `INSERT INTO ${selectedTable} (${colNames.join(', ')}) VALUES (${values.join(', ')})`;

    agent.executeQuery(sql);
    setShowAddModal(false);
    setNewRowData({});
    loadTableDetails(selectedTable);
  };

  const handleCreateNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTableName.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!name) return;

    const sql = `CREATE TABLE ${name} (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    agent.executeQuery(sql);
    setShowNewTableModal(false);
    setNewTableName('');
    loadTables();
    setSelectedTable(name);
  };

  const handleDropTable = (tableName: string) => {
    if (confirm(`Are you sure you want to drop table '${tableName}'? This cannot be undone.`)) {
      agent.executeQuery(`DROP TABLE ${tableName}`);
      loadTables();
    }
  };

  // Filter rows based on search
  const filteredRows = rows.filter((row) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(row).some((val) => String(val).toLowerCase().includes(q));
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
      {/* Left sidebar: Tables list */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h2 className="font-semibold text-sm text-slate-200">Database Tables</h2>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                loadTables();
                if (selectedTable) loadTableDetails(selectedTable);
              }}
              title="Refresh Tables"
              className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowNewTableModal(true)}
              title="Create New Table"
              className="p-1 text-cyan-400 hover:text-cyan-300 rounded hover:bg-cyan-950/50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tables list */}
        <div className="flex-1 space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
          {tables.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              No tables in database. Click + or reset demo data.
            </div>
          ) : (
            tables.map((t) => (
              <div
                key={t}
                onClick={() => setSelectedTable(t)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition text-xs font-mono ${
                  selectedTable === t
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/80'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <TableIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 shrink-0" />
                  <span className="truncate">{t}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDropTable(t);
                  }}
                  title="Drop table"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded hover:bg-red-950/30 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Database status footer */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500">
          SQLite engine: sql.js WebAssembly
        </div>
      </div>

      {/* Right panel: Details of selected table */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        {selectedTable ? (
          <>
            {/* Table Header Bar */}
            <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60">
              <div className="flex items-center space-x-3">
                <TableIcon className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-mono font-bold text-base text-white">{selectedTable}</h3>
                  <p className="text-xs text-slate-400">
                    {columns.length} columns &bull; {rows.length} records loaded
                  </p>
                </div>
              </div>

              {/* Sub-tabs and actions */}
              <div className="flex items-center space-x-2">
                <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                  <button
                    onClick={() => setSubTab('data')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                      subTab === 'data'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Data Grid</span>
                  </button>
                  <button
                    onClick={() => setSubTab('schema')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                      subTab === 'schema'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Schema / DDL</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    const initData: Record<string, string> = {};
                    columns.forEach((c) => {
                      if (!c.pk) initData[c.name] = '';
                    });
                    setNewRowData(initData);
                    setShowAddModal(true);
                  }}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg flex items-center space-x-1 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Row</span>
                </button>
              </div>
            </div>

            {/* SubTab: Data Grid */}
            {subTab === 'data' && (
              <div className="flex-1 flex flex-col p-4 space-y-3">
                {/* Search bar */}
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter records..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                    Showing {filteredRows.length} of {rows.length}
                  </span>
                </div>

                {/* Table Data Container */}
                <div className="flex-1 overflow-x-auto border border-slate-800 rounded-lg bg-slate-950 max-h-[calc(100vh-21rem)]">
                  {isLoading ? (
                    <div className="p-8 text-center text-slate-500 text-xs">Loading table records...</div>
                  ) : filteredRows.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs font-mono">
                      {rows.length === 0 ? 'Table is empty.' : 'No records match search filter.'}
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 border-b border-slate-800 sticky top-0 text-slate-300">
                        <tr>
                          {columns.map((col) => (
                            <th key={col.name} className="px-3.5 py-2.5 font-semibold whitespace-nowrap">
                              <div className="flex items-center space-x-1">
                                {col.pk && <Key className="w-3 h-3 text-amber-400" />}
                                <span>{col.name}</span>
                                <span className="text-[10px] text-slate-500 uppercase">({col.type})</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-900/60 transition-colors">
                            {columns.map((col) => (
                              <td
                                key={col.name}
                                className="px-3.5 py-2 text-slate-300 whitespace-nowrap truncate max-w-xs"
                              >
                                {row[col.name] !== null && row[col.name] !== undefined
                                  ? String(row[col.name])
                                  : <span className="text-slate-600 italic">null</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* SubTab: Schema / DDL */}
            {subTab === 'schema' && (
              <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-16rem)]">
                {/* Column details table */}
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                    Column Definitions
                  </h4>
                  <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-300">
                        <tr>
                          <th className="px-3 py-2">Column</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Primary Key</th>
                          <th className="px-3 py-2">Nullable</th>
                          <th className="px-3 py-2">Default</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {columns.map((col) => (
                          <tr key={col.name}>
                            <td className="px-3 py-2 font-semibold text-white flex items-center space-x-1.5">
                              {col.pk && <Key className="w-3 h-3 text-amber-400" />}
                              <span>{col.name}</span>
                            </td>
                            <td className="px-3 py-2 text-cyan-400">{col.type}</td>
                            <td className="px-3 py-2">
                              {col.pk ? (
                                <span className="text-amber-400 font-semibold">YES</span>
                              ) : (
                                <span className="text-slate-500">NO</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {col.notnull ? (
                                <span className="text-slate-400 font-medium">NOT NULL</span>
                              ) : (
                                <span className="text-slate-500">NULLABLE</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-400">
                              {col.default_value !== null ? String(col.default_value) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Raw SQL DDL */}
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                    Raw SQLite DDL
                  </h4>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {schemaSql || '-- No DDL available'}
                  </pre>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center text-slate-500 text-sm">
            Select a table from the sidebar to inspect records and schema.
          </div>
        )}
      </div>

      {/* Insert Row Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-semibold text-base text-white">Insert Record into '{selectedTable}'</h3>
            <form onSubmit={handleAddRow} className="space-y-3">
              {columns
                .filter((c) => !c.pk)
                .map((col) => (
                  <div key={col.name}>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      {col.name} ({col.type}) {col.notnull && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type="text"
                      value={newRowData[col.name] || ''}
                      onChange={(e) =>
                        setNewRowData({ ...newRowData, [col.name]: e.target.value })
                      }
                      required={col.notnull}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                ))}
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-md transition"
                >
                  Insert Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Table Modal */}
      {showNewTableModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="font-semibold text-base text-white">Create New Table</h3>
            <form onSubmit={handleCreateNewTable} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Table Name</label>
                <input
                  type="text"
                  placeholder="e.g. orders, categories"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Will create table with standard `id INTEGER PRIMARY KEY AUTOINCREMENT`, `name TEXT`, and `created_at TIMESTAMP`.
              </p>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTableModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-md transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
