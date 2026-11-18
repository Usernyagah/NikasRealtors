import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import "./index.css";
import { APP_CONFIG, THEME_CONFIG } from "@/config/constants";

// Set theme colors immediately when the script loads
const applyThemeColors = () => {
  const root = document.documentElement;

  // Set theme color variables from config
  const themeColors = {
    '--primary': THEME_CONFIG.primaryColorHSL,
    '--accent': THEME_CONFIG.primaryColorHSL,
    '--ring': THEME_CONFIG.primaryColorHSL,
    '--gradient-gold': THEME_CONFIG.gradientGold,
    '--shadow-luxury': THEME_CONFIG.shadowLuxury,
  };

  // Apply all theme colors at once
  Object.entries(themeColors).forEach(([key, value]) => {
    root.style.setProperty(key, value, 'important');
  });

  // Theme colors applied silently
};

// Run immediately and also after DOM is fully loaded
if (typeof window !== 'undefined') {
  // Apply immediately
  applyThemeColors();

  // Apply again after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyThemeColors);
  } else {
    applyThemeColors();
  }

  // Also apply on page show (for back/forward cache)
  window.addEventListener('pageshow', applyThemeColors);

  // Theme color verification (only in development)
  if (import.meta.env.DEV) {
    setTimeout(() => {
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary');
      if (primaryColor.trim() !== THEME_CONFIG.primaryColorHSL) {
        console.warn('⚠️ Theme color mismatch! CSS may be cached. JavaScript fallback applied.');
      }
    }, 1000);
  }
}

// Suppress non-critical Firebase token refresh errors
// These occur when Firebase tries to refresh tokens for users who aren't logged in
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  // Override console.error to filter out only the specific token refresh error
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Only suppress the specific Firebase token refresh 400 error
    // This is a network-level error that appears in console but doesn't affect functionality
    if (message.includes('securetoken.googleapis.com') &&
      (message.includes('400') || message.includes('Failed to load resource'))) {
      // Suppress in production only - still log in development
      if (!import.meta.env.DEV) {
        return;
      }
    }
    // Log all other errors normally
    originalError.apply(console, args);
  };

  // Keep console.warn for important warnings
  console.warn = (...args: any[]) => {
    originalWarn.apply(console, args);
  };
}

// Startup banner (only in development)
if (import.meta.env.DEV) {
  console.log(`%c🚀 ${APP_CONFIG.name} App Starting...`, `color: ${THEME_CONFIG.primaryColor}; font-size: 16px; font-weight: bold;`);
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <App />
    </ThemeProvider>
  </HelmetProvider>
);
