import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, Instagram, Video, Send, MapPin } from "lucide-react";
import { toast } from "sonner";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "@/utils/sanitize";
import { validateName, validateEmail, validatePhone, validateMessage } from "@/utils/validate";

const Contact = ({ headingAsPage = false }: { headingAsPage?: boolean }) => {
  const HeadingTag = headingAsPage ? "h1" : "h2";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    const nameValidation = validateName(formData.name);
    if (!nameValidation.valid) {
      toast.error(nameValidation.error || 'Invalid name');
      return;
    }

    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.valid) {
      toast.error(phoneValidation.error || 'Invalid phone number');
      return;
    }

    const emailValidation = validateEmail(formData.email, false);
    if (!emailValidation.valid) {
      toast.error(emailValidation.error || 'Invalid email');
      return;
    }

    const messageValidation = validateMessage(formData.message);
    if (!messageValidation.valid) {
      toast.error(messageValidation.error || 'Invalid message');
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize all inputs before sending
      const sanitizedData = {
        name: sanitizeText(formData.name),
        email: formData.email ? sanitizeEmail(formData.email) : undefined,
        phone: sanitizePhone(formData.phone),
        message: sanitizeText(formData.message),
      };

      const { requestsService } = await import('@/services/firestore/requests');
      await requestsService.create(sanitizedData);

      // Send email notification via EmailJS
      try {
        const { emailService } = await import('@/services/emailService');
        await emailService.sendNotification({
          name: sanitizedData.name,
          email: sanitizedData.email,
          phone: sanitizedData.phone,
          message: sanitizedData.message,
          type: 'Contact Message'
        });
      } catch (e) {
        console.error('Contact email notification failed:', e);
      }

      toast.success("Message sent successfully! We'll get back to you soon.");

      // Reset form
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      value: "0710 132 320",
      link: "tel:+254710132320",
    },
    {
      icon: Phone,
      title: "Phone",
      value: "0715 699 774",
      link: "tel:+254715699774",
    },
    {
      icon: Mail,
      title: "Email",
      value: "nikasrealty@gmail.com",
      link: "mailto:nikasrealty@gmail.com",
    },
    {
      icon: Instagram,
      title: "Instagram",
      value: "@nikasrealty",
      link: "https://instagram.com/nikasrealty",
    },
    {
      icon: Video,
      title: "TikTok",
      value: "@nikas.realty",
      link: "https://tiktok.com/@nikas.realty",
    },
  ];

  return (
    <section id="contact" className={`py-20 lg:py-32 bg-muted/30 ${headingAsPage ? "pt-32 lg:pt-40" : ""}`}>
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <HeadingTag className="text-4xl md:text-5xl font-bold text-foreground">
            Let's Talk <span className="text-primary">Real Estate</span>
          </HeadingTag>
          <div className="h-1 w-20 gradient-gold mx-auto" />
          <p className="text-lg text-muted-foreground">
            Get in touch with our team to discuss your property needs
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="shadow-luxury">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Email Address (Optional)
                  </label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+254 710 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Message
                  </label>
                  <Textarea
                    placeholder="Tell us about your property requirements..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gradient-gold text-secondary font-semibold h-12 text-lg shadow-luxury hover:scale-105 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="mr-2" size={20} />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info & Map */}
          <div className="space-y-8">
            {/* Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <a
                    key={index}
                    href={info.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card p-6 rounded-xl shadow-card hover:shadow-luxury transition-smooth group"
                  >
                    <Icon className="text-primary w-8 h-8 mb-3 group-hover:scale-110 transition-smooth" />
                    <div className="text-sm text-muted-foreground mb-1">
                      {info.title}
                    </div>
                    <div className="font-semibold text-foreground group-hover:text-primary transition-smooth">
                      {info.value}
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Map */}
            <Card className="shadow-card overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-80">
                  <iframe
                    src="https://www.google.com/maps?q=Westland%20Arcade%2C%20Nairobi%2C%20Westlands%2C%20Kenya&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title="Nikas Realty Location"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm p-4 rounded-lg shadow-card">
                    <div className="flex items-center gap-2">
                      <MapPin className="text-primary" size={20} />
                      <div>
                        <div className="font-semibold text-foreground">Our Location</div>
                        <a
                          href="https://maps.app.goo.gl/vtdVH937UKa52MvD7"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary transition-smooth underline"
                        >
                          Westland Arcade, Nairobi, Westlands, Kenya
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
