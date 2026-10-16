# Security Policy

## Security Features

Nexus Spider Agent implements several security measures to protect your data:

### SQL Injection Prevention

1. **Query Validation**: All SQL queries are validated before execution
2. **Dangerous Keyword Blocking**: Operations like `DROP DATABASE`, `TRUNCATE`, etc. are blocked
3. **Multiple Statement Detection**: Multiple SQL statements in a single query are prevented
4. **Parameterized Query Support**: Safe parameter binding is supported

### Privacy Protection

1. **Local Processing**: All data processing happens locally on your machine
2. **No External API Calls**: No data is sent to external servers (except to your local LM Studio instance)
3. **No Telemetry**: No usage tracking or analytics
4. **No API Keys Required**: No cloud services or API keys needed

### Safe Defaults

1. **Auto-Execute Disabled**: Query execution requires explicit user confirmation by default
2. **User Confirmation**: Interactive CLI prompts for confirmation before executing generated queries
3. **Query Preview**: All generated queries are shown to the user before execution

## Security Best Practices

### When Using Nexus Spider Agent

1. **Review Generated Queries**: Always review SQL queries before executing them
2. **Use Auto-Execute Carefully**: The `--auto-execute` flag should only be used in trusted environments
3. **Backup Your Database**: Regularly backup your SQLite database files
4. **Limit Permissions**: Run the agent with minimal file system permissions
5. **Use Read-Only Databases**: For querying existing databases, consider using read-only mode

### Database Security

1. **File Permissions**: Ensure database files have appropriate file system permissions
2. **Sensitive Data**: Avoid storing sensitive information in plain text
3. **Regular Backups**: Maintain regular backups of your database
4. **Input Validation**: Validate data before insertion into the database

### LM Studio Security

1. **Local Only**: Keep LM Studio's API accessible only from localhost
2. **Firewall Rules**: Don't expose LM Studio's port to external networks
3. **Model Trust**: Only use models from trusted sources

## Reporting Security Issues

If you discover a security vulnerability in Nexus Spider Agent, please report it by:

1. **DO NOT** open a public GitHub issue
2. Send an email to the maintainers with details of the vulnerability
3. Include steps to reproduce the issue
4. Allow time for the issue to be addressed before public disclosure

## Known Limitations

1. **LLM Output Reliability**: The quality of generated SQL depends on the LLM model used
2. **Complex Queries**: Very complex queries may not be generated correctly
3. **Schema Context**: The agent provides schema context to the LLM, but very large schemas may exceed context limits
4. **SQLite Only**: Currently only supports SQLite databases

## Security Checklist for Users

- [ ] Review all generated queries before execution
- [ ] Keep LM Studio API accessible only from localhost
- [ ] Use strong file permissions on database files
- [ ] Regularly backup your database
- [ ] Keep dependencies up to date
- [ ] Don't use `--auto-execute` in production environments
- [ ] Validate input data before insertion
- [ ] Monitor query execution logs
- [ ] Use the latest version of Nexus Spider Agent

## Updates and Patches

Security updates will be released as soon as possible after a vulnerability is confirmed. Users are encouraged to:

- Watch the GitHub repository for security updates
- Keep their installation up to date
- Review the CHANGELOG for security-related changes

## Disclaimer

This software is provided "as is" without warranty of any kind. Users are responsible for:

- Validating generated SQL queries
- Ensuring data backup and recovery procedures
- Implementing appropriate security measures for their use case
- Testing the software in their specific environment

Always test thoroughly in a non-production environment before using with important data.
