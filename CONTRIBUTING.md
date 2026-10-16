# Contributing to Nexus Spider Agent

Thank you for your interest in contributing to Nexus Spider Agent! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment for all contributors

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

1. A clear, descriptive title
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Your environment (OS, Python version, LM Studio version)
6. Any relevant logs or error messages

### Suggesting Features

We welcome feature suggestions! Please:

1. Check if the feature has already been requested
2. Provide a clear description of the feature
3. Explain the use case and benefits
4. Consider implementation details if possible

### Contributing Code

#### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/sashasmith-syber/nexus_spider_agent.git
cd nexus_spider_agent

# Install dependencies
pip install -r requirements.txt

# Run tests
python test_basic.py
```

#### Making Changes

1. **Fork the repository** on GitHub
2. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the coding standards below
4. **Test your changes** thoroughly
5. **Commit your changes** with clear messages:
   ```bash
   git commit -m "Add feature: description of what you added"
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** on GitHub

#### Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Include test coverage for new features
- Update documentation as needed
- Ensure all tests pass
- Follow the existing code style

## Coding Standards

### Python Style

- Follow PEP 8 guidelines
- Use meaningful variable and function names
- Add docstrings to all functions and classes
- Keep functions focused and concise
- Use type hints where appropriate

### Example:

```python
def process_query(query: str, validate: bool = True) -> Tuple[bool, str]:
    """
    Process and validate a SQL query.
    
    Args:
        query: SQL query string to process
        validate: Whether to validate the query (default: True)
        
    Returns:
        Tuple of (success, result_or_error_message)
    """
    if validate:
        is_valid, error = validate_query(query)
        if not is_valid:
            return False, error
    
    # Process query...
    return True, "Success"
```

### Security

- **Always validate user input**
- **Never use string interpolation for SQL queries** (use parameterized queries)
- **Sanitize table/column names** when used in dynamic SQL
- **Block dangerous operations** by default
- **Document security considerations** in code comments

### Testing

- Write tests for new features
- Test edge cases and error conditions
- Ensure tests are repeatable and isolated
- Use descriptive test names

### Documentation

- Update README.md for new features
- Add/update docstrings
- Update CHANGELOG.md
- Include examples where helpful
- Update QUICKSTART.md if user-facing changes

## Project Structure

```
nexus_spider_agent/
├── nexus_spider_agent/     # Main package
│   ├── __init__.py        # Package initialization
│   ├── __main__.py        # CLI entry point
│   ├── agent.py           # Main agent orchestrator
│   ├── cli.py             # Interactive CLI
│   ├── db_manager.py      # Database management
│   └── llm_client.py      # LM Studio client
├── test_basic.py          # Basic tests
├── example.py             # Usage examples
├── setup.py               # Package setup
├── requirements.txt       # Dependencies
└── README.md             # Main documentation
```

## Areas for Contribution

We especially welcome contributions in these areas:

### High Priority

- [ ] Additional test coverage
- [ ] Support for more LLM providers (Ollama, etc.)
- [ ] Query result formatting improvements
- [ ] Better error messages and handling
- [ ] Performance optimizations

### Medium Priority

- [ ] Support for other database types (PostgreSQL, MySQL)
- [ ] Query history persistence
- [ ] Configuration file loading
- [ ] Logging improvements
- [ ] Query caching

### Nice to Have

- [ ] Web UI
- [ ] Query explanation feature
- [ ] Database backup/restore functionality
- [ ] Migration tools
- [ ] Plugin system

## Development Tips

### Testing with LM Studio

1. Use a consistent model for testing (e.g., Mistral-7B)
2. Test with LM Studio running and stopped
3. Test various natural language patterns
4. Verify SQL generation quality

### Debugging

```python
# Add debug prints
import json
print(f"Debug: {json.dumps(data, indent=2)}")

# Test individual components
from nexus_spider_agent import DatabaseManager
db = DatabaseManager("test.db")
# ... test code
```

### Common Issues

**Import errors**: Make sure you're in the project root directory

**Database locked**: Close any other connections to the test database

**LM Studio timeout**: Increase timeout or check if LM Studio is responding

## Security Vulnerability Reporting

**DO NOT** open a public issue for security vulnerabilities.

Instead, email the maintainers directly with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

See [SECURITY.md](SECURITY.md) for more details.

## Questions?

- Open an issue for general questions
- Check existing issues and discussions
- Review the documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- Release notes for significant contributions
- Special thanks in documentation for major features

Thank you for contributing to Nexus Spider Agent! 🕷️
