# Grid Renderer
The default renderer that plugin is using is Grid. It displays advanced table with ability to sort and paginate the data. Using `GRID` keyword is optional as the renderer is set as default.

```sqlseal
GRID
SELECT name, path FROM files LIMIT 10
```