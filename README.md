# Nikas Realty

Nikas Realty is a real estate website for discovering homes and apartments for sale or rent in Nairobi and across Kenya. The site includes property search and filtering, development project pages, real estate articles, property video tours, contact and enquiry forms, and an authenticated admin area for managing site content.

## Technology

- React 18, TypeScript, and Vite
- Tailwind CSS and shadcn/ui components
- React Router for client-side routing
- Firebase Authentication, Cloud Firestore, and Firebase Storage
- Google Analytics 4, initialized after cookie consent
- Netlify and Vercel deployment configuration

## Public pages

| Route | Description |
| --- | --- |
| `/` | Homepage, property highlights, services, and contact |
| `/sales` | Search and filter homes and properties for sale |
| `/rentals` | Search and filter homes and properties for rent |
| `/sales/:id`, `/rentals/:id` | Property details and enquiry options |
| `/projects` | Published real estate developments |
| `/projects/:slug` | Project details, unit information, and enquiries |
| `/services`, `/about`, `/contact` | Company information and contact pages |
| `/blog`, `/blog/:id` | Real estate articles |
| `/media`, `/media/:id` | Property video tours |

The admin portal is under `/admin` and requires authentication. It provides tools to manage properties, projects, blog posts, videos, team members, enquiries, newsletters, settings, and analytics.

## Local development

Install dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

The app uses the Firebase configuration in `src/config/firebase-config.js` by default. To point a local build at another Firebase project, add the relevant `VITE_FIREBASE_*` overrides to a local `.env` file:

| Variable | Firebase setting |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics measurement ID |

Firebase client API keys are public configuration, not authorization. Configure Firebase Security Rules to protect writes and restrict admin access. Never put service-account credentials in a `VITE_*` variable or commit credentials to the repository.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build, copy verification assets, prerender SEO pages, and generate the sitemap |
| `npm run build:prod` | Build in Vite production mode and generate SEO pages and sitemap |
| `npm run build:dev` | Build in Vite development mode without the post-build SEO generation steps |
| `npm run generate-sitemap` | Generate the sitemap and prerendered SEO pages using Firestore data |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## SEO page generation

Production builds generate `public/sitemap.xml` and matching files under `dist/` for the homepage, informational pages, property/project listing pages, and published project, property, blog, and video detail pages. These prerendered pages provide crawlers with route-specific content, metadata, canonical URLs, and structured data before client-side JavaScript runs.

Property, blog, and video detail URLs use Firestore document IDs. Project detail URLs use published project slugs. Draft or explicitly `noindex` projects are excluded from the generated sitemap.

The generator reads published projects, sale and rental properties, blog posts, and media records from Firestore. It uses the Firebase project configuration as a fallback; optional environment variables can provide build-time configuration or authentication:

| Variable | Purpose |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Override the Firebase API key used by the generator |
| `VITE_FIREBASE_PROJECT_ID` | Override the Firebase project ID used by the generator |
| `FIREBASE_ACCESS_TOKEN` | Use an existing Google access token for Firestore reads |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Provide service-account JSON for obtaining a build-time access token |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to a service-account JSON file |

If Firestore access requires authentication, configure one of the credentials options in the build environment and grant it only the read access required by the generator. Do not commit credentials.

## Deployment

The repository includes both `vercel.json` and `netlify.toml`. They configure the SPA fallback, prerendered detail-page rewrites, legacy URL redirects, and HTTPS/non-`www` canonical host handling. Production deployments should run `npm run build` so the sitemap and prerendered pages are refreshed from current published content.

The GitHub Actions workflow `Revalidate SEO pages` triggers a Vercel production deployment daily at 03:17 UTC and supports manual runs. Configure the GitHub Actions secret `VERCEL_DEPLOY_HOOK_URL` with a production Vercel Deploy Hook URL; the workflow reports an error if the secret is missing.

## Repository layout

- `src/pages/` — public routes and admin pages
- `src/components/` — shared UI and page sections
- `src/services/firestore/` — Firestore data access
- `src/config/` — application, Firebase, and SEO configuration
- `scripts/generate-sitemap.js` — sitemap and prerender generation
- `public/robots.txt` and `public/sitemap.xml` — crawler directives and generated sitemap
