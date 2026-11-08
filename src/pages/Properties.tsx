import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Properties from "@/components/Properties";
import SEO from "@/components/SEO";

const PropertiesPage = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Apartments & Homes for Sale in Nairobi, Kenya | Nikas Realty"
        description="Browse apartments, houses, maisonettes and luxury homes for sale in Nairobi and across Kenya. View current Nikas Realty listings in Westlands, Kilimani, Kileleshwa, Langata, Syokimau and more."
        path="/properties"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Apartments and homes for sale in Kenya",
          description:
            "Browse apartments, houses, maisonettes and luxury homes for sale in Nairobi and across Kenya.",
          url: "https://www.nikasrealtors.com/properties",
        }}
      />
      <Navbar />
      <Properties headingAsPage />
      <Footer />
    </div>
  );
};

export default PropertiesPage;
