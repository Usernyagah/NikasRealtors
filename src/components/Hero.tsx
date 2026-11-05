import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import heroImage from "@/assets/images/hero.jpg";
import property1 from "@/assets/images/property1.jpg";
import property2 from "@/assets/images/property2.jpg";
import property3 from "@/assets/images/property3.jpg";
import property4 from "@/assets/images/property4.jpg";
import property5 from "@/assets/images/property5.jpg";
import { useEffect, useState } from "react";

const Hero = () => {
  const scrollToProperties = () => {
    const element = document.querySelector("#sales");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const slides = [heroImage, property1, property2, property3, property4, property5];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  return (
    <section id="home" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      {/* Background Slideshow with Overlay */}
      <div className="absolute inset-0 z-0">
        {slides.map((src, i) => (
          <div
            key={i}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ${i === index ? 'opacity-100' : 'opacity-0'} transform-gpu will-change-opacity`}
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <p className="text-sm md:text-base tracking-[0.25em] uppercase text-primary font-semibold">
            Nikas Realty
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Apartments &amp; Homes for Sale and Rent in Kenya
          </h1>
          <div className="h-1 w-32 mx-auto gradient-gold" />
          <p className="text-2xl md:text-3xl text-primary font-semibold">
            We Turn Dreams Into Reality
          </p>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Houses, maisonettes and luxury apartments in Nairobi — Westlands, Kilimani, Kileleshwa, Langata, Syokimau and beyond.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button
              onClick={scrollToProperties}
              size="lg"
              className="gradient-gold text-secondary font-semibold text-lg px-8 py-6 shadow-luxury hover:scale-105 transition-smooth"
            >
              Explore Sales
              <ArrowRight className="ml-2" size={20} />
            </Button>
            <Button
              onClick={() => {
                const message = encodeURIComponent("Hello, I'm interested in your properties I saw on the Nikas Realty website.");
                window.open(`https://wa.me/254710132320?text=${message}`, "_blank");
              }}
              size="lg"
              variant="outline"
              className="!text-white border-white hover:bg-white hover:!text-secondary font-semibold text-lg px-8 py-6 backdrop-blur-sm transition-smooth bg-transparent"
            >
              <MessageCircle className="mr-2" size={20} />
              WhatsApp Us
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
