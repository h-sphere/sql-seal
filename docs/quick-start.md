# Quick Start
In this guide you will learn:
- How to install SQLSeal in your vault
- How to save CSV and show it in the file explorer
- How to create your first query

## Installing SQLSeal
The easiest way to install SQLSeal is to download it from Community Plugins. Go to Settings -> Community Plugins and click on Browse button. Search for SQLSeal, install it and enable.

### Manual instalation
To install it manually clone the project:
```bash
git clone <URL>
```

## Save CSV in Obsidian
Obsidian does not natively support CSV and it hides them in the file explorer. To enable CSVs being shown on the sidebar, you need to enable "Detect all file extensions" in "Files and Links" setting panel. Then save the following CSV in your vault: [transactions.csv](./transactions.csv)


## Querying the data
To query the data simply create the codeblock in `sqlseal` language. SQLSeal language consists of the following:
- 0 or more `TABLE` command that define your tables
- Standard SQL SELECT query

The best is to use the following example:

```sqlseal
TABLE transactions = file(transactions.csv)

SELECT name, value FROM transactions
```

The code above creates table `transactions` based on the csv file provided and selects all names and values from it.

