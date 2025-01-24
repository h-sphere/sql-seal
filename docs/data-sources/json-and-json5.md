# Data Source: JSON and JSON5

You can query JSON and JSON5 files. To link to your file:

```
TABLE data = file(path.json, $.results[*])
```

`data` is the table alias. You can use it in your queries. `path.json` is a path to your JSON (or JSON5) file within your vault.
The second argument is an (optional) JSONPath to narrow down your JSON to a specific path within the JSON where your data is being kept.

The resulting value needs to be an array of objects. If your JSON is an object with array data nested somewhere, use JSONPath to narrow it down.

## JSONPath query example
Let's assume we have the following JSON file:
```json5
{
    results: {
        latest: [
            { id: 1, value: 155 },
            { id: 2, value: 434 },
            { id: 3, value: 234 },
            { id: 4, value: 54234 },
            { id: 5, value: 432 },
        ]
    }
}
```

You can use this file in SQLSeal by narrowing it to the nested array `$.results.latest[*]`:

```sqlseal
TABLE data = file(data.json5, $.results.latest[*])

SELECT id, value FROM data
```

For more details about JSONPath visit [official syntax definition](https://www.rfc-editor.org/rfc/rfc9535.html) and [online evaluator](https://jsonpath.com/).