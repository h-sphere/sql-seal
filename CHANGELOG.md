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