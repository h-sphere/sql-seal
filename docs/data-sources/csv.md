# Data Source: CSV

You can query CSV files. To link to your CSV file:

```
TABLE data = file(path.csv)
```

`data` is the table alias. You can use it in your queries. `path.csv` is a path to your CSV file within your vault. It can be absolute path from the root of your vault or relative to the current file.