# Nexus Spider Agent (Web / React Edition)

A lightweight, privacy-focused database assistant and SQL agent that connects to locally running LLMs (such as in LM Studio or Ollama) to interpret natural language commands, generate SQLite queries, and securely manage databases.

Rewritten as a modern React application powered by WebAssembly SQLite (`sql.js`), preserving the core architecture, interactive terminal CLI, schema management, and query validation features.

## Features

- 🔒 **Privacy-Focused**: 100% of operations happen locally in your browser/environment — zero data leaves your machine.
- 🤖 **LLM-Powered**: Connects directly to locally running LLMs via LM Studio (default: `http://localhost:1234/v1`) or any OpenAI-compatible local endpoint.
- 💡 **Smart Offline Synthesizer**: Built-in fallback rule engine allows testing all natural language commands even when LM Studio is not active.
- 🛡️ **Security & SQL Injection Shield**: Real-time inspection blocking dangerous operations (`DROP DATABASE`, `TRUNCATE`, `ALTER SYSTEM`, etc.), disallowed queries, and multi-statement injection attempts.
- 🗃️ **SQLite Management**: Powered by WebAssembly SQLite with live schema introspection (`PRAGMA table_info`), visual data grid, and `.db` binary export/import.
- 💬 **Interactive CLI (`nexus>`)**: Full command-line terminal interface supporting slash commands (`/help`, `/execute`, `/schema`, `/tables`, `/info`, `/history`, `/clear`, `/quit`) and query confirmation (`y/n`).
- 📝 **Query & Conversation History**: Audit trail of prompts, generated SQL, execution metrics, and one-click re-run capabilities.

## Architecture

```
┌─────────────────────────────────┐
│     User Natural Language       │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐      ┌──────────────────────────┐
│       Nexus Spider Agent        │─────▶│  LM Studio / Local LLM   │
│     (Orchestrator & Rules)      │      │  (http://localhost:1234) │
└────────────────┬────────────────┘      └──────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐      ┌──────────────────────────┐
│      Database Manager           │─────▶│    SQLite WebAssembly    │
│  (Safety & Injection Shield)    │      │    (In-Browser / sql.js) │
└─────────────────────────────────┘      └──────────────────────────┘
```

## Interactive CLI Commands

- `/execute <query>` - Execute a SQL query directly
- `/schema [table]` - Show database schema (optionally for a specific table)
- `/tables` - List all tables in the database
- `/info <table>` - Show detailed column metadata for a table
- `/history` - View conversation and query history
- `/clear` - Clear conversation history
- `/help` - Show available commands
- `/quit` or `/exit` - Reset the CLI session

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Connect LM Studio (Optional)**:
   - Start LM Studio and load a code-capable model.
   - Start the local server (default: `http://localhost:1234`).
   - The agent will automatically detect and query the local model, or seamlessly fall back to local synthesis when offline.

## License

MIT License.
