# The site's text, for editing

`Advice-for-a-Dollar-site-text.docx` lists every sentence a visitor can see
on the site, page by page, each with a code (HOME-06, BOX-18, PRV-22 ...).
The owner edits the right-hand column and sends the file back; the codes
are how each edit is matched to its place in the code.

`content.cjs` is the list the document is built from. `build.cjs` turns it
into the Word file; it needs the `docx` npm package, which is not a project
dependency:

```bash
cd docs/site-text
npx --yes -p docx node build.cjs
```

Not shown in the document, on purpose: the owner dashboard and the
emergency numbers (still placeholders, confirmed separately).
