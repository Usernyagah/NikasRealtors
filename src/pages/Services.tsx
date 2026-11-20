import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Services from "@/components/Services";
import SEO from "@/components/SEO";

const ServicesPage = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Real Estate Services in Nairobi, Kenya | Nikas Realty"
        description="Property buying, renting, valuation, legal support and mortgage guidance from Nikas Realty in Nairobi, Kenya."
        path="/services"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Real estate services in Nairobi",
          url: "https://nikasrealtors.com/services",
          description:
            "Home purchase consultation, investment guidance, valuation, legal support and mortgage assistance from Nikas Realty.",
        }}
      />
      <Navbar />
      <Services headingAsPage />
      <Footer />
    </div>
  );
};

export default ServicesPage;
