Nikas Realty

## SEO page generation

Production builds generate the sitemap and prerender the homepage, listing pages, and published project/property detail pages from Firestore. Property URLs use Firestore document IDs; project URLs use published slugs. The generated pages and sitemap refresh during each deployment.

If Firestore requires authentication during the build, configure `FIREBASE_ACCESS_TOKEN`, `FIREBASE_SERVICE_ACCOUNT_JSON`, or `GOOGLE_APPLICATION_CREDENTIALS` in the deployment environment. The generator queries published projects and sale/rental records. Do not commit credentials; use a dedicated build identity with appropriately restricted read access.

## Daily SEO revalidation

For Vercel deployments, create a production Deploy Hook in Vercel and save its URL as the GitHub Actions secret `VERCEL_DEPLOY_HOOK_URL`. The `Revalidate SEO pages` workflow triggers a production deployment daily at 03:17 UTC and can also be run manually from GitHub Actions. Each deployment rebuilds the Firestore-backed prerendered pages and sitemap. The workflow fails explicitly if the secret is not configured.
