---
"sqlseal": minor
---

Replace Handlebars with Nunjucks in TEMPLATE renderer

Swap the template engine from Handlebars to Nunjucks for richer template capabilities.
Nunjucks provides native groupby/unique filters, macros, template inheritance,
set/variables, and include/import directives without SQL workarounds.

Breaking change: existing templates using Handlebars syntax ({{#each}}, {{#if}}, {{#unless}})
must be updated to Nunjucks equivalents ({% for %}, {% if %}, {% set %}).
