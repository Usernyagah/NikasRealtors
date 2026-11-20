import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCookieConsent, setCookieConsent } from "@/lib/cookieConsent";
import { enableGoogleAnalytics } from "@/lib/analytics";

const CookieConsent = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) {
      setVisible(false);
      return;
    }
    setVisible(getCookieConsent() === null);
  }, [location.pathname]);

  if (!visible) return null;

  const accept = () => {
    setCookieConsent("accepted");
    enableGoogleAnalytics();
    setVisible(false);
  };

  const decline = () => {
    setCookieConsent("declined");
    setVisible(false);
  };

  return (
    <div
      data-nosnippet=""
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[80] p-4 md:p-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-border bg-background/95 p-5 shadow-luxury backdrop-blur-md md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">We use cookies</p>
            <p className="text-sm text-muted-foreground">
              Nikas Realty uses cookies to keep the site working and, with your permission, to
              understand how visitors search for apartments and homes. You can accept optional
              analytics cookies or continue with essential cookies only.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={decline}>
            Decline
          </Button>
          <Button
            onClick={accept}
            className="gradient-gold text-secondary font-semibold shadow-luxury"
          >
            Accept cookies
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
