import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import About from "@/components/About";
import SEO from "@/components/SEO";

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="About Nikas Realty | Real Estate Agents in Nairobi, Kenya"
        description="Meet the Nikas Realty team. We help clients find apartments, houses and luxury homes for sale and rent in Nairobi, including Westlands, Kilimani, Kileleshwa, Langata and Syokimau."
        path="/about"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About Nikas Realty",
          url: "https://nikasrealtors.com/about",
          description:
            "Nikas Realty helps clients find apartments, houses and luxury homes for sale and rent in Nairobi, Kenya.",
        }}
      />
      <Navbar />
      <About headingAsPage />
      <Footer />
    </div>
  );
};

export default AboutPage;
