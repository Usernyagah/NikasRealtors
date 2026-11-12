import { Instagram, Video, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/images/logo.png";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";

const Footer = () => {
  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Projects", href: "/projects" },
    { name: "Properties for Sale", href: "/sales" },
    { name: "Apartments for Rent", href: "/rentals" },
    { name: "Services", href: "/services" },
    { name: "Media", href: "/media" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
  ];

  const socialLinks = [
    {
      icon: Instagram,
      label: "Instagram",
      href: "https://instagram.com/nikasrealty",
    },
    {
      icon: Video,
      label: "TikTok",
      href: "https://tiktok.com/@nikas.realty",
    },
    {
      icon: Phone,
      label: "Phone",
      href: "tel:+254710132320",
    },
    {
      icon: Mail,
      label: "Email",
      href: "mailto:nikasrealty@gmail.com",
    },
  ];

  return (
    <footer className="gradient-dark text-white">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <img src={logo} alt="Nikas Realty" className="h-16 w-auto" />
            <p className="text-primary font-semibold text-lg">
              We Turn Dreams Into Reality
            </p>
            <p className="text-white/70 text-sm">
              Your trusted partner for apartments, houses and luxury homes for sale and rent in Nairobi and across Kenya.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-primary">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-white/70 hover:text-primary transition-smooth"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Property Types */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-primary">Property Types</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/sales" className="text-white/70 hover:text-primary transition-smooth">
                  Apartments for sale
                </Link>
              </li>
              <li>
                <Link to="/projects" className="text-white/70 hover:text-primary transition-smooth">
                  Real estate projects
                </Link>
              </li>
              <li>
                <Link to="/rentals" className="text-white/70 hover:text-primary transition-smooth">
                  Apartments for rent
                </Link>
              </li>
              <li>
                <Link to="/sales" className="text-white/70 hover:text-primary transition-smooth">
                  Houses &amp; maisonettes
                </Link>
              </li>
              <li>
                <Link to="/sales" className="text-white/70 hover:text-primary transition-smooth">
                  Luxury homes Nairobi
                </Link>
              </li>
              <li>
                <Link to="/sales" className="text-white/70 hover:text-primary transition-smooth">
                  Townhouses &amp; bungalows
                </Link>
              </li>
              <li>
                <Link to="/sales" className="text-white/70 hover:text-primary transition-smooth">
                  Off-plan properties
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-primary">Contact Us</h3>
            <ul className="space-y-3 text-white/70 text-sm">
              <li>
                <a
                  href="tel:+254710132320"
                  className="hover:text-primary transition-smooth"
                >
                  Phone: 0710 132 320
                </a>
              </li>
              <li>
                <a
                  href="tel:+254715699774"
                  className="hover:text-primary transition-smooth"
                >
                  Phone: 0715 699 774
                </a>
              </li>
              <li>
                <a
                  href="mailto:nikasrealty@gmail.com"
                  className="hover:text-primary transition-smooth"
                >
                  Email: nikasrealty@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://maps.app.goo.gl/vtdVH937UKa52MvD7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-smooth"
                >
                  Address: Westland Arcade, Nairobi, Westlands, Kenya
                </a>
              </li>
            </ul>

            {/* Social Media */}
            <div className="mt-6">
              <h4 className="font-bold mb-3 text-primary">Follow Us</h4>
              <div className="flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary hover:scale-110 transition-smooth"
                      aria-label={social.label}
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Newsletter Subscription */}
          <div className="lg:col-span-1">
            <NewsletterSubscribe variant="footer" />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-white/60 text-sm">
            (c) 2026 Nikas Realty. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
