# 0.33.0 (2025-04-09)
- fix: better text links for images (by @satkowski)
- fix: lists are now rendered properly (by @satkowski)

# 0.32.0 (2025-04-02)
- feat: added text rendering for links, images and checkboxes (for MARKDOWN renderer)
- fix: fixed issue with rendering numbers
- fix: fixed how grid renders columns - now they automatically match content and don't truncate the text
- fix: grid resizing now works better when switching tabs, resizing obsidian, etc.
- fix: columns with dots in the name render properly in grid view
- chore: now external plugins can use cellRenderer from the main plugin

# 0.31.0 (2025-03-31)
- feat: TEMPLATE renderer can now use checkboxes, links and images like other views.
# 0.30.1 (2025-03-27)
- feat: added basename and parent SQL variables
 
# 0.30.0 (2025-03-26)
- feat: added ability to reference tables from the other files in `table()` functions
- feat: added ability to reference tables by their header name
- feat: new heading and heading_level columns in tasks table (by @kDCYorke)

# 0.29.0 (2025-03-19)
- feat: LIST views with single column are rendered as a regular list (rather than nested one) (by @kDCYorke)
- feat: files table now contains tags column with tags defined directly in properties (by @sksizer)
- feat: frontmatter links are now exposed in links table (by @kDCYorke)
- feat: added checkbox field to tasks which adds **interactive** checkbox so you can mark tasks as completed directly from the SQLSeal

# 0.28.4 (2025-03-15)
- Feat: Template view can now access file properties
# 0.28.3 (2025-03-15)
- Fix: Filename field in files column no longer truncates name after dot

# 0.28.2 (2025-03-14)
- Added ability to define default view (Grid, HTML or Markdown)
- Added ability to configure default page size for the GRID view

# 0.28.1 (2025-03-14)
- Adding syntax highlighting for javascript (to be used with GRAPH view)

# 0.28.0 (2025-03-14)
- Added TEMPLATE view that allow to render your template with custom Handlebars template.
- Improved syntax highlighting - now lines with errors will get highlighted with appropriate colour to indicate the issue
- Added @path, @fileName and @extension variables you can use inside your SQL alongside other Frontmatter properties

Fixes:
- Fixed parsing arguments to the `file` function. Now parameters with symbols like `[]*` should work properly (i.e. JSONPath arguments)

Technical:
- Other plugins can now register flags to allow for extra configuration

# 0.27.0 (2025-02-17)
- Better syntax highlighting! Now it highlights SQL query parts
- Support for comments. You can now add comments like `--` and `/* */` to you queries

# 0.26.0 (2025-02-16)
- Better language parser! Reworked from the ground up, now SQLSeal uses Ohm.js parser which works much better and opens much more possibilities (like syntax highlighting also introduced in this version).
- Syntax highlighting! Your SQLSeal text is now being highlighted helping you spot potential syntax issues quickly. The highlighting will be iterated on so please join discussion on our Discord!
- fix: database did not load properly when vault name consisted spaces or was in the subfolder (mostly causing issue on mobile)

# 0.25.0 (2025-02-06)
- feat: you can now generate list of links
- feat: lists are now properly rendered
- feat: ability to edit column names in CSV files
- feat: ability to reorder columns order in CSV files
- fix: empty links no longer generate errors
- fix: fixed how lists behave when you refresh the file

# 0.24.2 (2025-02-05)
- Fixed how links are displayed. Now you can use links as `a(href)` or `a(href, name)`.

# 0.24.1 (2025-02-05)
- Added `path` columns to `tags` and `tasks` tables. Thanks to that you can use `NATURAL JOIN`s now to connect join them.

# 0.24.0 (2025-02-05)
- Better column names! Now non-latin characters are being romanised so you can access your properties (and other column names) easier: geändert becomes geandert, 类别 becomes lei_bie, ノートタイプ becomes nototaipu, etc.

# 0.23.2 (2025-02-04)
- No longer captalising renderer options (it was breaking SQLSeal Charts integration)

# 0.23.1 (2025-02-04)
- SQLSeal now works with multiple vaults open. It registers database with unique filename to avoid conflicts.

# 0.23.0 (2025-02-04)
- Added support for wikilinks in the `a` function. You can now use markdown links in your queries.
- Improved how links are being rendered. Now using native links with the preview on hover

# 0.22.3 (2025-02-04)
- Ability to enable / disable query refreshing individually for each query (REFRESH / NO REFRESH statement)
- (Advanced) Added ability to show SQL execution plan for the query

# 0.22.2 (2025-02-01)
- Added index to tags.tag which was missed in the last release

# 0.22.1 (2025-02-01)
- Added indexes to the `files`, `tags`, `links` and `tasks` tables. This should speed up a lot of common queries performed agains these tables.

# 0.22.0 (2025-01-31)
Breaking change: `created_at` and `modified_at` has been changed from JS unix epoch to ISO 8601 dates (human readable). Thanks to that many of date operations are now easier to perform.
Example, extracting year from the creation date:
Before: `strftime("%Y", datetime(ROUND(created_at / 1000), 'unixepoch'))`
Now: `strftime("%Y", created_at)`


# 0.21.3 (2025-01-31)
- fix: fixed issue with inline queries breaking rendering

# 0.21.2 (2025-01-30)
- feat: now dynamic refreshing of the views can be disabled in the settings

# 0.21.1 (2025-01-30)
- feat: ability to register new tables from other plugins

# 0.21.0 (2025-01-30)
- feat: other plugins can now register custom database functions
- feat: improved API for other plugins
- chore: added subproject to release types for other plugins to use. See [`@hypersphere/sqlseal` package in NPM](https://www.npmjs.com/package/@hypersphere/sqlseal) for more info.

# 0.20.0 (2025-01-28)
Added `links` table containing all the references between files. [Read more about the file structure in our documentation](https://hypersphere.blog/sql-seal/data-sources/vault-data.html#links-table)

# 0.19.2 (2025-01-27)
Fixed issue with files and folders containing dots in them.

# 0.19.1 (2025-01-27)
Added logging for unprocessable data to help reporting.

# 0.19.0 (2025-01-24)
Adding support for JSON and JSON5 files. You can now query these data types and create tables based on them. You can use JSONPath to traverse the JSON files and extract data from it. [See more in the documentation](http://hypersphere.blog/sql-seal/data-sources/json-and-json5.html).

Added support for viewing JSON files. For now it is very simple preview with plans to expand in the future. You can disable this preview in the settings.

# 0.18.1 (2025-01-23)
Adding created_at, modified_at and file_size field to files table.
Also added documentation and fixed issue with files not refreshing already visible views.

# 0.18.0 (2025-01-23)
Synchronisation code has been greatly refactored. Thanks to that many common issue with files not being refreshed or pointing to the wrong file occasionally should be fixed.
Also fixed many instances of potential memory leaks. Now plugin should be more stable and reliable.

# 0.17.0 (2025-01-20)
Adding support for `LIST` view. You can now set custom classes for `HTML` (table) view.

# 0.16.1 (2025-01-17)
Fixed issue with variables causing error. Now you can pass variables from your frontmatter with no problem.

# 0.16.0 (2025-01-16)
Now you can query tables in your note and use them as data source! [Check more information in the documentation](http://hypersphere.blog/sql-seal/query-markdown-tables.html).

# 0.15.0 (2025-01-15)
This version brings plenty of the bugfixes
- fix: fix issue with local links not being clickable
- fix: query is now less case sensitive. You can use keywords like `TABLE`, `HTML`, `MARKDOWN` in any casing you want
- fix: improved SQL parser - now more complex syntax like recursive CTE, window functions, etc. should work properly. Migrated from `node-sql-parser` to `sql-parser-cst`
- fix: codeblocks now observe only the tables that are relevant to them instead of all. This should fix some tables refresh too often

# 0.14.1 (2025-01-13)
- fix: fixed the issue where rows with extra data in them (rows with more columns that a header) were not synchronised correctly
- fix: fixed the issue where queries with lowercase SELECT would not work in certain cases.

# 0.14.0 (2025-01-10)
Added support for inline code blocks. Create a codeblock (backtick `) and use prefix S> to indicate it's SQLSeal query.

# 0.13.0 (2025-01-09)
Huge upgrade to the code codebase. SQLSeal should be now much faster and more reliable thanks to the following:
- Rewritten how files are synched - now each CSV file creates AT MOST one table in the database (synchronisations are being reused accross files)
- Rewritten SQL parser - this enables using more advanced SQLite functionality like recursive CTEs, UNIONS and `json_each`!
- (minor, technical): code got restructured and fixed so it's easier to contribute.

# 0.12.4 (2025-01-09)
- added "Create CSV file" option in context menu in file explorer.

# 0.12.3 (2024-12-20)
- fix: Fixing completed flag in tasks being reversed

# 0.12.2 (2024-12-20)
fix: Fixed issue with CTE table names being incorrectly processed causing error

# 0.12.1 (2024-12-20)
fix: Fixed issue with the library on mobile - now it should load properly.

# 0.12.0 (2024-12-19)
This update does not bring any functionality changes yet but it fixes some problems with underlying architecture, helping to make SQLSeal more efficient in the future. If you work with many datasets, you might see slightly smaller memory usage as the database is now persisted in the IndexedDb (tech comment: as block storage).
Technical update:
Database has been moved to WebWorker, making data loading and retrieval slightly more efficient. Also integrated with [Absurd-SQL](https://github.com/jlongster/absurd-sql) which allows to store SQLite inside IndexedDb block storage, meaning it can be persisted and offloaded from the memory. Due to Obsidian API limitations, we still need to load huge files CSV to the memory instead of streaming their content but once the content is loaded, the memory usage should significantly go down now. More changes using this update to come soon!

# 0.11.0 (2024-11-24)
The biggest update yet with plenty of exciting features:

Added CSV Viewer! Now you can see all your CSV files in your vault in the file explorer and open it to preview the data. You can also edit the data in place (remember always to backup your files!)
Added different renderer methods: you can now use GRID (default), HTML (standard table) and MARKDOWN (renders markdown / ASCII text representation of the table).
Added "tasks" table with all tasks from across the vault
Now the files in the queries are resolved relatively to the file they are in. You can also use leading slash (/) to force fetching from the root of the vault or relative paths (./, ../) to traverse the tree down from your location.
Added more lax parser implementation for now
Minor: updated dependencies to the latest versions

# 0.10.1 (2024-11-07)
Many small fixes:
- Changed how parsing is done to simplify code greatly
- Grid now supports dark mode
- Grid now supports highlighting and copy and pasting
- Restored ability to have `TABLE` syntax without select.


# 0.10.0 (2024-11-06)
SQLSeal is now compatible with mobile! Plugin now uses SQL.JS instead of better-sqlite3 which is written in Web Assembly so no longer native binaries are needed. This makes plugin portable.
Also reworked implementation of the parser from Antlr4TS into Antlr4.

# 0.9.2 (2024-11-03)
Adding checkbox method to display boolean values as checkboxes
Fixing how updates are parsed

# 0.9.1 (2024-11-03)
Turning off verbose mode

# 0.9.0 (2024-11-03)
We now use proper grid library to render data. This allow for many great features like pagination, sorting and more visally pleasing UI out of the box.
Rewritten internal communication to use Signals.

# 0.8.0 (2024-09-05)
Now you can embed links and images (both local and external). Introduced `a` and `img` custom SQL functions.

# 0.7.0 (2024-09-02)
A lot of changes packed in this one! Now SQLSeal is parsing the input using proper language parser (thanks to ANTLR4) rather than relying on RegExes. This finally allows for proper support of CTE statements (WITH) and fixes a lot of other minor problems with the syntax.
Also improved the way files are being observed and updated which should lead to performance improvements.

# 0.6.0 (2024-09-01)
- fixing CSV loading when names has been converted to camelCase
- Fixing constantly reloading files when modifying sql inside the same block that has table declaration in
- Auto-parsing JSON values with JSON5
- Better errors when error occurs in select statement

# 0.5.0 (2024-08-25)
- Adding support for JSON objects! Automatically detecting JSON in the frontmatter and converting it to JSON type in SQLite. You can query fields using built-in SQLite functions like `json_extract`, `json_array_length`, etc. More about SQlite functionality [can be found here.](https://www.sqlite.org/json1.html).
- Fixed issue with bookean types not being saved properly.

# 0.4.1 (2024-08-25)
- Fixed issue with potential duplicate column sql error when two different fields resolve to the same uppercase structure

# 0.4.0 (2024-08-23)
- Fixed issue with better_sqlite3 not loading on different systems and architectures

# 0.3.0 (2024-08-23)
- Added ability to query files in the fault directly.
- Added observability - when CSV or file in the vault is changed, all SELECTS that uses it should update too
- Added custom class to sqlseal tables and ability to scroll vertically when the data is overflowing horizontally. 

# 0.1.0 (2024-06-23)
- Initial release. Allows to create tables based on CSV files in your vault and query them using SQL.
