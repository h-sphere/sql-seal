# Obsidian SQLSeal

SQLSeal allows to transform your CSV files located in your vault into fully-fledged SQL database. You can use SQL statements to query this data however you like.

## Installation
Once the library is published in Obsidian Official Community Repository: just head to Community Tab in your Obisidian Settings page and search for "SQLSeal".

Note: Please note that this plugin is in early phase. Basic functionality should work just fine but I do not take any responsibility for potential data loss and damage to your Vault.

### Manual Instalation
To manually install the package, open [Releases](https://github.com/h-sphere/sql-seal/releases) and download .zip of the last one. Unzip it in your vault under `.obsidian/Plugins/sqlseal`.


## Usage
Once you install the plugin, you can use it by creating `sqlseal` codeblocks in your notes. To create table base on the existing CSV file in your vault simply address it using the following command:

```sql
TABLE transactions = file(transactions.csv)

SELECT * FROM transactions LIMIT 10
```

The code above will create table called `transactions` based on the `transactions.csv` file from your vault. Further you can refer to it using regular `SELECT` statements.
You can define multiple tables in a single snippet. You can also point to the tables defined in different snippets *within the same note* (for now tables stay local to the file).

For more comprehensive documentation head to [hypersphere.blog/sql-seal](https://hypersphere.blog/sql-seal).

