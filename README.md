# Big Pink Portfolio

Live site: [https://www.bigpinkenergy.com/](https://www.bigpinkenergy.com/)

## Purpose

Big Pink Portfolio is a visual portfolio site for `bigpinkenergy`. It presents image and video work in a category-driven masonry gallery with:

- static route generation for portfolio sections
- lightweight metadata-driven asset management via `data.json`
- thumbnails for grid browsing
- full-size assets for expanded viewing
- GitHub Pages deployment

The app is built as a static export, so content is managed in the repository rather than through a live CMS.

## Tech Stack

- [Next.js 16](https://nextjs.org/) App Router
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [`react-virtualized`](https://github.com/bvaughn/react-virtualized) for the masonry grid
- [`sharp`](https://sharp.pixelplumbing.com/) for image conversion and thumbnail generation
- `ffprobe-static` for video dimension detection during asset indexing
- GitHub Actions for GitHub Pages deployment

## Project Structure

- [src/app](/E:/Documents/2.Projects/big-pink-portfolio/src/app) contains the App Router routes and global layout
- [src/components](/E:/Documents/2.Projects/big-pink-portfolio/src/components) contains the gallery and page components
- [src/lib/assets.ts](/E:/Documents/2.Projects/big-pink-portfolio/src/lib/assets.ts) reads asset folders, metadata, thumbnails, and media dimensions
- [public/assets](/E:/Documents/2.Projects/big-pink-portfolio/public/assets) contains full-size site assets used by the gallery
- [public/assets-thumbs](/E:/Documents/2.Projects/big-pink-portfolio/public/assets-thumbs) contains grid thumbnails
- [public/assets-originals](/E:/Documents/2.Projects/big-pink-portfolio/public/assets-originals) stores source/original media snapshots
- [scripts](/E:/Documents/2.Projects/big-pink-portfolio/scripts) contains local workflow scripts

## Commands

- `npm run dev`
  Starts local development through the local helper wrapper.

- `npm run dev:next`
  Starts plain Next.js development mode.

- `npm run build`
  Builds the production Next.js app.

- `npm run build:pages`
  Builds the static export used for GitHub Pages and writes output to `out/`.

- `npm run start`
  Starts the local production helper flow.

- `npm run start:next`
  Starts the built Next.js app directly.

- `npm run lint`
  Runs ESLint.

- `npm run thumbnails`
  Regenerates thumbnails in `public/assets-thumbs` from files in `public/assets`.

- `npm run optimize:new-images -- --dry-run`
  Lists non-WebP images in `public/assets` that the conversion workflow would process.

- `npm run optimize:new-images`
  Converts remaining `.png`, `.jpg`, and `.jpeg` images in `public/assets` to `.webp`, creates matching thumbnails, and updates the relevant `data.json` entries. Video files are skipped.

## Content Workflows

### Add a New Asset Manually

1. Add the full-size file to the correct folder under `public/assets/...`.
2. Add or update the matching entry in that folder's `data.json`.
3. If the file is already a `.webp`, run `npm run thumbnails` to generate the grid thumbnail if needed.
4. If the file is a `.png`, `.jpg`, or `.jpeg`, run `npm run optimize:new-images`.
5. Run `npm run build` to verify the portfolio still builds cleanly.

### Convert Newly Added JPG/PNG Images

Use the dry run first:

```bash
npm run optimize:new-images -- --dry-run
```

Then run the real conversion:

```bash
npm run optimize:new-images
```

This workflow:

- finds `.png`, `.jpg`, and `.jpeg` files that do not yet have a sibling `.webp`
- creates a full-size `.webp` asset in the same folder
- creates a thumbnail `.webp` in `public/assets-thumbs`
- updates the matching filename in `data.json`
- leaves the original source file in place

### Regenerate Thumbnails

If thumbnails are missing or stale, run:

```bash
npm run thumbnails
```

This reads from `public/assets` and writes thumbnail `.webp` files to `public/assets-thumbs`.

### Verify Locally

Use one of:

```bash
npm run dev
```

or:

```bash
npm run build
npm run start:next
```

## Deployment Workflow

GitHub Pages deployment is handled by [deploy-pages.yml](/E:/Documents/2.Projects/big-pink-portfolio/.github/workflows/deploy-pages.yml).

On pushes to `main`, the workflow:

1. checks out the repository
2. installs dependencies with `npm ci`
3. runs `npm run build:pages`
4. uploads `out/` as the Pages artifact
5. deploys the static export to GitHub Pages

## Static Export Notes

The site is configured for static export in [next.config.ts](/E:/Documents/2.Projects/big-pink-portfolio/next.config.ts).

Important implications:

- portfolio routes are prerendered at build time
- browser uploads are disabled in static export mode
- asset and metadata updates must happen in the repo before deployment
- GitHub Pages can serve the generated `out/` directory without a Node server
