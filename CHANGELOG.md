# Changelog

All notable changes to Nexus Spider Agent will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-18

### Added
- Initial release of Nexus Spider Agent
- Integration with LM Studio for local LLM processing
- Natural language to SQL query generation
- Secure SQLite database management
- Interactive CLI with command history
- SQL injection prevention and query validation
- Dangerous operation blocking (DROP DATABASE, TRUNCATE, etc.)
- Multiple statement detection for security
- Table name validation to prevent injection attacks
- Schema introspection and database metadata access
- User confirmation for query execution
- Conversation history tracking
- Support for parameterized queries
- Comprehensive error handling
- Example scripts and usage documentation
- Configuration file support
- Basic test suite
- Security documentation (SECURITY.md)
- Quick start guide (QUICKSTART.md)
- MIT License

### Security
- SQL injection prevention through query validation
- Input sanitization for table names
- Dangerous keyword blocking
- Multiple statement detection
- Safe-by-default configuration (no auto-execute)
- Local-only processing (privacy-focused)

### Features
- **LMStudioClient**: Handles LM Studio API communication
  - SQL query generation from natural language
  - Command interpretation and intent extraction
  - Configurable temperature and token limits
  - Connection validation

- **DatabaseManager**: Secure SQLite operations
  - Query validation before execution
  - Schema information retrieval
  - Table listing and column inspection
  - Safe database creation
  - Transaction support

- **NexusSpiderAgent**: Main orchestrator
  - Coordinates LLM and database operations
  - Conversation history management
  - Context-aware query generation
  - Flexible execution modes

- **CLI**: Interactive command-line interface
  - Natural language command processing
  - Direct SQL execution
  - Schema exploration
  - History viewing
  - Help system
  - Special commands (prefixed with /)

### Command-Line Options
- `--db`: Specify database path (default: database.db)
- `--lm-studio-url`: Set LM Studio API URL (default: http://localhost:1234/v1)
- `--auto-execute`: Enable automatic query execution (use with caution)

### Dependencies
- Python 3.7+
- requests >= 2.31.0
- python-dotenv >= 1.0.0
- LM Studio (external application)

[0.1.0]: https://github.com/sashasmith-syber/nexus_spider_agent/releases/tag/v0.1.0
