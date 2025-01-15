# UNRELEASED
- fix: fix issue with local links not being clickable
- fix: query is now less case sensitive. You can use keywords like `TABLE`, `HTML`, `MARKDOWN` in any casing you want
- fix: improved SQL parser - now more complex syntax like recursive CTE, window functions, etc. should work properly. Migrated from `node-sql-parser` to `sql-parser-cst`

# 0.14.1
- fix: fixed the issue where rows with extra data in them (rows with more columns that a header) were not synchronised correctly
- fix: fixed the issue where queries with lowercase SELECT would not work in certain cases.

# 0.14.0
Added support for inline code blocks. Create a codeblock (backtick `) and use prefix S> to indicate it's SQLSeal query.

# 0.13.0
Huge upgrade to the code codebase. SQLSeal should be now much faster and more reliable thanks to the following:
- Rewritten how files are synched - now each CSV file creates AT MOST one table in the database (synchronisations are being reused accross files)
- Rewritten SQL parser - this enables using more advanced SQLite functionality like recursive CTEs, UNIONS and `json_each`!
- (minor, technical): code got restructured and fixed so it's easier to contribute.

# 0.12.4
- added "Create CSV file" option in context menu in file explorer.

# 0.12.3
- fix: Fixing completed flag in tasks being reversed

# 0.12.2
fix: Fixed issue with CTE table names being incorrectly processed causing error

# 0.12.1
fix: Fixed issue with the library on mobile - now it should load properly.

# 0.12.0
This update does not bring any functionality changes yet but it fixes some problems with underlying architecture, helping to make SQLSeal more efficient in the future. If you work with many datasets, you might see slightly smaller memory usage as the database is now persisted in the IndexedDb (tech comment: as block storage).
Technical update:
Database has been moved to WebWorker, making data loading and retrieval slightly more efficient. Also integrated with [Absurd-SQL](https://github.com/jlongster/absurd-sql) which allows to store SQLite inside IndexedDb block storage, meaning it can be persisted and offloaded from the memory. Due to Obsidian API limitations, we still need to load huge files CSV to the memory instead of streaming their content but once the content is loaded, the memory usage should significantly go down now. More changes using this update to come soon!

# 0.11.0
The biggest update yet with plenty of exciting features:

Added CSV Viewer! Now you can see all your CSV files in your vault in the file explorer and open it to preview the data. You can also edit the data in place (remember always to backup your files!)
Added different renderer methods: you can now use GRID (default), HTML (standard table) and MARKDOWN (renders markdown / ASCII text representation of the table).
Added "tasks" table with all tasks from across the vault
Now the files in the queries are resolved relatively to the file they are in. You can also use leading slash (/) to force fetching from the root of the vault or relative paths (./, ../) to traverse the tree down from your location.
Added more lax parser implementation for now
Minor: updated dependencies to the latest versions

# 0.10.1
Many small fixes:
- Changed how parsing is done to simplify code greatly
- Grid now supports dark mode
- Grid now supports highlighting and copy and pasting
- Restored ability to have `TABLE` syntax without select.


# 0.10.0
SQLSeal is now compatible with mobile! Plugin now uses SQL.JS instead of better-sqlite3 which is written in Web Assembly so no longer native binaries are needed. This makes plugin portable.
Also reworked implementation of the parser from Antlr4TS into Antlr4.

# 0.9.2
Adding checkbox method to display boolean values as checkboxes
Fixing how updates are parsed

# 0.9.1
Turning off verbose mode
# 0.9.0
We now use proper grid library to render data. This allow for many great features like pagination, sorting and more visally pleasing UI out of the box.
Reworked internal communication to use Signals.

# 0.8.0
Now you can embed links and images (both local and external). Introduced `a` and `img` custom SQL functions.

# 0.7.0
A lot of changes packed in this one! Now SQLSeal is parsing the input using proper language parser (thanks to ANTLR4) rather than relying on RegExes. This finally allows for proper support of CTE statements (WITH) and fixes a lot of other minor problems with the syntax.
Also improved the way files are being observed and updated which should lead to performance improvements.

# 0.6.0
- fixing CSV loading when names has been converted to camelCase
- Fixing constantly reloading files when modifying sql inside the same block that has table declaration in
- Auto-parsing JSON values with JSON5
- Better errors when error occurs in select statement

# 0.5.0
- Adding support for JSON objects! Automatically detecting JSON in the frontmatter and converting it to JSON type in SQLite. You can query fields using built-in SQLite functions like `json_extract`, `json_array_length`, etc. More about SQlite functionality [can be found here.](https://www.sqlite.org/json1.html).
- Fixed issue with bookean types not being saved properly.

# 0.4.1
- Fixed issue with potential duplicate column sql error when two different fields resolve to the same uppercase structure

# 0.4.0
- Fixed issue with better_sqlite3 not loading on different systems and architectures

# 0.2.0
- Added ability to query files in the fault directly.
- Added observability - when CSV or file in the vault is changed, all SELECTS that uses it should update too
- Added custom class to sqlseal tables and ability to scroll vertically when the data is overflowing horizontally. 

# 0.1.0
- Initial release. Allows to create tables based on CSV files in your vault and query them using SQL.