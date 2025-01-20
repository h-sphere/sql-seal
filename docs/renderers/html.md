# HTML Renderer
Use HTML renderer to render results as a simple HTML table.

```sqlseal
HTML
SELECT name, path FROM files LIMIT 10
```

## Parameters
You can provide classnames as a parameter to add custom class to the table. For example:

```sqlseal
HTML .my-custom-class
SELECT name, path FROM files LIMIT 10
```

Will apply `my-custom-class` class on the table parent. You can use it to style it.

You can apply multiple classes by joining them with `.` (same way you would target multiple classes in CSS):

```sqlseal
HTML .my-custom-class.another-class
SELECT name, path FROM files LIMIT 10
```