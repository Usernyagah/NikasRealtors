import { Helmet } from "react-helmet-async";
import { SEO_DEFAULTS, absoluteUrl } from "@/config/seo";

type JsonLd = object | object[];

type SEOProps = {
  title: string;
  description: string;
  canonicalUrl?: string;
  image?: string;
  schemaData?: JsonLd;
  path?: string;
  type?: "website" | "article";
  keywords?: string;
  noindex?: boolean;
  jsonLd?: JsonLd;
};

const toAbsoluteUrl = (url: string) =>
  url.startsWith("http://") || url.startsWith("https://") ? url : absoluteUrl(url);

const SEO = ({
  title,
  description,
  canonicalUrl,
  image = SEO_DEFAULTS.image,
  schemaData,
  path = "/",
  type = "website",
  keywords = SEO_DEFAULTS.keywords,
  noindex = false,
  jsonLd,
}: SEOProps) => {
  const url = toAbsoluteUrl(canonicalUrl || path);
  const imageUrl = toAbsoluteUrl(image);
  const structuredData = schemaData ?? jsonLd;
  const payloads = structuredData
    ? Array.isArray(structuredData) ? structuredData : [structuredData]
    : [];
  const robots = noindex ? "noindex, nofollow" : "index, follow";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={SEO_DEFAULTS.siteName} />
      <meta property="og:locale" content={SEO_DEFAULTS.locale} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {payloads.map((payload, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(payload)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
