import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./ProjectDetails.css";
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
        email: inquiryEmail.trim() || "no-email@nikasrealtors.com",
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
      `Hello Nikas Realty, I am interested in ${project.name} in ${project.location} (seen on your website). Please share more details and available units.`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const formatPrice = (val?: number) => {
    if (!val) return "Price on Request";
    return `KES ${Number(val).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="project-detail-page min-h-screen flex flex-col justify-between bg-background">
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
      <div className="project-detail-page min-h-screen flex flex-col justify-between bg-background">
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
    <div className="project-detail-page min-h-screen flex flex-col bg-background">
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

        {/* Project Gallery */}
        <section className="container mx-auto px-4 lg:px-8 pt-8 pb-6">
          <div className="relative mb-8 h-[50vh] min-h-[320px] w-full cursor-zoom-in overflow-hidden rounded-xl bg-muted shadow-lg md:h-[60vh] lg:h-[65vh]">
            <img
              src={selectedImage || project.featuredImage || "/placeholder.svg"}
              alt={`${project.name} - Residential development in ${project.location}`}
              className="h-full w-full object-contain"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 md:p-8 lg:p-10">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge className="gradient-gold text-secondary font-semibold">
                  {project.constructionStatus || "New Development"}
                </Badge>
                {project.expectedCompletionDate && (
                  <Badge variant="secondary" className="bg-white/90 text-foreground">
                    Completion {project.expectedCompletionDate}
                  </Badge>
                )}
                {project.developer && (
                  <Badge variant="secondary" className="bg-white/90 text-foreground">
                    {project.developer}
                  </Badge>
                )}
              </div>
              <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">{project.name}</h1>
              <p className="flex items-center gap-1.5 text-sm text-white/90">
                <MapPin className="h-4 w-4" />
                {project.neighborhood ? `${project.neighborhood}, ` : ""}
                {project.location}, {project.country || "Kenya"}
              </p>
            </div>
          </div>

          {allImages.length > 1 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-foreground">Gallery</h2>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    aria-label={`View ${project.name} image ${idx + 1}`}
                    aria-pressed={selectedImage === img}
                    className={`relative aspect-square overflow-hidden rounded-lg transition-all duration-200 ${
                      selectedImage === img ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${project.name} view ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Detailed Content & Tabs Grid */}
        <section className="container mx-auto px-4 lg:px-8 space-y-12 pb-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Left 2 Columns: Project Details */}
            <div className="space-y-8 md:col-span-2">
              {/* Project Overview */}
              <div className="space-y-4 border-b border-border pb-6">
                <div className="text-3xl font-bold text-primary md:text-4xl">
                  <span className="mr-1 text-lg font-semibold text-primary/80 md:text-xl">From</span>
                  {formatPrice(project.startingPrice)}
                </div>
                <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Layers className="h-[18px] w-[18px]" />
                    {project.configurations?.length || 0} Unit Types
                  </span>
                  {project.configurations?.length > 0 && (
                    <span className="flex items-center gap-2">
                      <Bed className="h-[18px] w-[18px]" />
                      {Math.min(...project.configurations.map(c => c.bedrooms))}–{Math.max(...project.configurations.map(c => c.bedrooms))} Beds
                    </span>
                  )}
                  {project.expectedCompletionDate && (
                    <span className="flex items-center gap-2">
                      <Calendar className="h-[18px] w-[18px]" />
                      Completion {project.expectedCompletionDate}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground">Description</h2>
                <div className="max-w-none text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {project.fullDescription || project.shortDescription}
                </div>
              </div>

              {/* Apartment Configurations & Available Units */}
              {project.configurations && project.configurations.length > 0 && (
                <div className="space-y-4 border-t border-border pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Available Units & Prices</h2>
                      <p className="text-sm text-muted-foreground">
                        Select a unit configuration to view specifications and floor plans.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {project.configurations.map((config, index) => {
                      const isSelected = selectedFloorPlan?.id === config.id;
                      return (
                        <button
                          type="button"
                          key={config.id || index}
                          onClick={() => setSelectedFloorPlan(config)}
                          aria-pressed={isSelected}
                          className={`w-full cursor-pointer border p-4 transition-colors text-left space-y-3 ${
                            isSelected
                              ? "border-foreground bg-secondary"
                              : "border-border bg-background hover:bg-secondary"
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
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Floor Plan Display */}
                  {selectedFloorPlan && (
                    <Card className="border border-border bg-card overflow-hidden mt-4">
                        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
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
                          <div className="relative max-h-96 w-full flex items-center justify-center bg-black overflow-hidden border border-border">
                            <img
                              src={selectedFloorPlan.floorPlanImage}
                              alt={`${project.name} ${selectedFloorPlan.bedrooms} Bedroom floor plan layout`}
                              className="max-h-96 w-auto object-contain p-2"
                            />
                          </div>
                        ) : (
                          <div className="p-8 text-center text-muted-foreground space-y-2 bg-background">
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
                <section className="space-y-3 border-t border-border pt-6">
                  <h2 className="text-xl font-semibold text-foreground">Amenities & Features</h2>
                  <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    {project.amenities.map((amenity, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 border-b border-border py-2 text-sm text-muted-foreground"
                      >
                        <span className="text-foreground">•</span>
                        <span>{amenity}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Payment Plans */}
              {project.paymentPlans && project.paymentPlans.length > 0 && (
                <section className="space-y-3 border-t border-border pt-6">
                  <h2 className="text-xl font-semibold text-foreground">Payment Plan</h2>
                  <ul className="space-y-1.5">
                    {project.paymentPlans.map((plan, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                      >
                        <span className="text-foreground">•</span>
                        <span>{plan}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Location & Nearby Landmarks */}
              <section className="space-y-3 border-t border-border pt-6">
                <h2 className="text-xl font-semibold text-foreground">Location</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Located in the premier enclave of {project.neighborhood || project.location}, offering seamless connectivity to Nairobi's prime commercial and diplomatic hubs.
                </p>

                {project.nearbyLandmarks && project.nearbyLandmarks.length > 0 && (
                  <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    {project.nearbyLandmarks.map((landmark, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 border-b border-border py-2 text-sm text-muted-foreground"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{landmark}</span>
                      </li>
                    ))}
                  </ul>
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
              </section>
            </div>

            {/* Right 1 Column: Inquiry & Booking Form */}
            <div className="space-y-6">
              <section className="border border-border p-5">
                <h2 className="text-lg font-semibold text-foreground">Project Details</h2>
                <dl className="mt-3 divide-y divide-border text-sm">
                  <div className="flex justify-between gap-3 py-2.5">
                    <dt className="text-muted-foreground">Construction</dt>
                    <dd className="text-right text-foreground">{project.constructionStatus}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-2.5">
                    <dt className="text-muted-foreground">Completion</dt>
                    <dd className="text-right text-foreground">{project.expectedCompletionDate || "Contact for details"}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-2.5">
                    <dt className="text-muted-foreground">Unit types</dt>
                    <dd className="text-right text-foreground">
                      {project.configurations?.length ? project.configurations.length : "Contact for details"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 py-2.5">
                    <dt className="text-muted-foreground">Bedrooms</dt>
                    <dd className="text-right text-foreground">
                      {project.configurations?.length
                        ? `${Math.min(...project.configurations.map(c => c.bedrooms))}–${Math.max(...project.configurations.map(c => c.bedrooms))}`
                        : "Contact for details"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  <a
                    href={`tel:${project.contactPhone || "+254710132320"}`}
                    className="inline-flex h-10 items-center justify-center gap-2 border border-border px-4 text-sm font-medium hover:bg-secondary"
                  >
                    <Phone className="h-4 w-4" /> Call Sales Team
                  </a>
                  {project.brochureUrl && (
                    <a
                      href={project.brochureUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 border border-border px-4 text-sm font-medium hover:bg-secondary"
                    >
                      <FileText className="h-4 w-4" /> Download Brochure
                    </a>
                  )}
                </div>
              </section>

              <Card id="inquiry-card" className="border border-border bg-card overflow-hidden md:sticky md:top-24">
                <div className="border-b border-border px-5 py-4">
                  <h3 className="font-semibold text-lg text-foreground">Enquire about this project</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Schedule a private site presentation or request pricing schedules.
                  </p>
                </div>
                <CardContent className="p-5">
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
                      className="w-full border-border text-foreground hover:bg-secondary gap-2 text-sm font-semibold"
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
