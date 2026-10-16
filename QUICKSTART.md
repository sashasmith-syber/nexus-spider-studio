# Quick Start Guide

Get started with Nexus Spider Agent in minutes!

## Prerequisites

1. **Python 3.7+** - Check with `python --version`
2. **LM Studio** - Download from [https://lmstudio.ai/](https://lmstudio.ai/)
3. **A Language Model** - Download a model in LM Studio (recommended: Mistral, Llama 2, or CodeLlama)

## Installation Steps

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/sashasmith-syber/nexus_spider_agent.git
cd nexus_spider_agent

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Set Up LM Studio

1. Open LM Studio
2. Go to the "Search" tab and download a model (try "mistralai/Mistral-7B-Instruct")
3. Go to the "Local Server" tab
4. Click "Start Server" (it will run on http://localhost:1234 by default)
5. Ensure a model is loaded

### Step 3: Run Nexus Spider Agent

```bash
python -m nexus_spider_agent
```

That's it! You should see:

```
╔═══════════════════════════════════════════════════════════╗
║         Nexus Spider Agent - Database Assistant           ║
║    Privacy-focused SQL agent powered by local LLMs        ║
╚═══════════════════════════════════════════════════════════╝

Connected to database: database.db
LM Studio URL: http://localhost:1234/v1

Type /help for available commands.

nexus>
```

## Your First Commands

### 1. Create a Table

```
nexus> Create a table called users with id, name, and email columns
```

The agent will generate SQL and ask for confirmation:

```
Generated Query:
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
)

Execute this query? (y/n): y
```

### 2. Insert Data

```
nexus> Insert a user with name John Doe and email john@example.com
```

### 3. Query Data

```
nexus> Show me all users
```

### 4. Check Your Schema

```
nexus> /schema
```

## Common Commands

| Command | Description | Example |
|---------|-------------|---------|
| Natural language | Generate SQL from your description | `Show all users with name starting with J` |
| `/execute <sql>` | Run SQL directly | `/execute SELECT * FROM users LIMIT 5` |
| `/schema [table]` | View database schema | `/schema users` |
| `/tables` | List all tables | `/tables` |
| `/info <table>` | Table column details | `/info users` |
| `/history` | See command history | `/history` |
| `/help` | Show help | `/help` |
| `/quit` | Exit | `/quit` |

## Tips for Better Results

### 1. Be Specific
❌ "Show data"  
✅ "Show all users ordered by name"

### 2. Provide Context
❌ "Get the total"  
✅ "Get the total count of products in the products table"

### 3. Review Before Executing
Always review the generated SQL before confirming execution. The agent shows you exactly what it will run.

### 4. Use Schema Info
Let the agent know about your database structure:
```
nexus> /schema
nexus> Find all users who registered in the last 7 days
```

## Troubleshooting

### Error: "Failed to connect to LM Studio"

**Solution:**
1. Make sure LM Studio is running
2. Check that the local server is started in LM Studio
3. Verify a model is loaded
4. Try accessing http://localhost:1234 in your browser

### Queries Not Generating Correctly

**Solution:**
1. Try a code-capable model (CodeLlama, Mistral, etc.)
2. Be more specific in your request
3. Provide schema context first with `/schema`
4. Try rephrasing your request

### Permission Denied Errors

**Solution:**
1. Check that you have write permissions in the current directory
2. Try specifying a different database path: `python -m nexus_spider_agent --db ~/mydata.db`

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check out [example.py](example.py) for programmatic usage
- Review [SECURITY.md](SECURITY.md) for security best practices
- Explore the [config.example.json](config.example.json) for advanced configuration

## Example Session

Here's what a typical session looks like:

```
nexus> Create a table called products with id, name, price, and stock
Processing: Create a table called products with id, name, price, and stock
Generating SQL query...

Generated Query:
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0
)

Execute this query? (y/n): y
Query executed successfully. Rows affected: 0

nexus> Insert three products: Laptop 999.99 with 10 stock, Mouse 25.50 with 100 stock, Keyboard 75.00 with 50 stock
Processing: Insert three products...
Generating SQL query...

Generated Query:
INSERT INTO products (name, price, stock) VALUES 
('Laptop', 999.99, 10),
('Mouse', 25.50, 100),
('Keyboard', 75.00, 50)

Execute this query? (y/n): y
Query executed successfully. Rows affected: 3

nexus> Show me all products where price is less than 100
Processing: Show me all products where price is less than 100
Generating SQL query...

Generated Query:
SELECT * FROM products WHERE price < 100

Execute this query? (y/n): y

Results:
1. {
  "id": 2,
  "name": "Mouse",
  "price": 25.5,
  "stock": 100
}

2. {
  "id": 3,
  "name": "Keyboard",
  "price": 75.0,
  "stock": 50
}

Total rows: 2

nexus> /quit
Goodbye!
```

## Safety Features

✅ **Query Preview** - See exactly what will be executed  
✅ **User Confirmation** - No auto-execution without your approval  
✅ **SQL Injection Prevention** - Built-in validation  
✅ **Dangerous Operation Blocking** - Prevents harmful queries  
✅ **Local Processing** - No data leaves your machine  

Enjoy using Nexus Spider Agent! 🕷️
