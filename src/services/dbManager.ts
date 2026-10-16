import initSqlJs, { Database } from 'sql.js';
import { TableColumn, ValidationResult, ExecutionResult } from '../types';

export class DatabaseManager {
  // Dangerous SQL keywords blocked by Nexus Spider Agent
  public static readonly DANGEROUS_KEYWORDS = [
    'DROP DATABASE',
    'DROP SCHEMA',
    'TRUNCATE',
    'GRANT',
    'REVOKE',
    'ALTER SYSTEM',
  ];

  // Allowed SQL operations
  public static readonly ALLOWED_OPERATIONS = [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'CREATE',
    'ALTER',
    'DROP',
  ];

  public dbPath: string;
  private db: Database | null = null;
  private SQL: any = null;
  private isInitialized = false;

  constructor(dbPath: string = 'database.db') {
    this.dbPath = dbPath;
  }

  public async initialize(): Promise<boolean> {
    if (this.isInitialized && this.db) {
      return true;
    }
    try {
      this.SQL = await initSqlJs({
        locateFile: (file) => `/${file}`,
      });
      // Check if we have saved database in localStorage
      const savedDb = localStorage.getItem(`nexus_db_${this.dbPath}`);
      if (savedDb) {
        try {
          const binary = Uint8Array.from(atob(savedDb), (c) => c.charCodeAt(0));
          this.db = new this.SQL.Database(binary);
        } catch {
          this.db = new this.SQL.Database();
          this.seedDemoData();
        }
      } else {
        this.db = new this.SQL.Database();
        this.seedDemoData();
      }
      this.isInitialized = true;
      return true;
    } catch (e) {
      console.error('Failed to initialize sql.js:', e);
      return false;
    }
  }

  public isConnected(): boolean {
    return this.isInitialized && this.db !== null;
  }

  public saveToStorage(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      let binary = '';
      for (let i = 0; i < data.byteLength; i++) {
        binary += String.fromCharCode(data[i]);
      }
      localStorage.setItem(`nexus_db_${this.dbPath}`, btoa(binary));
    } catch (e) {
      console.warn('Failed to persist database to localStorage', e);
    }
  }

  /**
   * Validate SQL query for safety.
   * Matches Python DatabaseManager.validate_query exactly.
   */
  public validateQuery(query: string): ValidationResult {
    if (!query || !query.trim()) {
      return { isValid: false, error: 'Query is empty' };
    }

    const queryUpper = query.toUpperCase();

    // Check for dangerous keywords
    for (const keyword of DatabaseManager.DANGEROUS_KEYWORDS) {
      if (queryUpper.includes(keyword)) {
        return {
          isValid: false,
          error: `Dangerous operation detected: ${keyword}`,
          details: {
            hasDangerousKeyword: true,
            dangerousKeyword: keyword,
          },
        };
      }
    }

    // Check if query starts with an allowed operation
    const queryStripped = query.trim();
    const firstWord = queryStripped.split(/\s+/)[0]?.toUpperCase() || '';

    if (!DatabaseManager.ALLOWED_OPERATIONS.includes(firstWord)) {
      return {
        isValid: false,
        error: `Operation not allowed: ${firstWord}`,
        details: { firstWord },
      };
    }

    // Additional validation for DROP operations
    if (firstWord === 'DROP') {
      if (queryUpper.includes('DROP DATABASE') || queryUpper.includes('DROP SCHEMA')) {
        return {
          isValid: false,
          error: 'Cannot drop database or schema',
          details: { isDropDatabaseOrSchema: true },
        };
      }
    }

    // Check for multiple statements (SQL injection prevention)
    // Matches Python: if ';' in query.rstrip(';'):
    const trimmedRightSemicolon = query.trim().replace(/;+\s*$/, '');
    if (trimmedRightSemicolon.includes(';')) {
      return {
        isValid: false,
        error: 'Multiple statements not allowed',
        details: { hasMultipleStatements: true },
      };
    }

    return {
      isValid: true,
      details: {
        firstWord,
        hasDangerousKeyword: false,
        hasMultipleStatements: false,
      },
    };
  }

  /**
   * Execute a SQL query with validation.
   */
  public executeQuery(query: string, parameters?: any[], fetch: boolean = true): ExecutionResult {
    const startTime = performance.now();
    if (!this.db) {
      return { success: false, message: 'Not connected to database', results: null };
    }

    const validation = this.validateQuery(query);
    if (!validation.isValid) {
      return {
        success: false,
        message: `Invalid query: ${validation.error}`,
        results: null,
      };
    }

    try {
      const isSelect = query.trim().toUpperCase().startsWith('SELECT');

      if (fetch && isSelect) {
        const stmt = this.db.prepare(query);
        if (parameters && parameters.length > 0) {
          stmt.bind(parameters);
        }

        const rows: Record<string, any>[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();

        const duration = Math.round(performance.now() - startTime);
        return {
          success: true,
          results: rows,
          message: `Query returned ${rows.length} row${rows.length === 1 ? '' : 's'}.`,
          durationMs: duration,
        };
      } else {
        // Non-select query
        if (parameters && parameters.length > 0) {
          this.db.run(query, parameters);
        } else {
          this.db.run(query);
        }

        const rowsModified = this.db.getRowsModified();
        this.saveToStorage();
        const duration = Math.round(performance.now() - startTime);

        return {
          success: true,
          results: null,
          rowsAffected: rowsModified,
          message: `Query executed successfully. Rows affected: ${rowsModified}`,
          durationMs: duration,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Database error: ${err?.message || err}`,
        results: null,
      };
    }
  }

  /**
   * List all tables in the database.
   */
  public listTables(): string[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
      if (res.length > 0 && res[0].values) {
        return res[0].values.map((v) => String(v[0]));
      }
      return [];
    } catch (e) {
      console.error('Error listing tables:', e);
      return [];
    }
  }

  /**
   * Get detailed information about a table's columns.
   */
  public getTableInfo(tableName: string): TableColumn[] | null {
    if (!this.db) return null;
    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      console.error(`Invalid table name: ${tableName}`);
      return null;
    }

    try {
      const res = this.db.exec(`PRAGMA table_info(${tableName})`);
      if (res.length === 0 || !res[0].values) return [];

      return res[0].values.map((col: any[]) => ({
        cid: Number(col[0]),
        name: String(col[1]),
        type: String(col[2]),
        notnull: Boolean(col[3]),
        default_value: col[4],
        pk: Boolean(col[5]),
      }));
    } catch (e) {
      console.error('Error getting table info:', e);
      return null;
    }
  }

  /**
   * Get database schema information formatted string.
   */
  public getSchemaInfo(tableName?: string): string | null {
    if (!this.db) return null;

    try {
      if (tableName) {
        const stmt = this.db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?");
        stmt.bind([tableName]);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return (row.sql as string) || null;
        }
        stmt.free();
        return null;
      } else {
        const res = this.db.exec("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
        if (res.length === 0 || !res[0].values || res[0].values.length === 0) {
          return 'No tables found in database';
        }

        let schemaInfo = 'Database Schema:\n\n';
        for (const row of res[0].values) {
          schemaInfo += `Table: ${row[0]}\n${row[1]}\n\n`;
        }
        return schemaInfo.trim();
      }
    } catch (e) {
      console.error('Error getting schema:', e);
      return null;
    }
  }

  /**
   * Seed sample data matching demo_without_llm.py
   */
  public seedDemoData(): void {
    if (!this.db) return;

    try {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            age INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER DEFAULT 0,
            category TEXT
        );
      `);

      // Check if users empty
      const userCountRes = this.db.exec('SELECT COUNT(*) as count FROM users');
      const userCount = Number(userCountRes[0]?.values[0]?.[0] || 0);

      if (userCount === 0) {
        const users = [
          ['Alice Smith', 'alice@example.com', 28],
          ['Bob Johnson', 'bob@example.com', 35],
          ['Charlie Brown', 'charlie@example.com', 42],
          ['Diana Prince', 'diana@example.com', 30],
          ['Eve Wilson', 'eve@example.com', 25],
        ];

        for (const u of users) {
          this.db.run('INSERT INTO users (name, email, age) VALUES (?, ?, ?)', u);
        }
      }

      const prodCountRes = this.db.exec('SELECT COUNT(*) as count FROM products');
      const prodCount = Number(prodCountRes[0]?.values[0]?.[0] || 0);

      if (prodCount === 0) {
        const products = [
          ['Laptop', 999.99, 10, 'Electronics'],
          ['Mouse', 25.5, 100, 'Electronics'],
          ['Keyboard', 75.0, 50, 'Electronics'],
          ['Monitor', 299.99, 25, 'Electronics'],
          ['Desk Chair', 199.99, 15, 'Furniture'],
          ['Standing Desk', 449.99, 8, 'Furniture'],
        ];

        for (const p of products) {
          this.db.run('INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)', p);
        }
      }

      this.saveToStorage();
    } catch (e) {
      console.error('Error seeding demo data:', e);
    }
  }

  /**
   * Reset database to initial empty or seed state
   */
  public resetDatabase(seed: boolean = true): void {
    if (!this.SQL) return;
    this.db = new this.SQL.Database();
    if (seed) {
      this.seedDemoData();
    }
    this.saveToStorage();
  }

  /**
   * Export the SQLite binary file
   */
  public exportDatabaseBinary(): Uint8Array | null {
    if (!this.db) return null;
    return this.db.export();
  }

  /**
   * Import SQLite binary file
   */
  public importDatabaseBinary(data: Uint8Array): boolean {
    if (!this.SQL) return false;
    try {
      this.db = new this.SQL.Database(data);
      this.saveToStorage();
      return true;
    } catch (e) {
      console.error('Error importing database:', e);
      return false;
    }
  }
}
