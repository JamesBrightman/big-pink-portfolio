This project uses Next.js and exports a static site for GitHub Pages.

## Local development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub Pages build

Build the static export with:

```bash
npm run build:pages
```

This writes the production-ready static site to `out/`.

## Deployment

GitHub Pages deployment is handled by `.github/workflows/deploy-pages.yml`. On pushes to `main`, the workflow:

1. installs dependencies
2. runs `npm run build:pages`
3. uploads `out/`
4. deploys the exported site to GitHub Pages

## Asset updates

Because the site is now static, browser uploads are disabled.

To update content:

1. add or edit files under `public/assets`
2. update the matching `data.json`
3. rebuild and redeploy
