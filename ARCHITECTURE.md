# Architecture Documentation

## Overview

Nexus Spider Agent is a privacy-focused Python application that bridges natural language commands with SQL database operations through a locally running LLM.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          USER                               │
│                    (Natural Language)                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Command Input
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     CLI Module (cli.py)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Interactive REPL                                  │   │
│  │  • Command parsing (/execute, /schema, etc.)        │   │
│  │  • Result formatting and display                    │   │
│  │  • User confirmation prompts                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Parsed Commands
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              NexusSpiderAgent (agent.py)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Main orchestrator                                 │   │
│  │  • Coordinates LLM and DB operations                │   │
│  │  • Manages conversation history                     │   │
│  │  • Provides schema context to LLM                   │   │
│  │  • Handles execution decisions                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────┬──────────────────────────────┬────────────────────┘
          │                              │
          │ Natural Language             │ Execute Query
          │ + Schema Context             │ + Validate
          ▼                              ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  LMStudioClient          │   │  DatabaseManager         │
│  (llm_client.py)         │   │  (db_manager.py)         │
│                          │   │                          │
│ ┌──────────────────────┐ │   │ ┌──────────────────────┐ │
│ │ • HTTP client        │ │   │ │ • Query validation   │ │
│ │ • Prompt engineering │ │   │ │ • SQL injection      │ │
│ │ • SQL generation     │ │   │ │   prevention         │ │
│ │ • Intent extraction  │ │   │ │ • Parameterized      │ │
│ │ • Response parsing   │ │   │ │   queries            │ │
│ └──────────────────────┘ │   │ │ • Schema inspection  │ │
└────────┬─────────────────┘   │ │ • Transaction mgmt   │ │
         │                     │ └──────────────────────┘ │
         │ HTTP Request        └────────┬─────────────────┘
         ▼                              │
┌──────────────────────────┐            │ SQL Queries
│     LM Studio API        │            ▼
│   (localhost:1234)       │   ┌──────────────────────────┐
│                          │   │    SQLite Database       │
│ ┌──────────────────────┐ │   │       (.db file)         │
│ │ • Local LLM          │ │   │                          │
│ │ • Chat completions   │ │   │ ┌──────────────────────┐ │
│ │ • Model inference    │ │   │ │ • Tables             │ │
│ │ • Context window     │ │   │ │ • Rows & Columns     │ │
│ └──────────────────────┘ │   │ │ • Indexes            │ │
└──────────────────────────┘   │ │ • Constraints        │ │
         │                     │ └──────────────────────┘ │
         │ Generated SQL       └──────────────────────────┘
         └─────────────────────────────┘
```

## Component Details

### 1. CLI Module (`cli.py`)

**Responsibility**: User interface and interaction

**Key Functions**:
- `run()`: Main REPL loop
- `handle_command()`: Route commands to appropriate handlers
- `handle_natural_language()`: Process NL commands
- `handle_special_command()`: Process special commands (/, etc.)
- `format_results()`: Pretty-print query results

**Interaction Flow**:
```
User Input → Parse → Route → Process → Display
```

### 2. Nexus Spider Agent (`agent.py`)

**Responsibility**: Central orchestration and business logic

**Key Functions**:
- `initialize()`: Set up connections
- `process_command()`: Main NL processing pipeline
- `execute_query()`: Direct SQL execution
- `get_schema()`: Retrieve database schema
- `interpret_command()`: Extract intent from NL

**State Management**:
- Connection to database
- Connection to LLM
- Conversation history
- Configuration settings

### 3. LM Studio Client (`llm_client.py`)

**Responsibility**: LLM communication and prompt engineering

**Key Functions**:
- `check_connection()`: Verify LM Studio is running
- `generate_sql_query()`: Convert NL → SQL
- `interpret_command()`: Extract intent and parameters
- `_chat_completion()`: Low-level API communication

**Prompt Strategy**:
```
System Prompt: Define role and rules
   ↓
User Prompt: Command + Schema Context
   ↓
LLM Processing: Generate response
   ↓
Response Parsing: Extract SQL/JSON
```

### 4. Database Manager (`db_manager.py`)

**Responsibility**: Secure database operations

**Key Functions**:
- `validate_query()`: Security validation
- `execute_query()`: Safe query execution
- `get_schema_info()`: Schema introspection
- `list_tables()`: Table enumeration
- `get_table_info()`: Column details

**Security Layers**:
```
Query Input
   ↓
1. Keyword validation
   ↓
2. Operation validation
   ↓
3. Multi-statement check
   ↓
4. Table name sanitization
   ↓
5. Parameterized execution
   ↓
Execution
```

## Data Flow

### Natural Language Query Processing

```
1. User enters: "Show all users where age > 25"
   ↓
2. CLI captures input
   ↓
3. Agent calls LLM with:
   - Command: "Show all users where age > 25"
   - Schema: "CREATE TABLE users (id INTEGER, name TEXT, age INTEGER)"
   ↓
4. LLM generates: "SELECT * FROM users WHERE age > 25"
   ↓
5. Agent validates query via DatabaseManager
   ↓
6. CLI prompts user for confirmation
   ↓
7. DatabaseManager executes if confirmed
   ↓
8. Results returned to CLI
   ↓
9. CLI formats and displays results
```

### Direct SQL Execution

```
1. User enters: "/execute SELECT * FROM users"
   ↓
2. CLI recognizes special command
   ↓
3. Agent bypasses LLM, goes directly to DatabaseManager
   ↓
4. DatabaseManager validates and executes
   ↓
5. Results returned and displayed
```

## Security Architecture

### Input Validation

```
User Input
   ↓
┌─────────────────────────────────────┐
│  CLI Layer                          │
│  - Command parsing                  │
│  - Basic sanitization               │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Agent Layer                        │
│  - Context validation               │
│  - Execution authorization          │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Database Manager Layer             │
│  - Query structure validation       │
│  - Dangerous keyword detection      │
│  - Multi-statement prevention       │
│  - Table name sanitization          │
│  - Parameterized query enforcement  │
└────────┬────────────────────────────┘
         ↓
      Execution
```

### Privacy Protection

```
┌──────────────────────────┐
│   User's Machine         │
│  ┌────────────────────┐  │
│  │  Nexus Spider      │  │
│  │      Agent         │  │
│  └─────┬──────────────┘  │
│        │                 │
│  ┌─────▼──────────────┐  │
│  │   LM Studio        │  │
│  │  (localhost:1234)  │  │
│  └────────────────────┘  │
│        │                 │
│  ┌─────▼──────────────┐  │
│  │  SQLite Database   │  │
│  │    (local file)    │  │
│  └────────────────────┘  │
└──────────────────────────┘
         │
         │ NO external
         │ connections
         ▼
    ╔════════╗
    ║   🔒   ║
    ╚════════╝
```

## Configuration Flow

```
┌──────────────────────────────────────┐
│  Command Line Arguments              │
│  (--db, --lm-studio-url, etc.)       │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Configuration File (optional)       │
│  (config.json)                       │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Environment Variables (optional)    │
│  (.env)                              │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Agent Initialization                │
│  (with merged configuration)         │
└──────────────────────────────────────┘
```

## Error Handling

### Error Propagation

```
Error Occurs
   ↓
┌─────────────────────────────────────┐
│  Component Level                    │
│  - Catch exception                  │
│  - Log error details                │
│  - Return error tuple/dict          │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Agent Level                        │
│  - Aggregate error information      │
│  - Add context                      │
│  - Determine severity               │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  CLI Level                          │
│  - Format error message             │
│  - Display to user                  │
│  - Suggest recovery actions         │
└─────────────────────────────────────┘
```

## Extensibility Points

### Adding New Commands

```python
# In cli.py
def handle_special_command(self, command: str):
    if cmd == '/newcommand':
        # Implementation
        pass
```

### Adding New LLM Providers

```python
# Create new client class
class OllamaClient:
    def generate_sql_query(self, command: str) -> str:
        # Implementation
        pass

# Use in agent
agent = NexusSpiderAgent(
    llm_client=OllamaClient()
)
```

### Custom Validation Rules

```python
# In db_manager.py
class CustomDatabaseManager(DatabaseManager):
    def validate_query(self, query: str) -> Tuple[bool, str]:
        # Custom validation logic
        is_valid, msg = super().validate_query(query)
        # Additional checks
        return is_valid, msg
```

## Performance Considerations

### LLM Response Time
- Typical: 1-5 seconds for simple queries
- Complex queries: 5-15 seconds
- Depends on model size and hardware

### Database Operations
- SQLite is file-based, very fast for small-medium databases
- Query validation adds ~1ms overhead
- Schema introspection cached in memory

### Optimization Strategies
1. Cache schema information
2. Use smaller, faster LLM models for simple queries
3. Batch database operations when possible
4. Implement query result pagination for large datasets

## Future Architecture Enhancements

### Potential Improvements

1. **Async Operations**: Non-blocking LLM and database calls
2. **Plugin System**: Custom validators, formatters, LLM providers
3. **Query Cache**: Store frequently used query patterns
4. **Multi-Database**: Support PostgreSQL, MySQL, etc.
5. **Web Interface**: REST API and web UI
6. **Distributed**: Multiple databases, load balancing

## Development Workflow

```
┌─────────────────────────────────────┐
│  Developer makes changes            │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Run tests (test_basic.py)          │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Manual testing with LM Studio      │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Code review and validation         │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Merge and release                  │
└─────────────────────────────────────┘
```

## Deployment Options

### Standalone Application
```bash
python -m nexus_spider_agent
```

### Installed Package
```bash
pip install .
nexus-spider
```

### Docker Container (Future)
```bash
docker run -v ./data:/data nexus-spider
```

## Monitoring and Logging

### Current Implementation
- Print statements for user feedback
- Error messages with context
- Query execution tracking in history

### Future Enhancements
- Structured logging (Python logging module)
- Log levels (DEBUG, INFO, WARNING, ERROR)
- Log file rotation
- Performance metrics
- Query analytics

---

This architecture is designed to be:
- **Secure**: Multiple validation layers
- **Private**: All processing local
- **Extensible**: Easy to add features
- **Maintainable**: Clear separation of concerns
- **User-friendly**: Interactive and helpful

For implementation details, see the source code in `nexus_spider_agent/`.
