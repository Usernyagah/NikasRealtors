import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FIREBASE_CONFIG } from '../src/config/firebase-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
const SITE_URL = 'https://nikasrealtors.com';

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const timestampToDate = (timestamp) => {
  if (!timestamp) return undefined;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().split('T')[0];
};

async function fetchPropertyUrls() {
  const apiKey = process.env.VITE_FIREBASE_API_KEY || FIREBASE_CONFIG.apiKey;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || FIREBASE_CONFIG.projectId;
  const documents = [];
  let pageToken;

  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/properties`
    );
    url.searchParams.set('key', apiKey);
    url.searchParams.set('pageSize', '1000');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Firestore returned HTTP ${response.status}`);
    }

    const result = await response.json();
    documents.push(...(result.documents || []));
    pageToken = result.nextPageToken;
  } while (pageToken);

  return documents
    .map((document) => {
      const id = document.name?.split('/').pop();
      if (!id || !document.fields?.title?.stringValue) return null;

      const lastmod = timestampToDate(
        document.fields.updatedAt?.timestampValue || document.fields.createdAt?.timestampValue
      );
      return {
        loc: `${SITE_URL}/properties/${encodeURIComponent(id)}`,
        priority: '0.8',
        freq: 'weekly',
        lastmod,
      };
    })
    .filter(Boolean);
}

export async function generateSitemap() {
  try {
    // Base static URLs
    const baseUrls = [
      { loc: `${SITE_URL}/`, priority: '1.0', freq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/projects`, priority: '0.9', freq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/properties`, priority: '0.9', freq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/rentals`, priority: '0.9', freq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/blog`, priority: '0.7', freq: 'weekly', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/media`, priority: '0.6', freq: 'weekly', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/about`, priority: '0.5', freq: 'monthly', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/services`, priority: '0.5', freq: 'monthly', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/contact`, priority: '0.5', freq: 'monthly', lastmod: new Date().toISOString().split('T')[0] },
    ];

    let propertyUrls = [];
    try {
      propertyUrls = await fetchPropertyUrls();
      console.log(`Fetched ${propertyUrls.length} property URLs for the sitemap.`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      console.warn(`Could not fetch property URLs (${reason}); generating the sitemap with static pages only.`);
    }

    const allEntries = [...baseUrls, ...propertyUrls];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    allEntries.forEach((entry) => {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(entry.loc)}</loc>\n`;
      if (entry.lastmod) {
        xml += `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>\n`;
      }
      xml += `    <changefreq>${escapeXml(entry.freq)}</changefreq>\n`;
      xml += `    <priority>${escapeXml(entry.priority)}</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    fs.writeFileSync(sitemapPath, xml, 'utf8');
    console.log(`Updated sitemap.xml with ${allEntries.length} URLs.`);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    throw err;
  }
}

// Keep backward compatibility
export function updateSitemapWithProjects(projects = []) {
  console.warn('⚠️  updateSitemapWithProjects is deprecated. Use generateSitemap() instead.');
  return generateSitemap();
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSitemap();
}
