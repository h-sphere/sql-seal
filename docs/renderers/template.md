# Template Renderer
Introduced in version 0.28.0.

Template renderer allows you to render your data using custom Handlebars template. It allows for greater control over how your resulting data is structured, allowing you to generate any HTML markdown you wish.
Data from the query is exposed as `data` variable.

Learn more about handlebars syntax [in their official documentation](https://handlebarsjs.com/guide/).

## Example
```sql
TEMPLATE
{{#each data}}
    <div>{{path}}</div>
{{/each}}

SELECT * FROM files LIMIT 10
```

