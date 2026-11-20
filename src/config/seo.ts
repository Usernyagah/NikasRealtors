import { APP_CONFIG } from "@/config/constants";

export const SITE_URL = "https://www.nikasrealtors.com";

export const SEO_DEFAULTS = {
  siteName: "Nikas Realty",
  title: "Apartments & Homes for Sale and Rent in Kenya | Nikas Realty",
  description:
    "Find apartments, houses, maisonettes and luxury homes for sale and rent in Nairobi, Kenya. Browse listings in Westlands, Kilimani, Kileleshwa, Langata, Syokimau and more with Nikas Realty.",
  keywords:
    "apartments for sale Kenya, apartments for rent Nairobi, houses for sale Nairobi, properties for sale Kenya, luxury homes Nairobi, real estate Kenya, Westlands apartments, Kilimani apartments, Kileleshwa homes, Langata houses, Syokimau apartments, Nikas Realty, nikasrealtors",
  image: `${SITE_URL}/logo.png`,
  locale: "en_KE",
} as const;

export const absoluteUrl = (path = "/") => {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["RealEstateAgent", "LocalBusiness", "Organization"],
  name: "Nikas Realty",
  alternateName: ["Nikas Realty Kenya", "nikasrealtors"],
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/logo.png`,
  description: SEO_DEFAULTS.description,
  email: APP_CONFIG.email,
  telephone: APP_CONFIG.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Westland Arcade",
    addressLocality: "Westlands",
    addressRegion: "Nairobi",
    addressCountry: "KE",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -1.2681,
    longitude: 36.811,
  },
  areaServed: [
    { "@type": "City", name: "Nairobi" },
    { "@type": "Country", name: "Kenya" },
  ],
  priceRange: "$$",
  sameAs: [
    APP_CONFIG.facebook,
    APP_CONFIG.instagramUrl,
    APP_CONFIG.linkedin,
    "https://tiktok.com/@nikas.realty",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: APP_CONFIG.phone,
      contactType: "sales",
      areaServed: "KE",
      availableLanguage: ["English", "Swahili"],
    },
  ],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Nikas Realty",
  url: SITE_URL,
  description: SEO_DEFAULTS.description,
};
