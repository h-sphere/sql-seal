# Troubleshooting

If you are developing SQLSeal you might encounter one of few common issues.

## Resetting Database
If you've been modifying your database and you end up with invalid schema, and want to reset the database (or want to reset the database for any other reason):
- Open Dev Tools
- Go to Applications
- Open Storage -> IndexedDb -> sqlite.db
- Click Delete Database
- Reload Obsidian (choose Reload from command palette)

