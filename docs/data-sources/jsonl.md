# Data Source: JSONL / NDJSON

JSONL (JSON Lines) is a format where each line is a self-contained JSON object. It is commonly used for data exports, log files, and streaming datasets.

Both `.jsonl` and `.ndjson` (newline-delimited JSON) extensions are supported — they use the same format.

> **Note:** SQLSeal uses the JSON5 parser for JSONL files, which means you can use JSON5 syntax (trailing commas, comments, unquoted keys, etc.) in your JSONL files. Effectively, this makes it **JSON5L** (JSON5 Lines) support.

**Example JSONL file:**
```
{"name": "Alice", "age": 30, "role": "admin"}
{"name": "Bob", "age": 25}
{"name": "Charlie", "age": 35, "role": "viewer"}
```

## Basic usage

```
TABLE data = file(path.jsonl)
```

`data` is the table alias you use in your queries. `path.jsonl` is the path to your file within your vault.

```sqlseal
TABLE data = file(logs.jsonl)

SELECT name, role FROM data WHERE age > 25
```

## Sparse schemas

Different lines in a JSONL file can have different keys. SQLSeal automatically collects the union of all keys across all lines and uses that as the table schema. Missing fields for a given row are stored as `NULL`.

Given this file:
```
{"id": 1, "event": "login", "user": "alice"}
{"id": 2, "event": "purchase", "user": "bob", "amount": 49.99}
{"id": 3, "event": "logout", "user": "alice"}
```

The resulting table will have columns `id`, `event`, `user`, and `amount`. Rows without `amount` will have `NULL` in that column.

```sqlseal
TABLE events = file(events.jsonl)

SELECT event, user, amount FROM events WHERE amount IS NOT NULL
```

## Nested values

If a line contains nested objects or arrays as values, they are stored as JSON strings. You can use SQLite's `json_extract()` function to query into them.

```
{"id": 1, "tags": ["alpha", "beta"], "meta": {"source": "api"}}
```

```sqlseal
TABLE items = file(items.jsonl)

SELECT id, json_extract(meta, '$.source') AS source FROM items
```

## Error handling

Malformed lines are silently skipped with a warning in the developer console — the rest of the file loads normally. This is intentional: real-world JSONL files (especially logs) occasionally contain truncated or corrupt lines.
