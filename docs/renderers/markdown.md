# Markdown Renderer
You can use `Markdown` renderer to display table as a markdown table. It can be helpful if you want to copy the results of the query to different file or just like the ASCII style.

```sqlseal

MARKDOWN
SELECT * FROM files LIMIT 10
```

Please note that functions like `img` and `a` does not work well with this renderer.