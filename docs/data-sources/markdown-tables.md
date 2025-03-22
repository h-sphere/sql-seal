# Markdown Tables Reference Guide

> [!NOTE] Compatibility
> Introduced in version 0.16.0. Make sure you are using up to date version.
> Header-based references and cross-file references introduced in version 0.30.0.

This guide provides detailed documentation on using SQL Seal to query markdown tables within your notes. For a basic introduction, see the [Querying Markdown Tables](/query-markdown-tables.md) page.

## Reference Methods

SQL Seal offers several ways to reference tables in your markdown files:

- **By numeric index**: `table(tableIndex)`
- **By header name**: `table(headerName)`
- **By header name and index**: `table(headerName, tableIndex)`
- **From other files**: `table(file:path/to/file.md, ...)`

## Referencing Tables by Index

Indexing starts from 0, so the first table in your note is referenced as `table(0)`, the second as `table(1)`, and so on.

```sqlseal
TABLE expenses = table(0)

SELECT * FROM expenses
```

This approach is simple but can be fragile if you add or remove tables from your document, as the indices will shift.

## Referencing Tables by Header

Instead of using numeric indices, you can reference tables by the header they appear under, making your queries more resilient to document changes.

### Basic Header Reference

If you have a header followed by a table:

```markdown
# Monthly Expenses
| Date | Category | Amount |
| ---- | -------- | ------ |
| 2025-01-01 | Grocery | 20.40 |
```

You can reference this table using:

```sqlseal
TABLE expenses = table(Monthly Expenses)
```

This finds the first table that appears after the "Monthly Expenses" header. The reference is case-insensitive, so `table(monthly expenses)` works too.

### Multiple Tables Under the Same Header

If multiple tables exist under the same header, you can specify which one to use with a second parameter:

```markdown
# Financial Data

## Revenue by Category
| Category | Amount |
| -------- | ------ |
| Product A| 5000   |
| Service B| 7000   |

## Expense Breakdown
| Category | Amount |
| -------- | ------ |
| Salaries | 6000   |
| Rent     | 2000   |
```

You can reference these tables using either:

```sqlseal
-- By subheader
TABLE revenue = table(Revenue by Category)
TABLE expenses = table(Expense Breakdown)

-- Or by parent header and index
TABLE revenue = table(Financial Data, 0)  -- First table under Financial Data
TABLE expenses = table(Financial Data, 1)  -- Second table under Financial Data
```

## Referencing Tables from Other Files

You can reference tables from any markdown file in your vault using the `file:` prefix.

### Basic File Reference

To reference a table in another file by index:

```sqlseal
TABLE expenses = table(file:Finance/expenses.md, 0)
```

This accesses the first table in the `Finance/expenses.md` file.

### File Reference with Header

You can combine file references with header references:

```sqlseal
TABLE summary = table(file:Finance/annual-report.md, Revenue Summary)
```

This finds the table under the "Revenue Summary" header in the `Finance/annual-report.md` file.

You can also include an index if needed:

```sqlseal
TABLE revenue = table(file:Finance/annual-report.md, Financial Data, 0)
TABLE expenses = table(file:Finance/annual-report.md, Financial Data, 1)
```

### File Path Options

When referencing other files, you have these path options:

1. **Absolute Paths** (from vault root):
   ```sqlseal
   TABLE data = table(file:Finance/reports/q1.md, 0)
   ```

2. **Relative Paths** (relative to current file):
   ```sqlseal
   -- Same folder, reports subfolder
   TABLE data = table(file:./reports/q1.md, 0)
   
   -- Parent folder
   TABLE summary = table(file:../summary.md, 0)
   ```

3. **Optional Extension**:
   The `.md` extension is optional and will be added automatically:
   ```sqlseal
   TABLE data = table(file:Finance/reports/q1, 0)  -- Will look for q1.md
   ```

## Practical Examples

### Example 1: Joining Data from Different Files

```sqlseal
TABLE sales = table(file:Data/sales.md, Monthly Sales)
TABLE targets = table(file:Plans/targets.md, Monthly Targets)

SELECT 
    s.Month, 
    s.Revenue, 
    t.Target,
    ROUND((s.Revenue / t.Target) * 100, 1) as Achievement
FROM 
    sales s
JOIN 
    targets t ON s.Month = t.Month
ORDER BY 
    s.Month
```

### Example 2: Analyzing Data Under Different Headers

```sqlseal
TABLE q1 = table(Q1 Results)
TABLE q2 = table(Q2 Results)
TABLE q3 = table(Q3 Results)
TABLE q4 = table(Q4 Results)

SELECT
    'Q1' as Quarter, SUM(Revenue) as Revenue FROM q1
UNION ALL
SELECT
    'Q2' as Quarter, SUM(Revenue) as Revenue FROM q2
UNION ALL
SELECT
    'Q3' as Quarter, SUM(Revenue) as Revenue FROM q3
UNION ALL
SELECT
    'Q4' as Quarter, SUM(Revenue) as Revenue FROM q4
ORDER BY
    Quarter
```

### Example 3: Expense Summary

```sqlseal
TABLE expenses = table(0)

HTML
SELECT 
    strftime('%Y-%m', Date) as Month,
    Category,
    ROUND(SUM(Amount), 2) as Total
FROM 
    expenses
GROUP BY 
    Month, Category
ORDER BY 
    Month, Total DESC
```

## Inline Queries

You can use inline queries to embed values directly in your text:

```
Total revenue: `S> SELECT SUM(Revenue) FROM sales`.
Average sale: `S> SELECT ROUND(AVG(Amount), 2) FROM transactions`.
```

Note that inline queries require table definitions elsewhere in the document, as they can't define tables themselves.
