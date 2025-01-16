# Querying Markdown Tables
> [!NOTE] Compatibility
> Introduced in version 0.16.0. Make sure you are using up to date version.

You can refer to the tables in your current file by using `table(tableIndex)` syntax. This can allow you to quickly summarise data you might have in your document.

Indexing starts from 0 so the 1st table should be refered to as `table(0)`, 2nd table `table(1)` and so on.

## Example

Let's take a note with the following table:

| Date       | Name          | Amount |
| ---------- | ------------- | ------ |
| 2025-01-01 | Grocery       | 20.40  |
| 2025-01-01 | Cinema Ticket | 8.20   |
| 2025-01-02 | Grocery       | 5.0    |
| 2025-01-02 | Game on Steam | 20.0   |
| 2025-01-03 | Grocery       | 15.98  |

We can refer to this data and summarise spendings each day by doing the following:
```sqlseal
TABLE expenses = table(0)

HTML
SELECT date, ROUND(SUM(Amount), 2) as Spent
FROM expenses
GROUP BY date
ORDER BY date
```

Result:

| date       | Spent |
| ---------- | ----- |
| 2025-01-01 | 28.6  |
| 2025-01-02 | 25    |
| 2025-01-03 | 15.98 |

## Inline query
You can also use this data to perform inline query, i.e. you can make sentence reading "I've spent in total X" and make X being a query. The only limitation here is that you need to have another query in the file that defines the table for the markdown table (because inline queries do not allow for defining new tables).

```sqlseal
TABLE expenses = table(0)
```

And then anywhere else in your code:

I've spent total of `S> SELECT ROUND(SUM(amount), 2) FROM expenses`.

Result:
I've spent in total `69.58`.