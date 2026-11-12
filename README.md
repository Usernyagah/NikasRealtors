Nikas Realty

## SEO page generation

Production builds generate the sitemap and prerender the homepage, listing pages, and published project/property detail pages from Firestore. Property URLs use Firestore document IDs; project URLs use published slugs.

If Firestore requires authentication during the build, configure `FIREBASE_ACCESS_TOKEN`, `FIREBASE_SERVICE_ACCOUNT_JSON`, or `GOOGLE_APPLICATION_CREDENTIALS` in the deployment environment. The generator queries published projects and sale/rental records. Do not commit credentials; use a dedicated build identity with appropriately restricted read access.
