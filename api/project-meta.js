import { FIREBASE_CONFIG } from "../src/config/firebase-config.js";

const SITE_URL = "https://www.nikasrealtors.com";
const PROJECTS_TITLE = "Real Estate Projects in Kenya | Nikas Realty";
const PROJECTS_DESCRIPTION = "Browse current real estate projects and developments in Kenya.";
const BOT_USER_AGENT = /(Googlebot|bingbot|WhatsApp|facebookexternalhit)/i;

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const decodeValue = (value) => {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in value) return decodeFields(value.mapValue.fields || {});
  return value;
};

const decodeFields = (fields = {}) => Object.fromEntries(
  Object.entries(fields).map(([key, value]) => [key, decodeValue(value)])
);

const getProject = async (slug) => {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || FIREBASE_CONFIG.projectId;
  const apiKey = process.env.VITE_FIREBASE_API_KEY || FIREBASE_CONFIG.apiKey;
  const endpoint = new URL(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`
  );
  endpoint.searchParams.set("key", apiKey);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "projects" }],
        where: {
          compositeFilter: {
            op: "AND",
            filters: [
              {
                fieldFilter: {
                  field: { fieldPath: "slug" },
                  op: "EQUAL",
                  value: { stringValue: slug },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: "status" },
                  op: "EQUAL",
                  value: { stringValue: "published" },
                },
              },
            ],
          },
        },
        limit: 1,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Firestore project lookup failed with HTTP ${response.status}`);
  }

  const results = await response.json();
  const document = results.find((result) => result.document)?.document;
  return document ? decodeFields(document.fields) : null;
};

const getProjectMetadata = (project, slug) => {
  const location = project.neighborhood || project.location || "Nairobi";
  const configurations = project.configurations || [];
  const unitTypes = configurations
    .map((unit) => unit.unitTitle || unit.unitName ||
      (unit.bedrooms ? `${unit.bedrooms} Bedroom ${unit.propertyType}` : unit.propertyType))
    .filter(Boolean);
  const startingPrice = Number(project.startingPrice);
  const generatedTitle = `${project.name} ${location}: ${unitTypes.join(", ") || "Apartments"} (From KES ${Number.isFinite(startingPrice) ? startingPrice.toLocaleString("en-KE") : "Price on request"})`;
  const generatedDescription =
    `${project.shortDescription || `Explore ${project.name} in ${location}.`} Explore pricing, floor plans, amenities and payment options for ${project.name} in ${location}.`
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
  const description = project.seo?.metaDescription?.trim() || generatedDescription;
  const canonicalUrl = `${SITE_URL}/projects/${encodeURIComponent(slug)}`;
  const image = project.seo?.socialSharingImage || project.featuredImage ||
    project.gallery?.[0] || `${SITE_URL}/logo.png`;
  const absoluteImage = image.startsWith("http") ? image : `${SITE_URL}${image.startsWith("/") ? image : `/${image}`}`;
  const title = project.seo?.seoTitle?.trim() || generatedTitle;

  return {
    title,
    description,
    canonicalUrl,
    image: absoluteImage,
    schema: {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: project.name,
      description: project.shortDescription || description,
      url: canonicalUrl,
      image: (project.gallery?.length
        ? [project.featuredImage, ...project.gallery]
        : [project.featuredImage || image])
        .filter(Boolean),
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "KES",
        lowPrice: Number.isFinite(startingPrice) ? startingPrice : undefined,
        offerCount: configurations.length || 1,
        availability: "https://schema.org/InStock",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: location,
        addressRegion: project.county || project.location || "Nairobi",
        addressCountry: project.country || "KE",
      },
    },
    noindex: project.seo?.searchEngineIndexing === "noindex",
  };
};

const injectMetadata = (html, metadata) => {
  const { title, description, canonicalUrl, image, schema, noindex } = metadata;
  const replaceTag = (source, expression, tag) => source.replace(expression, tag);
  let output = replaceTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  output = replaceTag(
    output,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );
  output = replaceTag(
    output,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  );
  output = replaceTag(
    output,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  );
  output = replaceTag(
    output,
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`
  );
  output = replaceTag(
    output,
    /<meta\s+property=["']og:image["'][^>]*>/i,
    `<meta property="og:image" content="${escapeHtml(image)}" />`
  );
  output = replaceTag(
    output,
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`
  );
  output = replaceTag(
    output,
    /<meta\s+name=["']twitter:url["'][^>]*>/i,
    `<meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />`
  );
  output = replaceTag(
    output,
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  );
  output = replaceTag(
    output,
    /<meta\s+name=["']twitter:image["'][^>]*>/i,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`
  );
  output = replaceTag(
    output,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`
  );
  if (noindex) {
    output = replaceTag(output, /<meta\s+name=["']robots["'][^>]*>/i,
      '<meta name="robots" content="noindex, nofollow" />');
    output = replaceTag(output, /<meta\s+name=["']googlebot["'][^>]*>/i,
      '<meta name="googlebot" content="noindex, nofollow" />');
  }

  const safeSchema = JSON.stringify(schema).replaceAll("<", "\\u003c");
  return output.replace(
    "</head>",
    `<script type="application/ld+json">${safeSchema}</script>\n  </head>`
  );
};

const htmlResponse = (html, status = 200, noindex = status === 404) => new Response(html, {
  status,
  headers: {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    "X-Robots-Tag": noindex ? "noindex, nofollow" : "index, follow",
  },
});

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (!BOT_USER_AGENT.test(request.headers.get("user-agent") || "")) {
    return new Response("Not found", { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const slug = requestUrl.searchParams.get("slug");

  try {
    const shellResponse = await fetch(new URL("/index.html", request.url));
    if (!shellResponse.ok) {
      throw new Error(`Failed to load the application HTML with HTTP ${shellResponse.status}`);
    }
    const html = await shellResponse.text();

    if (!slug) {
      return htmlResponse(injectMetadata(html, {
        title: PROJECTS_TITLE,
        description: PROJECTS_DESCRIPTION,
        canonicalUrl: `${SITE_URL}/projects`,
        image: `${SITE_URL}/logo.png`,
        schema: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: PROJECTS_TITLE,
          description: PROJECTS_DESCRIPTION,
          url: `${SITE_URL}/projects`,
        },
      }));
    }

    if (slug.length > 200 || !/^[a-z0-9-]+$/i.test(slug)) {
      return htmlResponse(injectMetadata(html, {
        title: "Project Not Found | Nikas Realty",
        description: "The requested real estate development is not available.",
        canonicalUrl: `${SITE_URL}/projects`,
        image: `${SITE_URL}/logo.png`,
        noindex: true,
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Project Not Found | Nikas Realty",
        },
      }), 404);
    }

    const project = await getProject(slug);
    if (!project || !project.name) {
      return htmlResponse(injectMetadata(html, {
        title: "Project Not Found | Nikas Realty",
        description: "The requested real estate development is not available.",
        canonicalUrl: `${SITE_URL}/projects/${encodeURIComponent(slug)}`,
        image: `${SITE_URL}/logo.png`,
        noindex: true,
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Project Not Found | Nikas Realty",
        },
      }), 404);
    }

    const metadata = getProjectMetadata(project, slug);
    return htmlResponse(injectMetadata(html, metadata), 200, metadata.noindex);
  } catch (error) {
    console.error("Failed to render crawler metadata:", error);
    return new Response("Unable to render project metadata", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
