# Comments
You can add comments to document your query. This can help you document your thought process and make it easier to share additional information when sharing your query with other. You can also use comments to disable (comment out) specific parts of your query you don't want to use at the moment but want to preserve for later.
SQLSeal supports 2 types of comments:
- SQL style `--` comment which comments everything until the end of the line
- Block comment `/* */` which comments everything between opening `/*` mark and `*/` closing mark


```sqlseal
TABLE a = file(file.csv)
-- TABLE b = file(file2.csv)

/*
GRID
NO REFRESH
*/

SELECT *
FROM a
-- WHERE value > 5
```

In the example above:
- Table b is not being loaded - that line is commented out
- GRID and NO REFRESH are disabled and will take no effect
- `WHERE value > 5` is disabled - there will be no filtering