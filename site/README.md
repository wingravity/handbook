# How the site is built

Every `.md` file in this repo is a page on docs.wingravity.com, at the same path:
`handbook/how-we-work.md` is `docs.wingravity.com/handbook/how-we-work/`, and a
folder's `index.md` is the folder's own page.

`README.md` at the root is the home page and the table of contents. Each
`## [Section](section/index.md)` heading and the list of links under it are the
navigation, in that order. To add a page, write the file and add a link to it
there. A `##` heading with no list under it is a page on its own, like the
manifesto. A page that README.md does not link to is still published, just
not listed.

Each page starts with a `# Title`. If a paragraph follows it directly, that
paragraph is the page's lede: the larger intro line, and the summary shown on
cards and in search results.

Link between pages with relative `.md` links, e.g. `[Expectations](expectations.md)`.
They work on GitHub and become site URLs in the build.

## Publishing

Every push to `main` builds and publishes the site through GitHub Actions
(`.github/workflows/pages.yml`). Editing a file in GitHub's web editor is enough.

The look comes from `@wingravity/brand` in
[wingravity/branding](https://github.com/wingravity/branding): colours, Kanit and
Space Mono, the wordmark and the icon. The build checks that repo out fresh, so
a brand change shows up on the next publish. To publish one straight away, run
the workflow by hand (Actions → Publish → Run workflow).

## Previewing locally

```sh
npm install
npm run preview   # http://localhost:4390
```

The build expects a checkout of wingravity/branding at `../wingravity-branding`,
or wherever `BRANDING_DIR` points.
