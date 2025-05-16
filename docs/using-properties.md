# Using properties
You can use properties to customise your queries and make them dynamic. This can be helpful if you plan to reuse your queries accross multiple files or use them in the templates.

You can refer to your properties by prepending them with an `@` symbol, for example `@year` to refer to `year` property.

## Built-in variables
On top of properties current file exposes in the properties, you can also use the following properties that will automatically get exposed:

| Property   | Description                                 | Sample value     |
| ---------- | ------------------------------------------- | ---------------- |
| @path      | Full path of the file you're editing        | `folder/file.md` |
| @fileName  | Filename with extension                     | `file.md`        |
| @basename  | Filename without extension                  | `file`           |
| @parent    | Path of the parent folder (`/` if none)     | `folder`         |
| @extension | Extension of the file (without leading dot) | `md`             |


### Example 1: Selecting just the current file from the files table

```sqlseal
SELECT * FROM files WHERE path = @path
```

### Example2: Select tags of the current file
```sqlseal
SELECT * FROM tags WHERE path = @path
```