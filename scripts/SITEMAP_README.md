# Sitemap Generation

This script automatically generates a dynamic sitemap for nikasrealtors.com that includes:
- All static pages (home, projects, properties, rentals, blog, media, about, contact)
- All published project pages with slugs
- All property listings (for sale)
- All rental listings (for rent)
- Last modification dates from Firestore

## Usage

### Manual Generation
```bash
npm run generate-sitemap
```

### Automatic Generation
The sitemap is automatically generated during the build process:
```bash
npm run build
npm run build:prod
```

## Sitemap Location
The generated sitemap is available at: `https://nikasrealtors.com/sitemap.xml`

## robots.txt
The robots.txt file points to the sitemap:
```
Sitemap: https://nikasrealtors.com/sitemap.xml
```

## Features
- Dynamic fetching from Firestore
- Last modification dates from updatedAt or createdAt fields
- Filters out properties with `noindex` SEO setting
- Separate URLs for sales and rentals
- Proper priority and changefreq settings
- Accessible at `/sitemap.xml` via Vercel/Netlify rewrites

## Caching
- Sitemap XML is cached for 1 hour (3600 seconds) on both Vercel and Netlify
- Regenerate after major content updates

## API Integration
To integrate with a CI/CD pipeline or webhook:
```bash
node scripts/generate-sitemap.js
```

## Errors
If Firestore is unavailable, the script will fail gracefully and log an error without breaking the build.
