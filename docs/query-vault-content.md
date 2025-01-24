# Query your Vault content

You can query your vault content using SQLSeal built-in tables `files` and `tags` and `tasks`. You can use them to query specific files in the fault based on Properties (Frontmatter) and associated tags.

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
Tags are kept in a separate table `tags`. To select all files that have specific tag, we can perform simple join.

```sqlseal
SELECT files.* FROM files JOIN tags ON files.id=tags.fileId WHERE tag = '#important'
```

## Table Structure
See full breakdown in [Data Sources: Vault Data](./data-sources/vault-data.md).