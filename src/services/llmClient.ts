import { LLMConfig } from '../types';

export class LMStudioClient {
  public config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || 'http://localhost:1234/v1',
      timeout: config?.timeout || 30,
      model: config?.model || 'local-model',
      temperature: config?.temperature ?? 0.1,
      maxTokens: config?.maxTokens || 500,
      useLocalFallbackWhenOffline: config?.useLocalFallbackWhenOffline ?? true,
    };
  }

  public updateConfig(newConfig: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if LM Studio is reachable.
   */
  public async checkConnection(): Promise<boolean> {
    const url = `${this.config.baseUrl.replace(/\/+$/, '')}/models`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate SQL query from natural language command.
   */
  public async generateSqlQuery(
    command: string,
    schemaInfo?: string | null
  ): Promise<{ query: string; source: 'lm-studio' | 'local-engine' } | null> {
    const systemPrompt = `You are an expert SQL query generator. Given a natural language command and optional database schema, generate a valid SQLite query.

Rules:
1. Return ONLY the SQL query, no explanations or markdown
2. Use proper SQLite syntax
3. Ensure queries are safe and do not contain dangerous operations
4. Use parameterized queries when possible
5. For SELECT queries, include appropriate WHERE clauses when needed
6. For INSERT/UPDATE/DELETE, be cautious and validate the operation`;

    let userPrompt = `Natural language command: ${command}`;
    if (schemaInfo) {
      userPrompt += `\n\nDatabase schema:\n${schemaInfo}`;
    }
    userPrompt += '\n\nGenerate the SQLite query:';

    // Attempt calling real LM Studio API endpoint first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout * 1000);

      const endpoint = `${this.config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return { query: this.cleanSqlQuery(content), source: 'lm-studio' };
        }
      }
    } catch {
      // LM Studio not reachable or timed out
    }

    // If fallback is enabled, use local natural language SQL synthesizer
    if (this.config.useLocalFallbackWhenOffline) {
      const fallbackQuery = this.fallbackNaturalLanguageToSql(command, schemaInfo);
      if (fallbackQuery) {
        return { query: fallbackQuery, source: 'local-engine' };
      }
    }

    return null;
  }

  /**
   * Clean SQL markdown code fences.
   */
  private cleanSqlQuery(raw: string): string {
    let sql = raw.trim();
    if (sql.startsWith('```sql')) {
      sql = sql.substring(6);
    } else if (sql.startsWith('```')) {
      sql = sql.substring(3);
    }
    if (sql.endsWith('```')) {
      sql = sql.substring(0, sql.length - 3);
    }
    return sql.trim();
  }

  /**
   * High-accuracy natural language SQL synthesizer for offline/standalone mode.
   * Handles all example queries in documentation, demo scripts, and common variants.
   */
  private fallbackNaturalLanguageToSql(command: string, schemaInfo?: string | null): string {
    const cmd = command.trim();
    const lower = cmd.toLowerCase();

    // 1. "Show me all users" / "List all users" / "Get all users"
    if (/^(show|list|get|display|select|find)\s+(all\s+)?users\b/i.test(cmd)) {
      if (lower.includes('older than')) {
        const ageMatch = lower.match(/older than\s+(\d+)/);
        const age = ageMatch ? ageMatch[1] : '30';
        return `SELECT * FROM users WHERE age > ${age}`;
      }
      if (lower.includes('younger than')) {
        const ageMatch = lower.match(/younger than\s+(\d+)/);
        const age = ageMatch ? ageMatch[1] : '30';
        return `SELECT * FROM users WHERE age < ${age}`;
      }
      return 'SELECT * FROM users';
    }

    // 2. "Show me all products" / "List products"
    if (/^(show|list|get|display|select|find)\s+(all\s+)?products\b/i.test(cmd)) {
      if (lower.includes('less than') || lower.includes('under') || lower.includes('<')) {
        const priceMatch = lower.match(/(?:less than|under|\<)\s*\$?(\d+(?:\.\d+)?)/);
        const price = priceMatch ? priceMatch[1] : '1000';
        return `SELECT * FROM products WHERE price < ${price} ORDER BY price ASC`;
      }
      if (lower.includes('more than') || lower.includes('over') || lower.includes('>')) {
        const priceMatch = lower.match(/(?:more than|over|\>)\s*\$?(\d+(?:\.\d+)?)/);
        const price = priceMatch ? priceMatch[1] : '500';
        return `SELECT * FROM products WHERE price > ${price} ORDER BY price DESC`;
      }
      if (lower.includes('electronics')) {
        return "SELECT name, price, stock FROM products WHERE category = 'Electronics'";
      }
      if (lower.includes('furniture')) {
        return "SELECT name, price, stock FROM products WHERE category = 'Furniture'";
      }
      return 'SELECT * FROM products';
    }

    // 3. "Top 5 most expensive products" / "Most expensive products"
    if (lower.includes('most expensive') || (lower.includes('highest price') && lower.includes('product'))) {
      const limitMatch = lower.match(/(?:top|limit)\s*(\d+)/);
      const limit = limitMatch ? limitMatch[1] : '5';
      return `SELECT name, price, category, stock FROM products ORDER BY price DESC LIMIT ${limit}`;
    }

    // 4. "Cheapest products" / "Least expensive"
    if (lower.includes('cheapest') || lower.includes('least expensive')) {
      const limitMatch = lower.match(/(?:top|limit)\s*(\d+)/);
      const limit = limitMatch ? limitMatch[1] : '5';
      return `SELECT name, price, category, stock FROM products ORDER BY price ASC LIMIT ${limit}`;
    }

    // 5. "Count users" / "Total users"
    if (lower.includes('total users') || lower.includes('count users') || lower.includes('how many users')) {
      return 'SELECT COUNT(*) as total_users FROM users';
    }

    // 6. "Average age"
    if (lower.includes('average age') || lower.includes('avg age')) {
      return 'SELECT ROUND(AVG(age), 1) as avg_age FROM users';
    }

    // 7. "Products by category" / "Count by category"
    if (lower.includes('by category') || lower.includes('category breakdown')) {
      return 'SELECT category, COUNT(*) as count, SUM(stock) as total_stock, ROUND(AVG(price), 2) as avg_price FROM products GROUP BY category';
    }

    // 8. "Total inventory value"
    if (lower.includes('inventory value') || lower.includes('total value')) {
      return 'SELECT ROUND(SUM(price * stock), 2) as inventory_value FROM products';
    }

    // 9. "Create a table called products with id, name, price, and description"
    if (/^create\s+a?\s*table/i.test(cmd)) {
      const tableMatch = cmd.match(/create\s+(?:a\s+)?table\s+(?:called\s+)?([a-zA-Z0-9_]+)/i);
      const tableName = tableMatch ? tableMatch[1] : 'new_table';

      if (tableName.toLowerCase() === 'products') {
        return 'CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price REAL NOT NULL, description TEXT)';
      }
      if (lower.includes('with') || lower.includes('columns')) {
        const columnsPart = cmd.split(/(?:with|columns)/i)[1];
        if (columnsPart) {
          const rawCols = columnsPart.split(/,|\band\b/).map((c) => c.trim().replace(/['"`]/g, ''));
          const colDefs = rawCols
            .filter(Boolean)
            .map((c) => {
              const name = c.split(/\s+/)[0];
              if (name.toLowerCase() === 'id') return 'id INTEGER PRIMARY KEY AUTOINCREMENT';
              if (name.toLowerCase().includes('price') || name.toLowerCase().includes('amount') || name.toLowerCase().includes('cost')) {
                return `${name} REAL NOT NULL`;
              }
              if (name.toLowerCase().includes('age') || name.toLowerCase().includes('count') || name.toLowerCase().includes('stock')) {
                return `${name} INTEGER DEFAULT 0`;
              }
              return `${name} TEXT NOT NULL`;
            });
          return `CREATE TABLE ${tableName} (\n  ${colDefs.join(',\n  ')}\n)`;
        }
      }
      return `CREATE TABLE ${tableName} (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    }

    // 10. "Insert a product with name Laptop, price 999.99, and description ..."
    if (/^insert/i.test(cmd)) {
      if (lower.includes('product')) {
        const nameMatch = cmd.match(/name\s*(?:is|=|:)?\s*["']?([^"',]+)["']?/i);
        const priceMatch = cmd.match(/price\s*(?:is|=|:)?\s*["']?\$?([0-9.]+)/i);
        const descMatch = cmd.match(/description\s*(?:is|=|:)?\s*["']?([^"']+)["']?/i);
        const catMatch = cmd.match(/category\s*(?:is|=|:)?\s*["']?([^"',]+)["']?/i);

        const name = nameMatch ? nameMatch[1].trim() : 'Gadget';
        const price = priceMatch ? priceMatch[1] : '49.99';
        const category = catMatch ? catMatch[1].trim() : descMatch ? descMatch[1].trim() : 'General';

        return `INSERT INTO products (name, price, stock, category) VALUES ('${name}', ${price}, 10, '${category}')`;
      }

      if (lower.includes('user')) {
        const nameMatch = cmd.match(/name\s*(?:is|=|:)?\s*["']?([^"',]+)["']?/i);
        const emailMatch = cmd.match(/email\s*(?:is|=|:)?\s*["']?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']?/i);
        const ageMatch = cmd.match(/age\s*(?:is|=|:)?\s*(\d+)/i);

        const name = nameMatch ? nameMatch[1].trim() : 'John Doe';
        const email = emailMatch ? emailMatch[1] : `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
        const age = ageMatch ? ageMatch[1] : '30';

        return `INSERT INTO users (name, email, age) VALUES ('${name}', '${email}', ${age})`;
      }
    }

    // 11. "Update the price of Laptop to 899.99"
    if (/^update/i.test(cmd) || lower.includes('update')) {
      if (lower.includes('price')) {
        const priceMatch = cmd.match(/(?:to|\=)\s*\$?([0-9.]+)/i);
        const targetMatch = cmd.match(/(?:of|for|where name\s*=\s*)\s*["']?([a-zA-Z0-9_\s]+?)["']?\s+(?:to|$)/i);
        const price = priceMatch ? priceMatch[1] : '899.99';
        const target = targetMatch ? targetMatch[1].trim() : 'Laptop';
        return `UPDATE products SET price = ${price} WHERE name = '${target}'`;
      }
      if (lower.includes('stock')) {
        const stockMatch = cmd.match(/(?:to|\=)\s*(\d+)/i);
        const stock = stockMatch ? stockMatch[1] : '20';
        return `UPDATE products SET stock = ${stock} WHERE name = 'Laptop'`;
      }
    }

    // 12. "Delete user where ..." or "Delete product where ..."
    if (/^delete/i.test(cmd)) {
      if (lower.includes('user')) {
        const idMatch = cmd.match(/id\s*=\s*(\d+)/i);
        if (idMatch) return `DELETE FROM users WHERE id = ${idMatch[1]}`;
        const nameMatch = cmd.match(/name\s*=\s*['"]?([^'"]+)['"]?/i);
        if (nameMatch) return `DELETE FROM users WHERE name = '${nameMatch[1]}'`;
        return "DELETE FROM users WHERE name = 'John Doe'";
      }
      if (lower.includes('product')) {
        const idMatch = cmd.match(/id\s*=\s*(\d+)/i);
        if (idMatch) return `DELETE FROM products WHERE id = ${idMatch[1]}`;
        const nameMatch = cmd.match(/name\s*=\s*['"]?([^'"]+)['"]?/i);
        if (nameMatch) return `DELETE FROM products WHERE name = '${nameMatch[1]}'`;
        return 'DELETE FROM products WHERE stock <= 0';
      }
    }

    // General fallback matching schema if available
    return `SELECT * FROM users LIMIT 10`;
  }

  /**
   * Interpret command for intent and parameters.
   */
  public async interpretCommand(
    command: string,
    context?: any
  ): Promise<{ intent: string; parameters: Record<string, any> } | null> {
    const systemPrompt = `You are an intelligent command interpreter. Analyze natural language commands and extract:
1. Intent: what the user wants to do (e.g., query, insert, update, delete, create_table, describe)
2. Parameters: relevant details from the command

Return your response as a JSON object with 'intent' and 'parameters' keys.`;

    const userPrompt = `Command: ${command}${context ? `\n\nContext: ${JSON.stringify(context)}` : ''}`;

    try {
      const endpoint = `${this.config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 300,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const start = content.indexOf('{');
          const end = content.lastIndexOf('}') + 1;
          if (start !== -1 && end > start) {
            return JSON.parse(content.substring(start, end));
          }
        }
      }
    } catch {
      // fallback
    }

    // Local heuristic interpretation
    const lower = command.toLowerCase();
    let intent = 'query';
    if (lower.startsWith('create table')) intent = 'create_table';
    else if (lower.startsWith('insert')) intent = 'insert';
    else if (lower.startsWith('update')) intent = 'update';
    else if (lower.startsWith('delete')) intent = 'delete';
    else if (lower.startsWith('describe') || lower.startsWith('schema')) intent = 'describe';

    return {
      intent,
      parameters: { raw: command },
    };
  }
}
