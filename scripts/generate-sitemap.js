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
      <li>
        <a href="${escapeHtml(item.path)}">${escapeHtml(item.name)}</a>
        ${item.location ? `<p>${escapeHtml(item.location)}</p>` : ''}
        ${item.price ? `<p>${escapeHtml(item.price)}</p>` : ''}
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
      </li>`).join('');

const makePageHtml = ({ title, description, path: pagePath, image, type = 'website', structuredData, content }) => {
  const url = `${SITE_URL}${pagePath === '/' ? '' : pagePath}`;
  const safeJsonLd = JSON.stringify(structuredData).replaceAll('<', '\\u003c');
  let html = htmlTemplate;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta\s+property="og:type"[^>]*>/i, `<meta property="og:type" content="${escapeHtml(type)}" />`);
  html = html.replace(/<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  html = html.replace(/<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta\s+property="og:image"[^>]*>/i, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  html = html.replace(/<meta\s+name="twitter:url"[^>]*>/i, `<meta name="twitter:url" content="${escapeHtml(url)}" />`);
  html = html.replace(/<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta\s+name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta\s+name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  html = html.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(url)}" />`);
  html = html.replace('</head>', `<script type="application/ld+json" data-nikas-seo-jsonld="true">${safeJsonLd}</script>\n  </head>`);
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
  '@graph': [
    {
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
    },
    {
      '@type': 'Residence',
      name: title,
      description,
      url: `${SITE_URL}${pathName}`,
      image,
      address: {
        '@type': 'PostalAddress',
        addressLocality: location,
        addressCountry: 'KE',
      },
    },
  ],
});

export async function generateSitemap() {
  const [allProjects, salesDocuments, rentalDocuments, allBlogs, allMedia] = await Promise.all([
    fetchCollection('projects', ['published'], [
      'name', 'slug', 'location', 'neighborhood', 'county', 'country',
      'shortDescription', 'fullDescription', 'startingPrice', 'featuredImage',
      'featuredImageAlt', 'street', 'minimumDepositPercentage',
      'paymentPlanSummary', 'pastNotableProjects', 'configurations', 'faqs',
      'gallery', 'galleryAltTexts', 'seo', 'amenities', 'expectedCompletionDate',
      'developer', 'updatedAt', 'publishedAt', 'createdAt',
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
    fetchCollection('blogs', ['published', 'Published'], [
      'title', 'summary', 'content', 'image', 'author', 'status',
      'publishedAt', 'createdAt', 'updatedAt',
    ]),
    fetchCollection('media', ['published', 'Published'], [
      'title', 'description', 'youtubeVideoId', 'propertyId', 'propertyTitle',
      'propertyLocation', 'propertyBedrooms', 'propertyType', 'category', 'status',
      'publishedAt', 'createdAt', 'updatedAt',
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
  const blogs = allBlogs.filter((blog) =>
    blog.status?.toLowerCase() === 'published' && blog.title && blog.id
  ).sort(newestFirst);
  const media = allMedia.filter((item) =>
    item.status?.toLowerCase() === 'published' && item.title && item.id && item.youtubeVideoId
  ).sort(newestFirst);

  const staticEntries = [
    { loc: `${SITE_URL}/`, freq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/about`, freq: 'monthly', priority: '0.6' },
    { loc: `${SITE_URL}/contact`, freq: 'monthly', priority: '0.6' },
    { loc: `${SITE_URL}/projects`, freq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/sales`, freq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/rentals`, freq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/services`, freq: 'weekly', priority: '0.7' },
    { loc: `${SITE_URL}/blog`, freq: 'weekly', priority: '0.7' },
    { loc: `${SITE_URL}/media`, freq: 'weekly', priority: '0.6' },
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
    ...blogs.map((blog) => ({
      loc: `${SITE_URL}/blog/${encodeURIComponent(blog.id)}`,
      freq: 'monthly',
      priority: '0.6',
      lastmod: toDate(blog.updatedAt || blog.publishedAt || blog.createdAt) || today,
    })),
    ...media.map((item) => ({
      loc: `${SITE_URL}/media/${encodeURIComponent(item.id)}`,
      freq: 'monthly',
      priority: '0.5',
      lastmod: toDate(item.updatedAt || item.publishedAt || item.createdAt) || today,
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
    description: makeMetaDescription(project.shortDescription || project.fullDescription, project.name, project.location),
  }));
  const saleItems = sales.map((property) => ({
    name: property.title,
    location: property.location,
    path: propertyPath(property),
    price: formatPrice(property),
    description: makeMetaDescription(property.description, property.title, property.location),
  }));
  const rentalItems = rentals.map((property) => ({
    name: property.title,
    location: property.location,
    path: propertyPath(property),
    price: formatPrice(property),
    description: makeMetaDescription(property.description, property.title, property.location),
  }));
  const blogItems = blogs.map((blog) => ({
    name: blog.title,
    location: blog.author ? `By ${blog.author}` : '',
    path: `/blog/${encodeURIComponent(blog.id)}`,
    description: makeMetaDescription(blog.summary || blog.content, blog.title, 'Kenya'),
  }));
  const mediaItems = media.map((item) => ({
    name: item.title,
    location: item.propertyLocation || '',
    path: `/media/${encodeURIComponent(item.id)}`,
    description: makeMetaDescription(item.description, item.title, item.propertyLocation || 'Kenya'),
  }));

  if (fs.existsSync(path.join(rootDir, 'dist', 'index.html'))) {
    htmlTemplate = fs.readFileSync(path.join(rootDir, 'dist', 'index.html'), 'utf8');
    const makeListingPage = (route, title, description, items, itemType = 'RealEstateListing') => writePrerenderedPage(route, {
      title,
      description,
      image: `${SITE_URL}/logo.png`,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url: `${SITE_URL}${route}`,
        hasPart: items.map((item) => ({ '@type': itemType, name: item.name, url: `${SITE_URL}${item.path}` })),
      },
      content: listingContent(title, items),
    });

    makeListingPage('/projects', 'Real Estate Projects in Kenya | Nikas Realty', 'Browse current real estate projects and developments in Kenya.', projectItems);
    makeListingPage(
      '/sales',
      'Apartments & Homes for Sale in Nairobi, Kenya | Nikas Realty',
      'Browse apartments, houses, maisonettes and luxury homes for sale in Nairobi and across Kenya. View current Nikas Realty listings in Westlands, Kilimani, Kileleshwa, Langata, Syokimau and more.',
      saleItems
    );
    makeListingPage(
      '/rentals',
      'Apartments & Houses for Rent in Nairobi, Kenya | Nikas Realty',
      'Find apartments and houses for rent in Nairobi, Kenya. Browse rental listings in Westlands, Kilimani, Kileleshwa, Langata, Syokimau and other neighbourhoods with Nikas Realty.',
      rentalItems
    );
    makeListingPage(
      '/blog',
      'Kenya Real Estate Blog | Apartments, Homes & Market Insights | Nikas Realty',
      'Advice and stories about buying, selling and renting apartments and homes in Nairobi and Kenya. Market insights from Nikas Realty.',
      blogItems,
      'BlogPosting'
    );
    makeListingPage(
      '/media',
      'Property Video Tours in Kenya | Apartments & Homes | Nikas Realty',
      'Watch video tours of apartments and homes for sale and rent in Nairobi and across Kenya from Nikas Realty.',
      mediaItems,
      'VideoObject'
    );

    writePrerenderedPage('/services', {
      title: 'Real Estate Services in Nairobi, Kenya | Nikas Realty',
      description: 'Property buying, renting, valuation, legal support and mortgage guidance from Nikas Realty in Nairobi, Kenya.',
      image: `${SITE_URL}/logo.png`,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Real estate services in Nairobi',
        description: 'Home purchase consultation, investment guidance, valuation, legal support and mortgage assistance from Nikas Realty.',
        url: `${SITE_URL}/services`,
      },
      content: `<main>
        <nav aria-label="Breadcrumb"><a href="/">Home</a> · <span>Real Estate Services</span></nav>
        <h1>Real Estate Services in Nairobi, Kenya</h1>
        <p>Nikas Realty helps buyers, sellers and investors make informed property decisions across Nairobi and Kenya.</p>
        <section><h2>Home Purchase Consultation</h2><p>Get guidance on finding and purchasing a home that fits your needs, budget and preferred location.</p></section>
        <section><h2>Property Investment Guidance</h2><p>Explore residential property opportunities and get practical advice for building your real estate investment portfolio.</p></section>
        <section><h2>Real Estate Valuation</h2><p>Understand property value to support informed buying, selling and investment decisions.</p></section>
        <section><h2>Legal and Documentation Assistance</h2><p>Get support with property transaction paperwork and documentation throughout the buying process.</p></section>
        <section><h2>Financing and Mortgage Support</h2><p>Explore financing and mortgage options relevant to your property purchase.</p></section>
        <p><a href="/contact">Contact Nikas Realty about our real estate services</a></p>
      </main>`,
    });

    writePrerenderedPage('/about', {
      title: 'About Nikas Realty | Real Estate Agents in Nairobi, Kenya',
      description: 'Meet the Nikas Realty team. We help clients find apartments, houses and luxury homes for sale and rent in Nairobi, including Westlands, Kilimani, Kileleshwa, Langata and Syokimau.',
      image: `${SITE_URL}/logo.png`,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About Nikas Realty',
        url: `${SITE_URL}/about`,
        description: 'Nikas Realty helps clients find apartments, houses and luxury homes for sale and rent in Nairobi, Kenya.',
      },
      content: `<main>
        <nav aria-label="Breadcrumb"><a href="/">Home</a> · <span>About Nikas Realty</span></nav>
        <h1>About Nikas Realty</h1>
        <p>At Nikas Realty, we help clients find apartments, houses and luxury homes for sale and rent in Nairobi and across Kenya. Our team offers professional advice, customized property solutions, and a seamless buying and renting experience.</p>
        <section><h2>Our Story</h2><p>Nikas Realty began with a vision to connect families, investors, and communities to high-quality homes and properties in Kenya. We aim to be a trusted real estate advisor, guided by service and integrity.</p></section>
        <section><h2>Our Mission</h2><p>To simplify the property experience in Kenya through expert advice, transparent processes, and a curated selection of homes for every need.</p></section>
        <section><h2>Our Vision and Values</h2><p>To be a trusted real estate partner, delivering value, service and innovation. Our values include integrity, excellence, customer focus, innovation and community.</p></section>
        <p><a href="/sales">Browse properties for sale</a> · <a href="/rentals">Browse properties for rent</a> · <a href="/contact">Contact our team</a></p>
      </main>`,
    });

    writePrerenderedPage('/contact', {
      title: 'Contact Nikas Realty | Apartments & Homes in Nairobi',
      description: 'Talk to Nikas Realty about apartments and homes for sale or rent in Nairobi, Kenya. Call, WhatsApp or send a message to discuss listings in Westlands, Kilimani and beyond.',
      image: `${SITE_URL}/logo.png`,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact Nikas Realty',
        url: `${SITE_URL}/contact`,
        telephone: '+254710132320',
        email: 'nikasrealty@gmail.com',
      },
      content: `<main>
        <nav aria-label="Breadcrumb"><a href="/">Home</a> · <span>Contact Nikas Realty</span></nav>
        <h1>Contact Nikas Realty</h1>
        <p>Get in touch with our team to discuss apartments and homes for sale or rent in Nairobi and across Kenya.</p>
        <address>
          <p>Phone: <a href="tel:+254710132320">+254 710 132 320</a> or <a href="tel:+254715699774">+254 715 699 774</a></p>
          <p>Email: <a href="mailto:nikasrealty@gmail.com">nikasrealty@gmail.com</a></p>
          <p>Office: Westland Arcade, Westlands, Nairobi, Kenya</p>
        </address>
        <p>Send our team a message and we will get back to you about your property needs.</p>
      </main>`,
    });

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
      content: `<main><h1>Nikas Realty — Properties in Kenya</h1><nav aria-label="Main navigation"><a href="/projects">Projects</a> · <a href="/sales">Sales</a> · <a href="/rentals">Rentals</a> · <a href="/blog">Blog</a></nav></main>`,
    });

    for (const blog of blogs) {
      const route = `/blog/${encodeURIComponent(blog.id)}`;
      const description = makeMetaDescription(blog.summary || blog.content, blog.title, 'Kenya');
      const paragraphs = String(blog.content || blog.summary || '')
        .split(/\r?\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join('\n');
      writePrerenderedPage(route, {
        title: `${blog.title} | Nikas Realty Blog`,
        description,
        image: asAbsoluteImage(blog.image),
        type: 'article',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: blog.title,
          description,
          image: asAbsoluteImage(blog.image),
          author: { '@type': 'Person', name: blog.author || 'Nikas Realty' },
          datePublished: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : undefined,
          dateModified: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : undefined,
          publisher: { '@type': 'Organization', name: 'Nikas Realty', url: SITE_URL },
          mainEntityOfPage: `${SITE_URL}${route}`,
        },
        content: `<main>
          <nav aria-label="Breadcrumb"><a href="/">Home</a> · <a href="/blog">Blog</a> · ${escapeHtml(blog.title)}</nav>
          <article>
            ${blog.image ? `<img src="${escapeHtml(asAbsoluteImage(blog.image))}" alt="${escapeHtml(blog.title)}">` : ''}
            <h1>${escapeHtml(blog.title)}</h1>
            ${blog.author ? `<p>By ${escapeHtml(blog.author)}</p>` : ''}
            ${blog.publishedAt ? `<p>Published ${escapeHtml(toDate(blog.publishedAt) || '')}</p>` : ''}
            ${blog.summary ? `<p>${escapeHtml(blog.summary)}</p>` : ''}
            ${paragraphs}
            <p><a href="/blog">Browse more real estate articles</a></p>
          </article>
        </main>`,
      });
    }

    for (const item of media) {
      const route = `/media/${encodeURIComponent(item.id)}`;
      const description = makeMetaDescription(item.description, item.title, item.propertyLocation || 'Kenya');
      const videoUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(item.youtubeVideoId)}`;
      writePrerenderedPage(route, {
        title: `${item.title} | Property Video Tour | Nikas Realty`,
        description,
        image: `https://img.youtube.com/vi/${encodeURIComponent(item.youtubeVideoId)}/hqdefault.jpg`,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: item.title,
          description,
          thumbnailUrl: [`https://img.youtube.com/vi/${encodeURIComponent(item.youtubeVideoId)}/hqdefault.jpg`],
          uploadDate: toDate(item.publishedAt || item.createdAt),
          embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.youtubeVideoId)}`,
          contentUrl: videoUrl,
          publisher: { '@type': 'Organization', name: 'Nikas Realty', url: SITE_URL },
        },
        content: `<main>
          <nav aria-label="Breadcrumb"><a href="/">Home</a> · <a href="/media">Video Tours</a> · ${escapeHtml(item.title)}</nav>
          <article>
            <h1>${escapeHtml(item.title)}</h1>
            ${item.propertyTitle ? `<p>Property: ${escapeHtml(item.propertyTitle)}</p>` : ''}
            ${item.propertyLocation ? `<p>Location: ${escapeHtml(item.propertyLocation)}</p>` : ''}
            ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
            <p><a href="${escapeHtml(videoUrl)}">Watch ${escapeHtml(item.title)} on YouTube</a></p>
            <p><a href="/media">Browse more property video tours</a></p>
          </article>
        </main>`,
      });
    }

    for (const project of projects) {
      const route = `/projects/${encodeURIComponent(project.slug)}`;
      const name = project.name;
      const location = project.neighborhood ? `${project.neighborhood}, ${project.location}` : project.location;
      const units = Array.isArray(project.configurations) ? project.configurations : [];
      const unitTitle = (unit) => unit.unitTitle || unit.unitName ||
        (unit.bedrooms ? `${unit.bedrooms} Bedroom ${unit.propertyType || ''}`.trim() : unit.propertyType || 'Apartment');
      const unitNames = units.map(unitTitle).filter(Boolean);
      const startingPrice = project.startingPrice ? Number(project.startingPrice) : undefined;
      const formattedPrice = startingPrice ? startingPrice.toLocaleString('en-KE') : '';
      const title = project.seo?.seoTitle?.trim() ||
        `${name} ${project.neighborhood || project.location}: ${unitNames.join(', ') || 'Apartments'}${formattedPrice ? ` (From KES ${formattedPrice})` : ''}`;
      const description = makeMetaDescription(project.seo?.metaDescription || project.shortDescription || project.fullDescription, name, location);
      const image = asAbsoluteImage(project.seo?.socialSharingImage || project.featuredImage || project.gallery?.[0]);
      const price = startingPrice ? `From KES ${formattedPrice}` : 'Price on request';
      const faqs = Array.isArray(project.faqs) && project.faqs.length
        ? project.faqs
        : [
          {
            question: `What is the starting price for units at ${name}?`,
            answer: `${name} has units starting from ${price.replace(/^From /, '')}. Contact Nikas Realty to confirm current availability and pricing.`,
          },
          {
            question: `When will ${name} be completed?`,
            answer: `${name} is expected to be completed in ${project.expectedCompletionDate || 'the date confirmed by the developer'}. Contact Nikas Realty for the latest construction update.`,
          },
          {
            question: `What payment plan is available at ${name}?`,
            answer: project.paymentPlanSummary || `A minimum deposit of ${project.minimumDepositPercentage ?? 20}% is required. Contact Nikas Realty for the current payment schedule.`,
          },
        ];
      const address = {
        '@type': 'PostalAddress',
        ...(project.street ? { streetAddress: project.street } : {}),
        addressLocality: project.neighborhood || project.location,
        addressRegion: project.county || project.location || 'Nairobi',
        addressCountry: project.country || 'KE',
      };
      const unitRows = units.map((unit) => `
        <tr><th scope="row">${escapeHtml(unitTitle(unit))}</th>
          <td>${escapeHtml(unit.floorAreaLabel || (unit.floorAreaSqM ? `${unit.floorAreaSqM} sqm` : `${unit.floorAreaSqFt || ''} sq ft`))}</td>
          <td>${escapeHtml(unit.buildingWing || '—')}</td>
          <td>${escapeHtml(`KES ${Number(unit.cashPrice || unit.startingPrice || 0).toLocaleString('en-KE')}`)}</td>
          <td>${escapeHtml(unit.installmentPriceRange || 'Contact for plan pricing')}</td></tr>`).join('');
      const faqHtml = faqs.map((faq) =>
        `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`
      ).join('');
      const pastProjects = (project.pastNotableProjects || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      const amenityItems = (project.amenities || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      const relatedProjects = projects
        .filter((item) => item.slug !== project.slug && item.neighborhood?.toLowerCase() === project.neighborhood?.toLowerCase())
        .slice(0, 3)
        .map((item) => `<li><a href="/projects/${encodeURIComponent(item.slug)}">${escapeHtml(item.name)}</a></li>`)
        .join('');
      const heroImage = project.featuredImage
        ? `<img src="${escapeHtml(asAbsoluteImage(project.featuredImage))}" alt="${escapeHtml(project.featuredImageAlt || `${name} in ${location}`)}">`
        : '';
      const galleryImages = (project.gallery || []).map((galleryImage, index) => `
        <img src="${escapeHtml(asAbsoluteImage(galleryImage))}" alt="${escapeHtml(project.galleryAltTexts?.[index] || `${name} gallery image ${index + 1}`)}">`
      ).join('');
      const unitOptions = units.map((unit) =>
        `<option>${escapeHtml(unitTitle(unit))}</option>`
      ).join('');
      const pageHeading = `${name}, ${project.street || project.location} – ${project.neighborhood || project.location}, ${project.location || project.county || 'Nairobi'}`;
      const paymentSummary = project.paymentPlanSummary || `Minimum deposit: ${project.minimumDepositPercentage ?? 20}%. Contact Nikas Realty for the full payment schedule.`;
      const inquiryMessage = encodeURIComponent(`Hello Nikas Realty, I am interested in ${name} in ${location}. Please share availability and the brochure.`);
      writePrerenderedPage(route, {
        title,
        description,
        image,
        structuredData: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'RealEstateListing',
              name,
              description: project.fullDescription || project.shortDescription || description,
              url: `${SITE_URL}${route}`,
              image: [project.featuredImage, ...(project.gallery || [])].filter(Boolean).map(asAbsoluteImage),
              address,
              offers: {
                '@type': 'AggregateOffer',
                priceCurrency: 'KES',
                lowPrice: startingPrice,
                offerCount: units.length || 1,
                availability: 'https://schema.org/InStock',
              },
            },
            {
              '@type': 'FAQPage',
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            },
          ],
        },
        content: `<main>
          <nav aria-label="Breadcrumb"><a href="/">Home</a> · <a href="/projects">Projects</a> · ${escapeHtml(name)}</nav>
          <article>
            ${heroImage}
            <div aria-label="Project gallery">${galleryImages}</div>
            <h1>${escapeHtml(pageHeading)}</h1>
            <p>${escapeHtml(project.shortDescription || description)}</p>
            <section aria-label="Key project highlights"><h2>Project Highlights</h2><ul>
              <li>Starting price: ${escapeHtml(price)}</li>
              <li>Completion: ${escapeHtml(project.expectedCompletionDate || 'Contact for details')}</li>
              <li>Location: ${escapeHtml(location)}</li>
              <li>Minimum deposit: ${escapeHtml(`${project.minimumDepositPercentage ?? 'Contact us'}${project.minimumDepositPercentage !== undefined ? '%' : ''}`)}</li>
            </ul></section>
            <section><h2>Unit Types, Floor Plans &amp; Pricing</h2>
              <table><thead><tr><th>Unit Type</th><th>Floor Area</th><th>Wing</th><th>Cash Price</th><th>Installment Price</th></tr></thead><tbody>${unitRows}</tbody></table>
            </section>
            <section><h2>Flexible Payment Plan &amp; Investment Highlights</h2>
              <p>${escapeHtml(paymentSummary)}</p>
              ${project.developer ? `<p>Developer: ${escapeHtml(project.developer)}</p>` : ''}
              ${pastProjects ? `<h3>Developer track record</h3><ul>${pastProjects}</ul>` : ''}
            </section>
            <section><h2>Lifestyle Amenities &amp; Building Features</h2><ul>${amenityItems}</ul></section>
            <section><h2>Frequently Asked Questions</h2>${faqHtml}</section>
            <section><h2>Request Call-Back &amp; Brochure</h2><p>Speak with the Nikas Realty team about ${escapeHtml(name)}.</p>
              <form><label>Name <input name="name" autocomplete="name" required></label>
                <label>Phone / WhatsApp <input name="phone" type="tel" autocomplete="tel" required></label>
                <label>Email <input name="email" type="email" autocomplete="email"></label>
                <label>Preferred Unit Type <select name="unit"><option>Any unit type</option>${unitOptions}</select></label>
                <label>Message <textarea name="message"></textarea></label>
                <button type="submit">Request a Call-Back</button>
              </form>
              <p><a href="https://wa.me/254710132320?text=${inquiryMessage}">Chat on WhatsApp</a></p>
            </section>
            <section><h2>Similar Projects in ${escapeHtml(project.neighborhood || project.location)}</h2>
              <ul>${relatedProjects || '<li><a href="/projects">Browse all projects</a></li>'}</ul>
            </section>
          </article>
        </main>`,
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
  console.log(`Generated sitemap with ${entries.length} URLs and prerendered ${projects.length + sales.length + rentals.length + blogs.length + media.length + 9} routes.`);
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
