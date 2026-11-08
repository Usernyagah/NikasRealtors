import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
const SITE_URL = 'https://nikasrealtors.com';

export async function generateSitemap() {
  try {
    // Import services dynamically
    const { projectsService } = await import('../src/services/firestore/projects.js');
    const { propertiesService } = await import('../src/services/firestore/properties.js');

    // Fetch all data from Firestore
    const [projects, properties] = await Promise.all([
      projectsService.getAll().catch(() => []),
      propertiesService.getAll().catch(() => []),
    ]);

    // Base static URLs
    const baseUrls = [
      { loc: `${SITE_URL}/`, priority: '1.0', freq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/projects`, priority: '0.9', freq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/properties`, priority: '0.9', freq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/rentals`, priority: '0.9', freq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/blog`, priority: '0.7', freq: 'weekly', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/media`, priority: '0.6', freq: 'weekly', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/about`, priority: '0.5', freq: 'monthly', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITE_URL}/contact`, priority: '0.5', freq: 'monthly', lastmod: new Date().toISOString().split('T')[0] },
    ];

    // Append published projects
    const projectUrls = projects
      .filter((p) => p.status === 'published' && p.slug && p.seo?.searchEngineIndexing !== 'noindex')
      .map((p) => ({
        loc: `${SITE_URL}/projects/${p.slug}`,
        priority: '0.8',
        freq: 'weekly',
        lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      }));

    // Append properties (sales)
    const propertyUrls = properties
      .filter((p) => p.id && (p.status === 'for-sale' || p.status === 'For Sale') && p.seo?.searchEngineIndexing !== 'noindex')
      .map((p) => ({
        loc: `${SITE_URL}/properties/${p.id}`,
        priority: '0.8',
        freq: 'weekly',
        lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      }));

    // Append rentals
    const rentalUrls = properties
      .filter((p) => p.id && (p.status === 'for-rent' || p.status === 'For Rent') && p.seo?.searchEngineIndexing !== 'noindex')
      .map((p) => ({
        loc: `${SITE_URL}/properties/${p.id}`,
        priority: '0.8',
        freq: 'weekly',
        lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      }));

    const allEntries = [...baseUrls, ...projectUrls, ...propertyUrls, ...rentalUrls];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    allEntries.forEach((entry) => {
      xml += `  <url>\n`;
      xml += `    <loc>${entry.loc}</loc>\n`;
      if (entry.lastmod) {
        xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
      }
      xml += `    <changefreq>${entry.freq}</changefreq>\n`;
      xml += `    <priority>${entry.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    fs.writeFileSync(sitemapPath, xml, 'utf8');
    console.log(`✅ Updated sitemap.xml with ${allEntries.length} indexable URLs:`);
    console.log(`   - ${baseUrls.length} static pages`);
    console.log(`   - ${projectUrls.length} project pages`);
    console.log(`   - ${propertyUrls.length} property listings`);
    console.log(`   - ${rentalUrls.length} rental listings`);
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

