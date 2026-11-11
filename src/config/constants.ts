/**
 * Application Configuration
 * Centralized configuration for all hardcoded values
 */
import { FIREBASE_CONFIG } from "./firebase-config";

// Theme Configuration
export const THEME_CONFIG = {
  primaryColor: '#DA9100',
  primaryColorHSL: '40 100% 43%',
  gradientGold: 'linear-gradient(135deg, hsl(40 100% 41%), hsl(40 100% 45%))',
  shadowLuxury: '0 10px 40px -10px hsl(40 100% 43% / 0.3)',
} as const;

// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  cloudName: 'dc7jf9inl',
  uploadPreset: 'nikasrealty',
} as const;

// Firebase configuration fallback values; environment variables can override them.
export { FIREBASE_CONFIG };

// Application Constants
export const APP_CONFIG = {
  name: 'NikasRealty',
  email: 'nikasrealty@gmail.com',
  blockedAdminEmail: 'admin@nikasrealty.co.ke',
  instagram: '@nikasrealty',
  instagramUrl: 'https://instagram.com/nikasrealty',
  facebook: 'https://www.facebook.com/nikasrealty',
  linkedin: 'https://www.linkedin.com/company/nikasrealty',
  whatsapp: '254710132320',
  whatsappUrl: 'https://wa.me/254710132320',
  phone: '+254710132320',
  phoneDisplay: '0710 132 320',
} as const;

// Property Configuration
export const PROPERTY_CONFIG = {
  maxPrice: 500000000, // 500M
  defaultPriceRange: [0, 500000000] as [number, number],
  propertyTypes: [
    'Apartment',
    'Mansion',
    'Maisonette',
    'Townhouse',
    'Bungalow',
    'Duplex',
    'Triplex',
  ],
  locations: [
    'Langata',
    'Ruiru',
    'Kikuyu',
    'Kilimani',
    'Kileleshwa',
    'Syokimau',
    'Kabete',
    'Muthaiga',
    'Riverside',
    'Kiambu Road',
    'Ngong',
    'Westlands',
    'Parklands',
    'Loresho',
  ],
  statusOptions: ['for-sale', 'for-rent', 'sold'] as const,
} as const;
