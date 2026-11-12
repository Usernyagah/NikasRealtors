import { useEffect } from "react";
import { SEO_DEFAULTS, absoluteUrl } from "@/config/seo";

type JsonLd = object | object[];

type SEOProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  keywords?: string;
  noindex?: boolean;
  jsonLd?: JsonLd;
};

const upsertMeta = (attr: "name" | "property", key: string, content: string) => {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const JSON_LD_ATTR = "data-nikas-seo-jsonld";

const setJsonLd = (data?: JsonLd) => {
  document.head.querySelectorAll(`script[${JSON_LD_ATTR}]`).forEach((n) => n.remove());
  if (!data) return;
  const payloads = Array.isArray(data) ? data : [data];
  payloads.forEach((payload) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(JSON_LD_ATTR, "true");
    script.text = JSON.stringify(payload);
    document.head.appendChild(script);
  });
};

const SEO = ({
  title,
  description,
  path = "/",
  image = SEO_DEFAULTS.image,
  type = "website",
  keywords = SEO_DEFAULTS.keywords,
  noindex = false,
  jsonLd,
}: SEOProps) => {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const url = absoluteUrl(path);
    const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);
    const robots = noindex ? "noindex, nofollow" : "index, follow";

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", keywords);
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "googlebot", robots);
    upsertLink("canonical", url);

    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:site_name", SEO_DEFAULTS.siteName);
    upsertMeta("property", "og:locale", SEO_DEFAULTS.locale);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:url", url);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);

    setJsonLd(jsonLd);
  }, [title, description, path, image, type, keywords, noindex, jsonLd, jsonLdKey]);

  return null;
};

export default SEO;
