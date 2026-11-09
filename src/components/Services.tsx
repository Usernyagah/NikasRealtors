import { Home, TrendingUp, FileText, Scale, CreditCard } from "lucide-react";

const Services = ({ headingAsPage = false }: { headingAsPage?: boolean }) => {
  const HeadingTag = headingAsPage ? "h1" : "h2";
  const services = [
    {
      icon: Home,
      title: "Home Purchase Consultation",
      description: "Expert guidance to help you find and purchase your ideal property with confidence.",
    },
    {
      icon: TrendingUp,
      title: "Property Investment Guidance",
      description: "Strategic advice to maximize your real estate investment returns and portfolio growth.",
    },
    {
      icon: Scale,
      title: "Real Estate Valuation",
      description: "Accurate property valuations to ensure you make informed buying or selling decisions.",
    },
    {
      icon: FileText,
      title: "Legal & Documentation Assistance",
      description: "Comprehensive support with all legal paperwork and documentation processes.",
    },
    {
      icon: CreditCard,
      title: "Financing & Mortgage Support",
      description: "Connect with the best financing options and mortgage providers for your property.",
    },
  ];

  return (
    <section id="services" className={`py-20 lg:py-32 bg-background ${headingAsPage ? "pt-32 lg:pt-40" : ""}`}>
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <HeadingTag className="text-4xl md:text-5xl font-bold text-foreground">
            Professional Advice &{" "}
            <span className="text-primary">Customized Solutions</span>
          </HeadingTag>
          <div className="h-1 w-20 gradient-gold mx-auto" />
          <p className="text-lg text-muted-foreground">
            Comprehensive real estate services tailored to your unique needs
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="group bg-card p-8 rounded-2xl shadow-card hover:shadow-luxury transition-smooth"
              >
                {/* Icon */}
                <div className="mb-6 relative">
                  <div className="w-16 h-16 gradient-gold rounded-xl flex items-center justify-center group-hover:scale-110 transition-smooth">
                    <Icon className="text-secondary w-8 h-8" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary/10 rounded-xl -z-10" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-smooth">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg text-muted-foreground mb-6">
            Ready to start your real estate journey with us?
          </p>
          <button
            onClick={() => {
              const element = document.querySelector("#contact");
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }}
            className="gradient-gold text-secondary px-8 py-4 rounded-xl font-semibold text-lg shadow-luxury hover:scale-105 transition-smooth"
          >
            Get Started Today
          </button>
        </div>
      </div>
    </section>
  );
};

export default Services;
