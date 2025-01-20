# List Renderer
Use List renderer to render results as list (HTML ul / li elements). Each row of the result is a nested list.

> [!NOTE]
> This renderer does not provide any stylings by default. You might want to provide custom styles for it yourself.

```sqlseal
LIST
SELECT name, path FROM files LIMIT 10
```

## Parameters
You can provide classnames as a parameter to add custom class to the table. For example:

```sqlseal
LIST .my-custom-class
SELECT name, path FROM files LIMIT 10
```

Will apply `my-custom-class` class on the table parent. You can use it to style it.

You can apply multiple classes by joining them with `.` (same way you would target multiple classes in CSS):

```sqlseal
LIST .my-custom-class.another-class
SELECT name, path FROM files LIMIT 10
```

## Column names data
Each property has the column name set in the `data-sqlseal-column` property. You can use it to style specific fields.

```css
.sqlseal-list-element-single[data-sqlseal-column="name"] {
    background: red;
}
```

## Display column names in the results
By default column names per for are disabled. You can enable them by applying class .show-column-names, for example:
```sqlseal
LIST .show-column-names
SELECT name, path FROM Files
```