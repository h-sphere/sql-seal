# 0.10.1
Many small fixes:
- Changed how parsing is done to simplify code greatly
- Grid now supports dark mode
- Grid now supports highlighting and copy and pasting
- Restored ability to have `TABLE` syntax without select.


# 0.10.0
SQLSeal is not compatible with mobile! Plugin now uses SQL.JS instead of better-sqlite3 which is written in Web Assembly so no longer native binaries are needed. This makes plugin portable.
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