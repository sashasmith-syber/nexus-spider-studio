export interface TableColumn {
  cid: number;
  name: string;
  type: string;
  notnull: boolean;
  default_value: any;
  pk: boolean;
}

export interface QueryHistoryItem {
  id: string;
  command: string;
  query: string;
  executed: boolean;
  timestamp: string;
  durationMs?: number;
  error?: string;
  rowCount?: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    firstWord?: string;
    hasDangerousKeyword?: boolean;
    dangerousKeyword?: string;
    hasMultipleStatements?: boolean;
    isDropDatabaseOrSchema?: boolean;
  };
}

export interface ExecutionResult {
  success: boolean;
  results?: Record<string, any>[] | null;
  message: string;
  rowsAffected?: number;
  durationMs?: number;
}

export interface LLMConfig {
  baseUrl: string;
  timeout: number;
  model: string;
  temperature: number;
  maxTokens: number;
  useLocalFallbackWhenOffline: boolean;
}

export interface TerminalEntry {
  id: string;
  type: 'banner' | 'user' | 'agent' | 'system' | 'query' | 'result' | 'error' | 'prompt';
  content: string;
  metadata?: {
    query?: string;
    results?: Record<string, any>[];
    waitingForConfirmation?: boolean;
    commandToConfirm?: string;
  };
  timestamp: string;
}
