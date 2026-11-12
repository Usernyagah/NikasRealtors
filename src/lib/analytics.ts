import ReactGA from 'react-ga4';
import { getCookieConsent } from '@/lib/cookieConsent';

const TRACKING_ID = 'G-PERDJVZ0SX';
let gaInitialized = false;

export const enableGoogleAnalytics = () => {
    if (gaInitialized || !TRACKING_ID) return;
    initGA();
};

export const initGA = () => {
    if (!TRACKING_ID || gaInitialized) {
        if (!TRACKING_ID && import.meta.env.DEV) {
            console.warn('Google Analytics tracking ID not found');
        }
        return;
    }

    if (getCookieConsent() !== 'accepted') {
        return;
    }

    try {
        ReactGA.initialize(TRACKING_ID, {
            gaOptions: {
                debug_mode: import.meta.env.DEV,
                send_page_view: false,
            },
            gtagOptions: {
                transport_type: 'beacon',
            },
        });
        gaInitialized = true;
        if (import.meta.env.DEV) {
            console.log('Google Analytics initialized');
        }
    } catch {
        // Silently ignore when blocked by ad blockers or privacy extensions
    }
};

export const logPageView = (path: string) => {
    if (TRACKING_ID && gaInitialized && getCookieConsent() === 'accepted') {
        ReactGA.send({ hitType: 'pageview', page: path });
    }
};

export const logEvent = (category: string, action: string, label?: string) => {
    if (TRACKING_ID && gaInitialized && getCookieConsent() === 'accepted') {
        ReactGA.event({
            category,
            action,
            label,
        });
    }
};

export const logException = (description: string, fatal = false) => {
    if (TRACKING_ID && gaInitialized && getCookieConsent() === 'accepted') {
        ReactGA.event({
            category: 'Exception',
            action: description,
            label: fatal ? 'Fatal' : 'Non-fatal',
        });
    }
};
