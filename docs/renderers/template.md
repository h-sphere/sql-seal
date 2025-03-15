# Template Renderer
Introduced in version 0.28.0.

Template renderer allows you to render your data using custom Handlebars template. It allows for greater control over how your resulting data is structured, allowing you to generate any HTML markdown you wish.
Data from the query is exposed as `data` variable.

Learn more about handlebars syntax [in their official documentation](https://handlebarsjs.com/guide/).

## Variables
The following variables are exposed
| Variable   | Description                                        |
| ---------- | -------------------------------------------------- |
| data       | Array of the data returned by the SELECT statement |
| columns    | Array of column names                              |
| properties | Object containing all properties of the file       |


## Example
```sql
TEMPLATE
Current Path: {{properties.path}}
{{#each data}}
    <div>{{path}}</div>
{{/each}}

SELECT * FROM files LIMIT 10
```

