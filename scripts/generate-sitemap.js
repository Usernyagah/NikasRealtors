import fs from 'fs';
import path from 'path';
import { createSign } from 'node:crypto';
import { fileURLToPath } from 'url';
import { FIREBASE_CONFIG } from '../src/config/firebase-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const SITE_URL = 'https://nikasrealtors.com';
const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
const today = new Date().toISOString().slice(0, 10);
let htmlTemplate;
let accessTokenPromise;

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const toDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
};

const decodeValue = (value) => {
  if (!value || typeof value !== 'object') return value;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return value;
};

const decodeFields = (fields = {}) => Object.fromEntries(
  Object.entries(fields).map(([key, value]) => [key, decodeValue(value)])
);

const base64Url = (value) => Buffer.from(value)
  .toString('base64')
  .replaceAll('+', '-')
  .replaceAll('/', '_')
  .replace(/=+$/, '');

const getAccessToken = async () => {
  if (process.env.FIREBASE_ACCESS_TOKEN) return process.env.FIREBASE_ACCESS_TOKEN;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccountJson && !serviceAccountPath) return undefined;
  if (!accessTokenPromise) {
    accessTokenPromise = (async () => {
      const serviceAccount = serviceAccountJson
        ? JSON.parse(serviceAccountJson)
        : JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      if (!serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error('The Firebase service account must include client_email and private_key.');
      }

      const now = Math.floor(Date.now() / 1000);
      const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const claims = base64Url(JSON.stringify({
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/datastore',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      }));
      const unsignedAssertion = `${header}.${claims}`;
      const signature = createSign('RSA-SHA256')
        .update(unsignedAssertion)
        .sign(serviceAccount.private_key.replaceAll('\\n', '\n'), 'base64');
      const assertion = `${unsignedAssertion}.${base64Url(Buffer.from(signature, 'base64'))}`;
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion,
        }),
      });
      if (!response.ok) {
        throw new Error(`Google OAuth token request failed with HTTP ${response.status}`);
      }
      const result = await response.json();
      if (!result.access_token) throw new Error('Google OAuth response did not contain an access token.');
      return result.access_token;
    })();
  }
  return accessTokenPromise;
};

const fetchCollection = async (collectionName, statuses, fieldPaths) => {
  const accessToken = await getAccessToken();
  const apiKey = process.env.VITE_FIREBASE_API_KEY || FIREBASE_CONFIG.apiKey;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || FIREBASE_CONFIG.projectId;
  const documents = [];
  const endpoint = new URL(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`
  );
  if (!accessToken) endpoint.searchParams.set('key', apiKey);
  const pageSize = 1000;

  for (const status of statuses) {
    let cursor;
    while (true) {
      const structuredQuery = {
        select: { fields: fieldPaths.map((fieldPath) => ({ fieldPath })) },
        from: [{ collectionId: collectionName }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'status' },
            op: 'EQUAL',
            value: { stringValue: status },
          },
        },
        orderBy: [{ field: { fieldPath: '__name__' }, direction: 'ASCENDING' }],
        limit: pageSize,
        ...(cursor ? { startAt: { values: [{ referenceValue: cursor }], before: false } } : {}),
      };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ structuredQuery }),
      });
      if (!response.ok) {
        const accessHint = !accessToken && response.status === 403
          ? ' Configure FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS with Firestore read access.'
          : '';
        throw new Error(`Firestore ${collectionName} request failed with HTTP ${response.status}.${accessHint}`);
      }

      const result = await response.json();
      const page = result.map((row) => row.document).filter(Boolean);
      documents.push(...page.map((document) => ({
        id: document.name?.split('/').pop(),
        ...decodeFields(document.fields),
      })));
      if (page.length < pageSize) break;
      cursor = page[page.length - 1].name;
    }
  }

  return documents;
};

const asAbsoluteImage = (image) => {
  if (!image) return `${SITE_URL}/logo.png`;
  return image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? image : `/${image}`}`;
};

const propertyPath = (property) => {
  const status = String(property.status || '').toLowerCase();
  const section = status === 'for-rent' || status === 'for rent'
    ? 'rentals'
    : status === 'for-sale' || status === 'for sale'
      ? 'sales'
      : null;
  return section && property.id ? `/${section}/${encodeURIComponent(property.id)}` : null;
};

const makeMetaDescription = (description, name, location) => {
  const cleaned = String(description || '').replace(/\s+/g, ' ').trim();
  const value = cleaned || `Explore ${name} in ${location} with Nikas Realty.`;
  return value.length > 160 ? `${value.slice(0, 157).trimEnd()}...` : value;
};

const renderLinks = (items) => items.map((item) => `
      <li><a href="${escapeHtml(item.path)}">${escapeHtml(item.name)}</a>${item.location ? ` — ${escapeHtml(item.location)}` : ''}${item.price ? ` — ${escapeHtml(item.price)}` : ''}</li>`).join('');

const makePageHtml = ({ title, description, path: pagePath, image, structuredData, content }) => {
  const url = `${SITE_URL}${pagePath === '/' ? '' : pagePath}`;
  const safeJsonLd = JSON.stringify(structuredData).replaceAll('<', '\\u003c');
  let html = htmlTemplate;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  html = html.replace(/<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta\s+property="og:image"[^>]*>/i, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  html = html.replace(/<meta\s+name="twitter:url"[^>]*>/i, `<meta name="twitter:url" content="${escapeHtml(url)}" />`);
  html = html.replace(/<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta\s+name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta\s+name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  html = html.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(url)}" />`);
  html = html.replace('</head>', `<script type="application/ld+json">${safeJsonLd}</script>\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
  return html;
};

const writePrerenderedPage = (routePath, page) => {
  const outputPath = path.join(rootDir, 'dist', routePath.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, makePageHtml({ ...page, path: routePath }), 'utf8');
};

const listingContent = (title, items) => `
    <main>
      <h1>${escapeHtml(title)}</h1>
      <ul>${renderLinks(items)}
      </ul>
      <nav aria-label="Main navigation">
        <a href="/">Home</a> · <a href="/projects">Projects</a> · <a href="/sales">Sales</a> · <a href="/rentals">Rentals</a> · <a href="/blog">Blog</a>
      </nav>
    </main>`;

const formatPrice = (property) => {
  const rawPrice = property.priceMonthly || property.priceDaily || property.price || property.priceFrom;
  if (rawPrice === undefined || rawPrice === null || rawPrice === '') return '';
  const amount = typeof rawPrice === 'number' ? rawPrice.toLocaleString('en-KE') : rawPrice;
  const period = property.priceMonthly ? ' / Month' : property.priceDaily ? ' / Day' : '';
  return `KES ${amount}${period}`;
};

const propertyStructuredData = (property, pathName, title, description, image, location) => ({
  '@context': 'https://schema.org',
  '@type': 'RealEstateListing',
  name: title,
  description,
  url: `${SITE_URL}${pathName}`,
  image,
  address: {
    '@type': 'PostalAddress',
    addressLocality: location,
    addressCountry: 'KE',
  },
  ...(property.price || property.priceMonthly || property.priceDaily ? {
    offers: {
      '@type': 'Offer',
      price: String(property.priceMonthly || property.priceDaily || property.price),
      priceCurrency: 'KES',
      businessFunction: pathName.startsWith('/rentals/')
        ? 'https://schema.org/LeaseOut'
        : 'https://schema.org/Sell',
    },
  } : {}),
});

export async function generateSitemap() {
  const [allProjects, salesDocuments, rentalDocuments] = await Promise.all([
    fetchCollection('projects', ['published'], [
      'name', 'slug', 'location', 'neighborhood', 'county', 'country',
      'shortDescription', 'fullDescription', 'startingPrice', 'featuredImage',
      'gallery', 'seo', 'updatedAt', 'publishedAt', 'createdAt',
    ]),
    fetchCollection('properties', ['for-sale', 'For Sale'], [
      'title', 'status', 'location', 'description', 'price', 'priceType', 'priceDaily',
      'priceMonthly', 'priceFrom', 'images', 'image', 'gallery', 'updatedAt',
      'createdAt', 'bedrooms', 'bathrooms',
    ]),
    fetchCollection('properties', ['for-rent', 'For Rent'], [
      'title', 'status', 'location', 'description', 'price', 'priceType', 'priceDaily',
      'priceMonthly', 'priceFrom', 'images', 'image', 'gallery', 'updatedAt',
      'createdAt', 'bedrooms', 'bathrooms',
    ]),
  ]);
  const allProperties = [...salesDocuments, ...rentalDocuments];
  const projects = allProjects.filter((project) =>
    project.slug &&
    project.name &&
    project.seo?.searchEngineIndexing !== 'noindex'
  ).sort((a, b) =>
    new Date(b.publishedAt || b.createdAt || 0).getTime() -
    new Date(a.publishedAt || a.createdAt || 0).getTime()
  );
  const properties = allProperties.filter((property) => property.title && propertyPath(property));
  const newestFirst = (a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  const sales = properties.filter((property) => propertyPath(property)?.startsWith('/sales/')).sort(newestFirst);
  const rentals = properties.filter((property) => propertyPath(property)?.startsWith('/rentals/')).sort(newestFirst);

  const staticEntries = [
    { loc: `${SITE_URL}/`, freq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/projects`, freq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/sales`, freq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/rentals`, freq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/blog`, freq: 'weekly', priority: '0.7' },
  ].map((entry) => ({ ...entry, lastmod: today }));

  const listingEntries = [
    ...projects.map((project) => ({
      loc: `${SITE_URL}/projects/${encodeURIComponent(project.slug)}`,
      freq: 'weekly',
      priority: '0.8',
      lastmod: toDate(project.updatedAt || project.publishedAt || project.createdAt) || today,
    })),
    ...[...sales, ...rentals].map((property) => ({
      loc: `${SITE_URL}${propertyPath(property)}`,
      freq: 'weekly',
      priority: '0.8',
      lastmod: toDate(property.updatedAt || property.createdAt) || today,
    })),
  ];
  const entries = [...staticEntries, ...listingEntries];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((entry) => `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>\n    <changefreq>${escapeXml(entry.freq)}</changefreq>\n    <priority>${escapeXml(entry.priority)}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(sitemapPath, xml, 'utf8');

  const projectItems = projects.map((project) => ({
    name: project.name,
    location: project.neighborhood ? `${project.neighborhood}, ${project.location}` : project.location,
    path: `/projects/${encodeURIComponent(project.slug)}`,
    price: project.startingPrice ? `From KES ${Number(project.startingPrice).toLocaleString('en-KE')}` : '',
  }));
  const saleItems = sales.map((property) => ({
    name: property.title,
    location: property.location,
    path: propertyPath(property),
    price: formatPrice(property),
  }));
  const rentalItems = rentals.map((property) => ({
    name: property.title,
    location: property.location,
    path: propertyPath(property),
    price: formatPrice(property),
  }));

  if (fs.existsSync(path.join(rootDir, 'dist', 'index.html'))) {
    htmlTemplate = fs.readFileSync(path.join(rootDir, 'dist', 'index.html'), 'utf8');
    const makeListingPage = (route, title, description, items) => writePrerenderedPage(route, {
      title,
      description,
      image: `${SITE_URL}/logo.png`,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url: `${SITE_URL}${route}`,
        hasPart: items.map((item) => ({ '@type': 'RealEstateListing', name: item.name, url: `${SITE_URL}${item.path}` })),
      },
      content: listingContent(title, items),
    });

    makeListingPage('/projects', 'Real Estate Projects in Kenya | Nikas Realty', 'Browse current real estate projects and developments in Kenya.', projectItems);
    makeListingPage('/sales', 'Properties for Sale in Kenya | Nikas Realty', 'Browse homes and properties for sale in Kenya.', saleItems);
    makeListingPage('/rentals', 'Properties for Rent in Kenya | Nikas Realty', 'Browse homes and properties for rent in Kenya.', rentalItems);

    const homeGroups = [
      ['Latest Projects', projectItems.slice(0, 3)],
      ['Featured Properties for Sale', saleItems.slice(0, 3)],
      ['Featured Rentals', rentalItems.slice(0, 3)],
    ].map(([heading, items]) => `<section><h2>${escapeHtml(heading)}</h2><ul>${renderLinks(items)}</ul></section>`).join('');
    writePrerenderedPage('/', {
      title: 'Apartments & Homes for Sale and Rent in Kenya | Nikas Realty',
      description: 'Find apartments, houses, maisonettes and luxury homes for sale and rent in Nairobi, Kenya with Nikas Realty.',
      image: `${SITE_URL}/logo.png`,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Nikas Realty',
        url: SITE_URL,
        mainEntity: [...projectItems, ...saleItems, ...rentalItems].map((item) => ({
          '@type': 'RealEstateListing',
          name: item.name,
          url: `${SITE_URL}${item.path}`,
        })),
      },
      content: `<main><h1>Nikas Realty — Properties in Kenya</h1>${homeGroups}<nav aria-label="Main navigation"><a href="/projects">Projects</a> · <a href="/sales">Sales</a> · <a href="/rentals">Rentals</a> · <a href="/blog">Blog</a></nav></main>`,
    });

    for (const project of projects) {
      const route = `/projects/${encodeURIComponent(project.slug)}`;
      const name = project.name;
      const location = project.neighborhood ? `${project.neighborhood}, ${project.location}` : project.location;
      const description = makeMetaDescription(project.seo?.metaDescription || project.shortDescription || project.fullDescription, name, location);
      const image = asAbsoluteImage(project.seo?.socialSharingImage || project.featuredImage || project.gallery?.[0]);
      const title = `${name} in ${location} | Nikas Realty`;
      const price = project.startingPrice ? `From KES ${Number(project.startingPrice).toLocaleString('en-KE')}` : 'Price on request';
      writePrerenderedPage(route, {
        title,
        description,
        image,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'RealEstateListing',
          name,
          description: project.fullDescription || project.shortDescription || description,
          url: `${SITE_URL}${route}`,
          image,
          address: {
            '@type': 'PostalAddress',
            addressLocality: location,
            addressRegion: project.county || 'Nairobi',
            addressCountry: project.country || 'KE',
          },
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'KES',
            lowPrice: project.startingPrice,
            availability: 'https://schema.org/InStock',
          },
        },
        content: `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> · <a href="/projects">Projects</a></nav><h1>${escapeHtml(name)}</h1><p>${escapeHtml(location)}</p><p>${escapeHtml(price)}</p><p>${escapeHtml(project.fullDescription || project.shortDescription || description)}</p><p><a href="/projects">Browse all projects</a></p></main>`,
      });
    }

    for (const property of [...sales, ...rentals]) {
      const route = propertyPath(property);
      const name = property.title;
      const location = property.location || 'Kenya';
      const description = makeMetaDescription(property.description, name, location);
      const image = asAbsoluteImage(property.images?.[0] || property.image || property.gallery?.[0]);
      const title = `${name} in ${location} | Nikas Realty`;
      const price = formatPrice(property) || 'Price on request';
      writePrerenderedPage(route, {
        title,
        description,
        image,
        structuredData: propertyStructuredData(property, route, name, description, image, location),
        content: `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> · <a href="${route.startsWith('/rentals/') ? '/rentals' : '/sales'}">${route.startsWith('/rentals/') ? 'Rentals' : 'Sales'}</a></nav><h1>${escapeHtml(name)}</h1><p>${escapeHtml(location)}</p><p>${escapeHtml(price)}</p><p>${escapeHtml(property.description || description)}</p><p><a href="${route.startsWith('/rentals/') ? '/rentals' : '/sales'}">Browse more properties</a></p></main>`,
      });
    }
  }

  const distSitemap = path.join(rootDir, 'dist', 'sitemap.xml');
  if (fs.existsSync(path.dirname(distSitemap))) {
    fs.writeFileSync(distSitemap, xml, 'utf8');
  }
  console.log(`Generated sitemap with ${entries.length} URLs and prerendered ${projects.length + sales.length + rentals.length + 4} routes.`);
}

export function updateSitemapWithProjects() {
  console.warn('updateSitemapWithProjects is deprecated. Use generateSitemap() instead.');
  return generateSitemap();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSitemap().catch((error) => {
    console.error('Failed to generate SEO pages and sitemap:', error);
    process.exitCode = 1;
  });
}
