import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
const SITE_URL = 'https://www.nikasrealtor.com';

export function updateSitemapWithProjects(projects = []) {
  try {
    let sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

    // Base static URLs
    const baseUrls = [
      { loc: `${SITE_URL}/`, priority: '1.0', freq: 'daily' },
      { loc: `${SITE_URL}/projects`, priority: '0.9', freq: 'daily' },
      { loc: `${SITE_URL}/properties`, priority: '0.9', freq: 'daily' },
      { loc: `${SITE_URL}/rentals`, priority: '0.9', freq: 'daily' },
      { loc: `${SITE_URL}/blog`, priority: '0.7', freq: 'weekly' },
      { loc: `${SITE_URL}/media`, priority: '0.6', freq: 'weekly' },
    ];

    // Append published projects
    const projectUrls = projects
      .filter((p) => p.status === 'published' && p.slug && p.seo?.searchEngineIndexing !== 'noindex')
      .map((p) => ({
        loc: `${SITE_URL}/projects/${p.slug}`,
        priority: '0.8',
        freq: 'weekly',
        lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      }));

    const allEntries = [...baseUrls, ...projectUrls];

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
    console.log(`✅ Updated sitemap.xml with ${allEntries.length} indexable URLs (${projectUrls.length} projects).`);
  } catch (err) {
    console.error('Error updating sitemap:', err);
  }
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateSitemapWithProjects();
}

