# Query your Vault content

You can query your vault content using SQLSeal built-in tables `files`, `tags`, `tasks` and `links`. You can use them to query specific files in the fault based on Properties (Frontmatter) and associated tags.

## Example: Get all files from the vault
To get all files from the fault you can run the following query:

```sqlseal
SELECT * FROM files
```

## Filter by Properties
If your files have frontmatter properties, you can query by them using SQL `WHERE` clause. SQLSeal automatically maintains SQL schema and creates columns when needed. Let's assume we have files with property `type`. We can query only specific notes by running the following:

```sqlseal
SELECT * FROM files WHERE type = 'resource'
```

The query above will return only files that have property `type` set to value `resource`.

## Filter by Tags
Tags are kept in a separate table `tags`. To select all files that have a specific tag, perform a simple join:

```sqlseal
SELECT files.* FROM files JOIN tags ON files.path=tags.path WHERE tag = '#important'
```

## Filter by Multiple Tags (AND logic)

Filtering by multiple tags with a plain `AND` clause **always returns zero results**. This is because each row in the `tags` table holds only one tag — a single row can never simultaneously satisfy `tag = '#project' AND tag = '#active'`.

SQLSeal provides two ways to correctly select files that have *all* of the listed tags:

### Option 1 — TAGS() macro (recommended)

Use the built-in `TAGS()` macro in your `WHERE` clause:

```sqlseal
SELECT * FROM files WHERE TAGS('#project', '#active')
```

SQLSeal rewrites this into an efficient INTERSECT query automatically. You can combine it with other conditions too:

```sqlseal
SELECT * FROM files WHERE TAGS('#project', '#active') AND name LIKE '%meeting%'
```

### Option 2 — Auto-detection (transparent)

If you accidentally write the broken pattern, SQLSeal detects it and fixes it for you:

```sqlseal
SELECT * FROM files WHERE tag = '#project' AND tag = '#active'
```

This is automatically rewritten to the same INTERSECT query as the `TAGS()` macro — no change needed on your part.

> **Advanced users:** to disable the transparent rewrite and handle the SQL yourself, enable *Disable Tag Auto-Detection* in the SQLSeal settings under *Behavior*.

### How it works under the hood

Both approaches produce an INTERSECT subquery:

```sql
SELECT * FROM files
WHERE path IN (
  SELECT path FROM tags WHERE tag = '#project'
  INTERSECT
  SELECT path FROM tags WHERE tag = '#active'
)
```

## Table Structure
See full breakdown in [Data Sources: Vault Data](./data-sources/vault-data.md).
