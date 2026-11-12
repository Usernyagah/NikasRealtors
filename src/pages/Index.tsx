import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Properties from "@/components/Properties";
import Services from "@/components/Services";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import MortgageCalculator from "@/components/MortgageCalculator";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Calculator } from "lucide-react";
import { useState } from "react";
import SEO from "@/components/SEO";
import { organizationJsonLd, websiteJsonLd, SEO_DEFAULTS } from "@/config/seo";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title={SEO_DEFAULTS.title}
        description={SEO_DEFAULTS.description}
        path="/"
        jsonLd={[organizationJsonLd, websiteJsonLd]}
      />
      <Navbar />
      <Hero />
      <About />
      <Properties />
      {/* Floating Calculator Button + Dialog */}
      <FloatingCalculatorButton />
      <Services />
      <Contact />
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

// Floating button with dialog
const FloatingCalculatorButton = () => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="fixed bottom-28 right-8 z-50 bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center shadow-luxury hover:bg-primary/85 hover:scale-110 transition-smooth"
          aria-label="Open Mortgage Calculator"
        >
          <Calculator size={28} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full p-0">
        <MortgageCalculator />
      </DialogContent>
    </Dialog>
  );
};

export default Index;
