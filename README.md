# Obsidian SQLSeal

SQLSeal allow you to query for files, tags and tasks in your vault using familar SQL syntax.
It also enables you to preview any CSV file in your vault as a database.
It brings fully featured database into your vault!

## Installation

You can install plugin from the Community Plugins directly from Obsidian, just look for SQLSeal in the marketplace.

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

# Disclaimer
The plugin authors do not take any responsibility for any potential data loss. Always backup your files before usage. This plugin may modify files in your vault in the following situations (the list might not be exhaustive):

- **.sql and .sqlseal files**: Variable values are saved as comments at the end of these files
- **Markdown files**: When interacting with task using `tasks` table, the plugin will update source markdown files.

Please ensure you have proper backups before using this plugin.


# Stay in Touch!
If you have any questions about the project, ideas or want to share your use-cases, [join our Discord Channel](https://discord.gg/ZMRnFeAWXb)!
