import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Check,
  Calendar,
  Layers,
  Phone,
  Mail,
  MessageCircle,
  FileText,
  ChevronRight,
  ArrowRight,
  Loader2,
  ExternalLink,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { projectsService, generateSensibleSEO, type Project, type ApartmentConfiguration } from "@/services/firestore/projects";
import { requestsService } from "@/services/firestore/requests";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export const ProjectDetailsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // allow preview if admin is logged in even if draft

  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<ApartmentConfiguration | null>(null);

  // Inquiry form
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [selectedUnitType, setSelectedUnitType] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [sendingInquiry, setSendingInquiry] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchProjectData = async () => {
      setLoading(true);
      try {
        const found = await projectsService.getBySlug(slug);
        
        // If not found or if draft and user is not admin
        if (!found) {
          setProject(null);
          setLoading(false);
          return;
        }

        if (found.status !== "published" && !user) {
          setProject(null);
          setLoading(false);
          return;
        }

        setProject(found);
        setSelectedImage(found.featuredImage || found.gallery?.[0] || "");
        if (found.configurations?.length > 0) {
          setSelectedFloorPlan(found.configurations[0]);
          setSelectedUnitType(`${found.configurations[0].bedrooms} Bedroom ${found.configurations[0].propertyType}`);
        }

        // Fetch related published projects
        const allPublished = await projectsService.getPublished();
        const others = allPublished.filter((p) => p.slug !== slug).slice(0, 3);
        setRelatedProjects(others);
      } catch (err) {
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [slug, user]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    if (!inquiryName.trim() || !inquiryPhone.trim()) {
      toast.error("Please enter your name and phone number");
      return;
    }

    setSendingInquiry(true);
    try {
      await requestsService.create({
        type: "project-inquiry",
        name: inquiryName.trim(),
        email: inquiryEmail.trim() || "no-email@nikasrealtor.com",
        phone: inquiryPhone.trim(),
        message: `Project Inquiry: ${project.name}\nUnit of Interest: ${selectedUnitType || "General"}\nMessage: ${inquiryMessage}`,
        propertyId: project.id,
        propertyTitle: project.name,
      });

      toast.success("Thank you! Your project inquiry has been received. Our sales team will contact you shortly.");
      setInquiryMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit inquiry. Please try WhatsApp or calling directly.");
    } finally {
      setSendingInquiry(false);
    }
  };

  const handleWhatsAppClick = () => {
    if (!project) return;
    const phone = (project.contactWhatsApp || "254710132320").replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `Hello Nikas Realty, I am interested in ${project.name} in ${project.location}. Please share more details and available units.`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const formatPrice = (val?: number) => {
    if (!val) return "Price on Request";
    return `KES ${Number(val).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-background">
        <SEO
          title="Project Not Found | Nikas Realty"
          description="The requested real estate development project is not available or has been unpublished."
          noindex
        />
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center space-y-4">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">Project Not Found</h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            The project development you are looking for is either in draft mode or no longer active on our portal.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Button onClick={() => navigate("/properties")}>Browse Properties</Button>
            <Button variant="outline" onClick={() => navigate("/projects")}>View All Projects</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Sensible SEO generation fallback
  const fallbackSEO = generateSensibleSEO(project);
  const seoTitle = project.seo?.seoTitle?.trim() || fallbackSEO.title;
  const metaDescription = project.seo?.metaDescription?.trim() || fallbackSEO.description;
  const canonicalUrl = project.seo?.canonicalUrl?.trim() || fallbackSEO.canonical;
  const sharingImage = project.seo?.socialSharingImage || project.featuredImage || fallbackSEO.canonical;
  const noindex = project.status !== "published" || project.seo?.searchEngineIndexing === "noindex";

  // Comprehensive RealEstateListing + SingleFamilyResidence Schema for Rich Snippets
  const projectJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: project.name,
    description: project.shortDescription || metaDescription,
    url: canonicalUrl,
    image: [project.featuredImage, ...(project.gallery || [])].filter(Boolean),
    datePosted: project.createdAt ? new Date(project.createdAt).toISOString() : undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "KES",
      lowPrice: project.startingPrice,
      offerCount: project.configurations?.length || 1,
      availability: "https://schema.org/InStock",
    },
    about: {
      "@type": "Place",
      name: project.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: project.neighborhood || project.location,
        addressRegion: project.county || "Nairobi",
        addressCountry: project.country || "KE",
      },
      geo: project.googleMapsUrl ? undefined : {
        "@type": "GeoCoordinates",
        latitude: -1.2921,
        longitude: 36.8219,
      },
      amenityFeature: (project.amenities || []).map((amenity) => ({
        "@type": "LocationFeatureSpecification",
        name: amenity,
        value: "true",
      })),
    },
  };

  const allImages = [
    ...(project.featuredImage ? [project.featuredImage] : []),
    ...(project.gallery || []),
  ].filter((img, idx, arr) => arr.indexOf(img) === idx);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Dynamic Automatic SEO Meta Tags */}
      <SEO
        title={seoTitle}
        description={metaDescription}
        path={`/projects/${project.slug}`}
        image={sharingImage}
        keywords={project.seo?.focusKeyword || `${project.name}, luxury apartments ${project.location}, real estate kenya, off plan properties nairobi`}
        noindex={noindex}
        jsonLd={projectJsonLd}
      />

      <Navbar />

      <main className="flex-1 pb-20">
        {/* Admin Draft Banner */}
        {project.status !== "published" && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 py-2.5 px-4 text-xs font-medium text-center flex items-center justify-center gap-2">
            <span>⚠️ <strong>Admin Preview Mode:</strong> This project is currently in <strong>DRAFT</strong> mode and is not visible to the public or indexed by search engines.</span>
            <Link to={`/admin/edit-project/${project.id}`} className="underline font-bold hover:text-foreground">
              Edit in Admin Portal
            </Link>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <div className="bg-muted/40 border-b border-border/60 py-3">
          <div className="container mx-auto px-4 lg:px-8">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/projects" className="hover:text-primary transition-colors">Projects</Link>
              <ChevronRight className="h-3 w-3" />
              {project.neighborhood && (
                <>
                  <span>{project.neighborhood}</span>
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
              <span className="text-foreground font-medium truncate max-w-xs">{project.name}</span>
            </nav>
          </div>
        </div>

        {/* Hero & Media Section */}
        <section className="container mx-auto px-4 lg:px-8 pt-8 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Gallery / Images (2 Cols) */}
            <div className="lg:col-span-2 space-y-3">
              {/* Main Image */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-muted border shadow-luxury group">
                <img
                  src={selectedImage || project.featuredImage || "/placeholder.svg"}
                  alt={`${project.name} - Luxury Residential Development in ${project.location}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1 shadow-md">
                    {project.constructionStatus || "New Development"}
                  </Badge>
                  {project.expectedCompletionDate && (
                    <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur border-none px-3 py-1">
                      Completion: {project.expectedCompletionDate}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`relative flex-shrink-0 w-24 h-16 sm:w-28 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === img
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${project.name} view ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Overview & Pricing Summary Card (1 Col) */}
            <div className="space-y-6">
              <Card className="border border-border/80 shadow-luxury overflow-hidden bg-card/70 backdrop-blur sticky top-24">
                <CardContent className="p-6 space-y-6">
                  {/* Title & Developer */}
                  <div>
                    {project.developer && (
                      <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">
                        Developed by {project.developer}
                      </p>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                      {project.name}
                    </h1>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-2">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>
                        {project.neighborhood ? `${project.neighborhood}, ` : ""}
                        {project.location}, {project.country || "Kenya"}
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-medium">Starting From</span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-primary">
                      {formatPrice(project.startingPrice)}
                    </div>
                    {project.configurations?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {project.configurations.length} unit configuration{project.configurations.length > 1 ? "s" : ""} available
                      </p>
                    )}
                  </div>

                  {/* Summary bullets */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground pt-1 border-t border-border/60">
                    <div>
                      <span className="block text-foreground font-semibold">Stage</span>
                      <span>{project.constructionStatus}</span>
                    </div>
                    <div>
                      <span className="block text-foreground font-semibold">Handover</span>
                      <span>{project.expectedCompletionDate || "Contact for dates"}</span>
                    </div>
                    <div>
                      <span className="block text-foreground font-semibold">Units</span>
                      <span>
                        {project.configurations?.length > 0
                          ? `${Math.min(...project.configurations.map(c => c.bedrooms))} - ${Math.max(...project.configurations.map(c => c.bedrooms))} Bedrooms`
                          : "Flexible layouts"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-foreground font-semibold">Location</span>
                      <span>{project.neighborhood || project.location}</span>
                    </div>
                  </div>

                  {/* Quick CTAs */}
                  <div className="space-y-2.5 pt-2">
                    <Button
                      onClick={handleWhatsAppClick}
                      className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold gap-2 shadow-sm"
                    >
                      <MessageCircle className="h-4 w-4 fill-current" /> Inquire via WhatsApp
                    </Button>
                    <a
                      href={`tel:${project.contactPhone || "+254710132320"}`}
                      className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium"
                    >
                      <Phone className="h-4 w-4 text-primary" /> Call Sales Team
                    </a>
                    {project.brochureUrl && (
                      <a
                        href={project.brochureUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 text-xs text-primary hover:underline pt-1"
                      >
                        <FileText className="h-3.5 w-3.5" /> Download Project Brochure (PDF)
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Detailed Content & Tabs Grid */}
        <section className="container mx-auto px-4 lg:px-8 space-y-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left 2 Columns: Project Details */}
            <div className="lg:col-span-2 space-y-12">
              {/* Project Overview */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Project Overview</h2>
                <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-sm sm:text-base space-y-3 whitespace-pre-line">
                  {project.fullDescription || project.shortDescription}
                </div>
              </div>

              {/* Apartment Configurations & Available Units */}
              {project.configurations && project.configurations.length > 0 && (
                <div className="space-y-6 pt-4 border-t border-border/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Apartment Configurations & Pricing</h2>
                      <p className="text-xs text-muted-foreground">
                        Select a unit configuration to view specifications and floor plans.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {project.configurations.map((config, index) => {
                      const isSelected = selectedFloorPlan?.id === config.id;
                      return (
                        <div
                          key={config.id || index}
                          onClick={() => setSelectedFloorPlan(config)}
                          className={`cursor-pointer p-4 rounded-xl border transition-all text-left space-y-3 ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
                              : "border-border bg-card/80 hover:border-border/80 hover:bg-card"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground text-base">
                              {config.unitName || (config.bedrooms === 0 ? "Studio" : `${config.bedrooms} Bedroom ${config.propertyType || ""}`)}
                            </span>
                            <Badge
                              variant={config.availabilityStatus === "Available" ? "default" : "secondary"}
                              className="text-[11px]"
                            >
                              {config.availabilityStatus}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1">
                              <Bed className="h-3.5 w-3.5 text-primary" /> {config.bedrooms === 0 ? "Studio" : `${config.bedrooms} Beds`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bath className="h-3.5 w-3.5 text-primary" /> {config.bathrooms} Baths
                            </span>
                            <span className="flex items-center gap-1">
                              <Maximize className="h-3.5 w-3.5 text-primary" /> {config.floorAreaSqM ? `${config.floorAreaSqM} m�` : `${config.floorAreaSqFt} sq ft`}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">From</span>
                            <div className="text-right">
                              <span className="font-extrabold text-foreground text-sm sm:text-base block">
                                {formatPrice(config.startingPrice)}
                              </span>
                              {config.priceUSD && (
                                <span className="text-[11px] text-muted-foreground block">
                                  ~ USD ${Number(config.priceUSD).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Floor Plan Display */}
                  {selectedFloorPlan && (
                    <Card className="border border-primary/30 bg-card overflow-hidden mt-4">
                      <div className="bg-primary/5 p-4 border-b border-primary/20 flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          Floor Plan: {selectedFloorPlan.bedrooms} Bed {selectedFloorPlan.propertyType} ({selectedFloorPlan.floorAreaSqFt} sq ft)
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUnitType(`${selectedFloorPlan.bedrooms} Bed ${selectedFloorPlan.propertyType}`);
                            document.getElementById("inquiry-card")?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="text-xs h-8 gap-1"
                        >
                          Inquire for this Unit <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                      <CardContent className="p-6">
                        {selectedFloorPlan.floorPlanImage ? (
                          <div className="relative max-h-96 w-full flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden border">
                            <img
                              src={selectedFloorPlan.floorPlanImage}
                              alt={`${project.name} ${selectedFloorPlan.bedrooms} Bedroom floor plan layout`}
                              className="max-h-96 w-auto object-contain p-2"
                            />
                          </div>
                        ) : (
                          <div className="p-8 text-center text-muted-foreground space-y-2 bg-muted/20 rounded-lg">
                            <Layers className="h-8 w-8 mx-auto text-muted-foreground/40" />
                            <p className="text-sm">Architectural layout blueprint available upon request.</p>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={handleWhatsAppClick}
                              className="gap-1.5"
                            >
                              <MessageCircle className="h-3.5 w-3.5" /> Request Unit Floor Plan
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Amenities */}
              {project.amenities && project.amenities.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border/60">
                  <h2 className="text-2xl font-bold text-foreground">Amenities & Features</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {project.amenities.map((amenity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-3 rounded-lg bg-card border border-border/60 text-sm text-foreground"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span className="font-medium text-xs sm:text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Plans */}
              {project.paymentPlans && project.paymentPlans.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border/60">
                  <h2 className="text-2xl font-bold text-foreground">Flexible Payment Plans</h2>
                  <div className="space-y-3">
                    {project.paymentPlans.map((plan, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/80 text-sm"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-foreground text-sm leading-relaxed">{plan}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location & Nearby Landmarks */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <h2 className="text-2xl font-bold text-foreground">Location & Neighborhood</h2>
                <p className="text-sm text-muted-foreground">
                  Located in the premier enclave of {project.neighborhood || project.location}, offering seamless connectivity to Nairobi's prime commercial and diplomatic hubs.
                </p>

                {project.nearbyLandmarks && project.nearbyLandmarks.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {project.nearbyLandmarks.map((landmark, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs sm:text-sm text-foreground"
                      >
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{landmark}</span>
                      </div>
                    ))}
                  </div>
                )}

                {project.googleMapsUrl && (
                  <div className="pt-2">
                    <a
                      href={project.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                    >
                      Open Google Maps Location <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Column: Inquiry & Booking Form */}
            <div className="space-y-6">
              <Card id="inquiry-card" className="border border-border/80 shadow-luxury overflow-hidden bg-card sticky top-24">
                <div className="bg-primary px-6 py-4 text-primary-foreground">
                  <h3 className="font-bold text-lg">Inquire About {project.name}</h3>
                  <p className="text-xs text-primary-foreground/80 mt-0.5">
                    Schedule a private site presentation or request pricing schedules.
                  </p>
                </div>
                <CardContent className="p-6">
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Your Name *</label>
                      <Input
                        placeholder="John Doe"
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        required
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Phone Number (WhatsApp) *</label>
                      <Input
                        placeholder="+254 700 000 000"
                        value={inquiryPhone}
                        onChange={(e) => setInquiryPhone(e.target.value)}
                        required
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Email Address</label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        className="h-9"
                      />
                    </div>

                    {project.configurations?.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Unit Configuration of Interest</label>
                        <select
                          value={selectedUnitType}
                          onChange={(e) => setSelectedUnitType(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value="General Project Inquiry">General Project Inquiry</option>
                          {project.configurations.map((c, i) => (
                            <option key={i} value={`${c.bedrooms} Bed ${c.propertyType}`}>
                              {c.bedrooms} Bedroom {c.propertyType} (KES {Number(c.startingPrice).toLocaleString()})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Message</label>
                      <Textarea
                        rows={3}
                        placeholder="I would like to arrange a site visit and receive the investment prospectus..."
                        value={inquiryMessage}
                        onChange={(e) => setInquiryMessage(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={sendingInquiry}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    >
                      {sendingInquiry ? "Sending..." : "Submit Inquiry"}
                    </Button>

                    <div className="relative text-center my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <span className="relative bg-card px-2 text-[10px] uppercase text-muted-foreground font-semibold">
                        Or Contact Directly
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleWhatsAppClick}
                      className="w-full border-green-600/30 text-green-700 dark:text-green-400 hover:bg-green-500/10 gap-2 text-xs font-semibold"
                    >
                      <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Related Real Estate Projects */}
          {relatedProjects.length > 0 && (
            <div className="pt-10 border-t border-border space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Similar Development Projects</h3>
                  <p className="text-xs text-muted-foreground">
                    Discover other premium off-plan residential developments in Nairobi.
                  </p>
                </div>
                <Link
                  to="/projects"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedProjects.map((rel) => (
                  <Link
                    key={rel.id}
                    to={`/projects/${rel.slug}`}
                    className="group rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-luxury transition-all flex flex-col"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <img
                        src={rel.featuredImage || rel.gallery?.[0] || "/placeholder.svg"}
                        alt={rel.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px]">
                        {rel.constructionStatus}
                      </Badge>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                          {rel.name}
                        </h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-primary" /> {rel.neighborhood || rel.location}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">From</span>
                        <span className="font-extrabold text-primary text-sm">
                          {formatPrice(rel.startingPrice)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectDetailsPage;

