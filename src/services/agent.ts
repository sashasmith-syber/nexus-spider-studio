import { DatabaseManager } from './dbManager';
import { LMStudioClient } from './llmClient';
import { QueryHistoryItem, ExecutionResult } from '../types';

export interface ProcessCommandResult {
  command: string;
  success: boolean;
  message: string;
  query: string | null;
  results: Record<string, any>[] | null;
  source?: 'lm-studio' | 'local-engine';
  executed: boolean;
}

export class NexusSpiderAgent {
  public dbManager: DatabaseManager;
  public llmClient: LMStudioClient;
  public autoExecute: boolean;
  public conversationHistory: QueryHistoryItem[] = [];

  constructor(
    dbPath: string = 'database.db',
    lmStudioUrl: string = 'http://localhost:1234/v1',
    autoExecute: boolean = false
  ) {
    this.dbManager = new DatabaseManager(dbPath);
    this.llmClient = new LMStudioClient({ baseUrl: lmStudioUrl });
    this.autoExecute = autoExecute;
    this.loadHistory();
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('nexus_conversation_history');
      if (stored) {
        this.conversationHistory = JSON.parse(stored);
      }
    } catch {
      this.conversationHistory = [];
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem('nexus_conversation_history', JSON.stringify(this.conversationHistory));
    } catch {
      // ignore
    }
  }

  public async initialize(): Promise<{ success: boolean; message: string; llmConnected: boolean }> {
    const dbSuccess = await this.dbManager.initialize();
    if (!dbSuccess) {
      return { success: false, message: 'Failed to initialize database', llmConnected: false };
    }

    const llmConnected = await this.llmClient.checkConnection();

    return {
      success: true,
      message: llmConnected
        ? 'Agent initialized successfully. Connected to LM Studio and SQLite database.'
        : 'Agent initialized. Database ready (LM Studio not detected at configured URL; local offline synthesizer active).',
      llmConnected,
    };
  }

  public async processCommand(
    command: string,
    execute?: boolean
  ): Promise<ProcessCommandResult> {
    const result: ProcessCommandResult = {
      command,
      success: false,
      message: '',
      query: null,
      results: null,
      executed: false,
    };

    // 1. Get database schema for context
    const schemaInfo = this.dbManager.getSchemaInfo();

    // 2. Generate SQL query via LLM client
    const genResult = await this.llmClient.generateSqlQuery(command, schemaInfo);

    if (!genResult || !genResult.query) {
      result.message = 'Failed to generate SQL query';
      return result;
    }

    result.query = genResult.query;
    result.source = genResult.source;

    // 3. Validate query
    const validation = this.dbManager.validateQuery(result.query);
    if (!validation.isValid) {
      result.message = `Invalid query: ${validation.error}`;
      return result;
    }

    // 4. Determine if we should execute
    const shouldExecute = execute !== undefined ? execute : this.autoExecute;
    result.executed = shouldExecute;

    if (shouldExecute) {
      const execResult = this.dbManager.executeQuery(result.query);
      result.success = execResult.success;
      result.results = execResult.results || null;
      result.message = execResult.message;
    } else {
      result.success = true;
      result.message = 'Query generated (not executed). Review and execute manually if desired.';
    }

    // 5. Store in conversation history
    this.conversationHistory.push({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      command,
      query: result.query,
      executed: shouldExecute,
      timestamp: new Date().toLocaleTimeString(),
      rowCount: result.results ? result.results.length : undefined,
    });
    this.saveHistory();

    return result;
  }

  public executeQuery(query: string): ExecutionResult {
    const execResult = this.dbManager.executeQuery(query);
    
    // Add direct execution to history as well
    this.conversationHistory.push({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      command: `/execute ${query}`,
      query,
      executed: true,
      timestamp: new Date().toLocaleTimeString(),
      durationMs: execResult.durationMs,
      error: execResult.success ? undefined : execResult.message,
      rowCount: execResult.results ? execResult.results.length : execResult.rowsAffected,
    });
    this.saveHistory();

    return execResult;
  }

  public getSchema(tableName?: string): string | null {
    return this.dbManager.getSchemaInfo(tableName);
  }

  public listTables(): string[] {
    return this.dbManager.listTables();
  }

  public getTableInfo(tableName: string) {
    return this.dbManager.getTableInfo(tableName);
  }

  public getConversationHistory(): QueryHistoryItem[] {
    return this.conversationHistory;
  }

  public clearHistory(): void {
    this.conversationHistory = [];
    this.saveHistory();
  }
}
