# Using properties
You can use properties to customise your queries and make them dynamic. This can be helpful if you plan to reuse your queries accross multiple files or use them in the templates.

You can refer to your properties in all 3 ways SQLite allows for it:
- `@` symbol, for example `@year`
- `?` symbol, for example `?date`
- `:` symbol, for example `:category`