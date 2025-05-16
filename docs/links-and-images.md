# Links and Images
Introduced in version 0.8. Make sure you are using up to date version.

SQLSeal allows for rendering links and images. For now the images needs to be external ones (no support for stored images for now but should be added in the future releases).

## Links
To display a link, wrap use the `a` SQL function, for example:
```sqlseal
SELECT a(path) FROM files LIMIT 10
```
![Example of links](./links.png)

You can use second parameter to provide name for the link:

```sqlseal
SELECT a(path, name) from files LIMIT 10
```


This API works for both filesystem and CSV files.

## Images
You can embed images within your results. You need to wrap your resulting column with `img` function.

```sqlseal
SELECT name, img(coverImg) FROM files
```

### Local images
When using local images (stored in Obsidian) you need to pass second parameter being path of the original note. For example:

```sqlseal
SELECT path, img(cover, path) FROM files
```

## Advanced Examples
The example below uses [Goodreads-books](https://www.kaggle.com/datasets/jealousleopard/goodreadsbooks) Kaggle dataset in CSV loaded in obsidian to display books with links to Open Library and showing the covers from Open Library Cover API. It uses Obsidian property to filter the author name.


```sqlseal
TABLE books = file(books.csv)

SELECT
	a(title, 'https://openlibrary.org/isbn/' || CAST(isbn13 as int)) as title,
	authors,
	img('https://covers.openlibrary.org/b/isbn/' || CAST(isbn13 as INT) || '-L.jpg') as cover FROM books
WHERE authors
	LIKE '%' || @author || '%'
LIMIT 10
```

> [!NOTE] Type Casting
> In the example above we need to cast isbn13 (which is the number) to integer so SQLite properly uses it. Without casting it would behave like a REAL number and would have `.0` added in the end. SQLite (which we use as an engine) [treats types quite loosely](https://www.sqlite.org/datatype3.html) so you might run into small problems like that once in a while when doing very advanced processing.

![Advanced links and images](links-and-images-advanced.png)

## Checkboxes
You can display boolean data as checkbox in the interface by calling `checkbox` function:
```sqlseal
SELECT date, checkbox(excercised) FROM files WHERE date is not null
```

### Interactive Task Checkboxes

SQLSeal provides two ways to create interactive checkboxes for tasks:

#### Method 1: Direct checkbox column (Recommended)
The simplest and most reliable approach is to directly use the `checkbox` column:

```sqlseal
SELECT checkbox, task FROM tasks
```

This approach automatically renders interactive checkboxes without requiring any function wrappers, making your queries cleaner and more maintainable.

#### Method 2: Using the `checkbox` function
For backwards compatibility, you can also use the checkbox function with a single parameter:

```sqlseal
-- Using the checkbox column
SELECT task, checkbox(completed) FROM tasks

The checkbox function accepts a single parameter which can be either:
- A numeric value (0 = unchecked, 1 = checked) - renders as a disabled checkbox
- Any boolean/truthy value - renders as a disabled checkbox

> [!NOTE] Interactive vs Disabled Checkboxes
> Only checkboxes created using the `checkbox` column are interactive. When using the `completed` column or other values, the checkbox will be rendered in a disabled state to indicate it cannot be modified.

