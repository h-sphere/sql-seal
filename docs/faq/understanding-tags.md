# Understanding Tags in SQLSeal
When working with the SQLSeal plugin in Obsidian, tags can appear in two different contexts:

- as a frontmatter property in your files
- as rows in the `tags` table

It is important to understand what to expect when querying them in these different contexts.

## Tags in Frontmatter

Obsidian’s frontmatter can include a `tags` field to declare tags directly within the YAML metadata at the top of a file.

For example:
```yaml
---
tags: [project, todo]
---
```

These tags will appear as a list in the frontmatter and are considered a direct part of the file’s metadata.

In the context of SQLSeal, they will be accessible when you query the files table, but they behave like any other frontmatter property-essentially as a plain list of values.

## Tags in the tags Table

The tags table is specifically designed to capture all tags found within the vault. Each tag in this table is represented as a separate row, along with the file path it’s associated with. For instance, if you have a tag #todo in multiple files, each instance of #todo will be recorded in the tags table, linking it to the respective file.

## In Summary

When using SQLSeal, keep in mind that tags from frontmatter and tags in the tags table serve different purposes and are structured differently. Frontmatter tags are essentially metadata fields of the file and appear as-is in the files table, while the tags table provides a detailed, row-based view of all tags in your vault.
