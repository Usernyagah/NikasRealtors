import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import SEO from "@/components/SEO";
import { APP_CONFIG } from "@/config/constants";
import { SITE_URL } from "@/config/seo";

const ContactPage = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Contact Nikas Realty | Apartments & Homes in Nairobi"
        description="Talk to Nikas Realty about apartments and homes for sale or rent in Nairobi, Kenya. Call, WhatsApp or send a message to discuss listings in Westlands, Kilimani and beyond."
        path="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Nikas Realty",
          url: `${SITE_URL}/contact`,
          telephone: APP_CONFIG.phone,
          email: APP_CONFIG.email,
        }}
      />
      <Navbar />
      <Contact headingAsPage />
      <Footer />
    </div>
  );
};

export default ContactPage;
