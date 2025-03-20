# Data Source: Vault Data
You can query your vault data. These tables are automatically created when you install SQLSeal and are available from any SQLSeal codeblock globally. They update automatically on file changes.

## Example Usage
Query below fetches last 10 modified files in your vault.
```sqlseal
SELECT *
FROM files
ORDER BY modified_at DESC
LIMIT 10
```

## Table Structure
### `files` table
Files table consists of the following columns:
| Column              | Description                                                                                                                                                                      | Introduced In |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `id`                | File Path                                                                                                                                                                        |               |
| `path`              | Same as `id`, file path                                                                                                                                                          |               |
| `name`              | Name of the file, without path and extension                                                                                                                                     |               |
| `created_at`        | Time of creation (ISO 8601). You can use it to order files by their creation date. Before version 0.22.0 value was unixepoch * 1000 (JavaScript epoch)                           | 0.18.1        |
| `modified_at`       | Time of last modification (ISO 8601). You can use it to odrer files by their modification. Before version 0.22.0 value was unixepoch * 1000 (JavaScript epoch)                   | 0.18.1        |
| `file_size`         | Size of the file on disk (in bytes)                                                                                                                                              | 0.18.1        |
| All file properties | All file properties are also added to the table. All the special characters will be transformed to underscores `_`, so for example `note type` will be accessible as `note_type` |               |

### `tags` table
Tags table consists of the following columns:
| Column   | Description                                                                                                              | Introduced In |
| -------- | ------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `tag`    | Full tag, including `#` symbol. For example `#todo`                                                                      |               |
| `path`   | Full path of the file the tag belongs to                                                                                 | 0.24.1        |
| `fileId` | (deprecated) same like `path`. Name changed for compatibility with other tables. Will get removed in the future versions |               |

### `tasks` table
Tasks table consists of the following columns:
| Column      | Description                                                                                                              | Introduced In |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `task`      | Content of the task (text)                                                                                               |               |
| `completed` | 0 if not completed, 1 if completed                                                                                       |               |
| `path`      | Full path of the file the tag belongs to                                                                                 | 0.24.1        |
| `filePath`  | (deprecated) same like `path`. Name changed for compatibility with other tables. Will get removed in the future versions |               |

### `links` table
Table containing all the links between files.

Introduced in 0.20.0

| Column          | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `path`          | Full path of the source of the link                                |
| `target`        | Full path of the target of the link                                |
| `position`      | JSON object containing information about location of the link      |
| `display_text`  | Text displayed on the page for that link                           |
| `target_exists` | information if the target file exists. 1 if it exists, 0 otherwise |

#### Frontmatter links

Links that appear in a file's frontmatter (Obsidian properties) contain a `frontmatterKey` property in the `position`
JSON object. This can be used to identify links that are in the note body or within a specific frontmatter property.

For instance, to query all links to the current file that appear in the body of a note:

```sql
SELECT * FROM links
WHERE target = @path
AND json_extract(position, '$.frontmatterKey') IS NULL
```

`frontmatterKey` can be used to select links within a specific property. A Map of Content, for instance, may wish to
show a list of files that list the MOC as a type:

```sql
LIST
SELECT a(path) FROM links
WHERE target = @path
AND json_extract(position, '$.frontmatterKey') = 'type'
```
