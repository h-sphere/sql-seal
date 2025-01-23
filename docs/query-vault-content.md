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
### `files` table
Files table consists of the following columns:
| Column              | Description                                                                                                                                                                      | Introduced In |
|---------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| `id`                | File Path                                                                                                                                                                        |               |
| `path`              | Same as `id`, file path                                                                                                                                                          |               |
| `name`              | Name of the file, without path and extension                                                                                                                                     |               |
| `created_at`        | Time of creation (unix timestamp). You can use it to order files by their creation date                                                                                          | 0.18.1        |
| `modified_at`       | Time of last modification (unix timestamp). You can use it to odrer files by their modification                                                                                  | 0.18.1        |
| `file_size`         | Size of the file on disk (in bytes)                                                                                                                                              | 0.18.1        |
| All file properties | All file properties are also added to the table. All the special characters will be transformed to underscores `_`, so for example `note type` will be accessible as `note_type` |               |

### `tags` table
Tags table consists of the following columns:
| Column   | Description                                         | Introduced In |
|----------|-----------------------------------------------------|---------------|
| `tag`    | Full tag, including `#` symbol. For example `#todo` |               |
| `fileId` | Full path of the file the tag belongs to            |               |

### `tasks` table
Tasks table consists of the following columns:
| Column      | Description                              | Introduced In |
|-------------|------------------------------------------|---------------|
| `task`      | Content of the task (text)               |               |
| `completed` | 0 if not completed, 1 if completed       |               |
| `filePath`  | Full path of the file the tag belongs to |               |