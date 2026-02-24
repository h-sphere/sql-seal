---
"sqlseal": minor
---

Add VaultLoader for reusable Nunjucks templates in TEMPLATE renderer

The TEMPLATE renderer now supports `{% include %}` and `{% from ... import %}` directives
to load `.njk` template files from the Obsidian vault. This enables users to define reusable
templates and macros once and reference them across multiple code blocks.

Templates are cached at startup and kept in sync via vault file watchers.
