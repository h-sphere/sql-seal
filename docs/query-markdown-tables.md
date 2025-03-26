# Querying Markdown Tables
> [!NOTE] Compatibility
> Introduced in version 0.16.0. Make sure you are using up to date version.
> 
> Header-based references and cross-file references introduced in version 0.30.0.

SQL Seal allows you to query tables directly from your markdown notes, making it easy to analyze and summarize data without importing external files.

## Basic Usage

You can reference tables in your markdown files using the `table()` function:

```sqlseal
TABLE expenses = table(0)

SELECT date, SUM(Amount) as Total
FROM expenses
GROUP BY date
```

This example references the first table in your current note (index 0) and assigns it the name "expenses" for use in your SQL query.

## Reference Methods

SQL Seal offers several ways to reference markdown tables:

- By index: `table(0)` - Reference tables by their position in the document
- By header name: `table(Monthly Budget)` - Find tables under specific headers
- From other files: `table(file:Finance/budget.md, 0)` - Query tables from across your vault

## Example

Let's take a note with a simple expense table:

| Date       | Name          | Amount |
| ---------- | ------------- | ------ |
| 2025-01-01 | Grocery       | 20.40  |
| 2025-01-01 | Cinema Ticket | 8.20   |
| 2025-01-02 | Grocery       | 5.0    |

We can analyze this data with a query:

```sqlseal
TABLE expenses = table(0)

HTML
SELECT date, ROUND(SUM(Amount), 2) as Spent
FROM expenses
GROUP BY date
```

Result:

| date       | Spent |
| ---------- | ----- |
| 2025-01-01 | 28.6  |
| 2025-01-02 | 5.0   |

## Inline Queries

You can also use inline queries to embed single values in your text:

```
I've spent total of `S> SELECT ROUND(SUM(amount), 2) FROM expenses`.
```

Result:
I've spent total of `69.58`.

## Learn More

For complete documentation including advanced features like:
- Detailed header-based references
- Cross-file table queries
- Relative file paths

See the [Markdown Tables Reference Guide](/data-sources/markdown-tables.md).
