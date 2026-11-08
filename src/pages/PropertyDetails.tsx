import { useEffect, useState, type SyntheticEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyEnquiryCard from "@/components/PropertyEnquiryCard";
import SimilarListings from "@/components/SimilarListings";
import OurListings from "@/components/OurListings";
import LatestListings from "@/components/LatestListings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Square, Loader2, ArrowLeft, X, Clock } from "lucide-react";
import { propertiesService, type Property } from "@/services/firestore/properties";
import { PROPERTY_IMAGE_FALLBACK } from "@/constants/propertyImages";
import { getPropertyImageUrl } from "@/utils/imageUtils";
import { descriptionToParagraphs, contentToParagraphs } from "@/utils/text";
import { formatPostedDate } from "@/utils/dateUtils";
import { getPropertyAmenities } from "@/utils/propertyUtils";
import { hasAvailableUnitsData } from "@/utils/propertyFormUtils";
import SEO from "@/components/SEO";
import { SITE_URL, absoluteUrl } from "@/config/seo";
import { parsePrice } from "@/data/properties";

const PropertyDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const fetchProperty = async () => {
      try {
        const data = await propertiesService.getById(id);
        if (data) {
          setProperty(data);
        }
      } catch (error) {
        console.error("Failed to load property:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  useEffect(() => {
    setSelectedImage(0);
  }, [property?.id]);

  const images =
    property?.images?.length
      ? property.images
      : property?.gallery?.length
        ? property.gallery
        : property?.image
          ? [property.image]
          : [PROPERTY_IMAGE_FALLBACK];

  const descriptionParagraphs = property ? descriptionToParagraphs(property.description) : [];
  const amenities = property ? getPropertyAmenities(property) : [];
  const paymentPlanParagraphs = property?.paymentPlan?.content
    ? contentToParagraphs(property.paymentPlan.content)
    : [];
  const showAvailableUnits = property?.availableUnits && hasAvailableUnitsData(property.availableUnits);
  const hasPaymentPlan =
    Boolean(property?.paymentPlan?.content?.trim()) ||
    Boolean(property?.paymentPlan?.paymentMethods?.length);

  const handleImageError = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.dataset.fallback) {
      img.dataset.fallback = 'true';
      img.src = PROPERTY_IMAGE_FALLBACK;
    }
  };

  const displayImages = images.map((img) => getPropertyImageUrl(img, 'full'));
  const thumbnailImages = images.map((img) => getPropertyImageUrl(img, 'thumbnail'));

  const openLightbox = (index: number) => {
    setSelectedImage(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const navigateImages = (direction: "prev" | "next") => {
    if (!images.length) return;

    setSelectedImage((prev) => {
      if (direction === "next") {
        return (prev + 1) % images.length;
      }
      return (prev - 1 + images.length) % images.length;
    });
  };

  const renderParagraphs = (lines: string[]) =>
    lines.map((line, index) =>
      line.trim() === '' ? (
        <div key={index} className="h-2" aria-hidden="true" />
      ) : (
        <p key={index} className="text-sm text-muted-foreground leading-relaxed">
          {line}
        </p>
      )
    );

  if (loading) {
    return (
      <div className="min-h-screen">
        <SEO
          title="Property Listing | Nikas Realty"
          description="View this apartment or home listing with Nikas Realty in Kenya."
          path={id ? `/properties/${id}` : "/properties"}
        />
        <Navbar />
        <div className="container mx-auto px-4 lg:px-8 pt-28 pb-24 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen">
        <SEO
          title="Property Not Found | Nikas Realty"
          description="This property listing is no longer available. Browse apartments and homes for sale and rent in Kenya with Nikas Realty."
          path="/properties"
          noindex
        />
        <Navbar />
        <div className="container mx-auto px-4 lg:px-8 pt-28 pb-24 text-center">
          <h1 className="text-2xl font-semibold mb-4">Property not found</h1>
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isRental = property.status === 'for-rent' || property.status === 'For Rent';
  const priceNum = typeof property.price === "number" ? property.price : parsePrice(String(property.price || 0));
  const listingImage = displayImages[0]?.startsWith("http")
    ? displayImages[0]
    : absoluteUrl(displayImages[0] || "/logo.png");

  // Enhanced SEO title with location, type, and Nairobi/Kenya
  const seoTitle = `${property.title} - ${property.type} ${isRental ? "for rent" : "for sale"} in ${property.location}, Nairobi, Kenya | Nikas Realty`;

  // Enhanced meta description with key details (150-160 characters)
  const seoDescription = (() => {
    const bedrooms = property.bedrooms ? `${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''}` : '';
    const price = priceNum ? `KES ${priceNum.toLocaleString()}` : '';
    const details = [bedrooms, price].filter(Boolean).join(', ');
    const baseDesc = (property.description || "").replace(/\s+/g, " ").trim().slice(0, 100);
    return `${property.title} in ${property.location}${details ? ` (${details})` : ''}. ${baseDesc} Browse with Nikas Realty.`.slice(0, 160);
  })();

  const listingDescription = seoDescription;
  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: listingDescription,
    url: absoluteUrl(`/properties/${property.id || id}`),
    image: listingImage,
    datePosted: property.createdAt ? new Date(property.createdAt).toISOString() : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location,
      addressCountry: "KE",
    },
    numberOfRooms: property.bedrooms,
    floorSize: property.size
      ? {
          "@type": "QuantitativeValue",
          name: property.size,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      price: priceNum || undefined,
      priceCurrency: "KES",
      availability: "https://schema.org/InStock",
      businessFunction: isRental
        ? "https://schema.org/LeaseOut"
        : "https://schema.org/Sell",
    },
    seller: {
      "@type": "RealEstateAgent",
      name: "Nikas Realty",
      url: SITE_URL,
    },
  };

  return (
    <div className="min-h-screen">
      <SEO
        title={seoTitle}
        description={seoDescription}
        path={`/properties/${property.id || id}`}
        image={listingImage}
        jsonLd={listingJsonLd}
      />
      <Navbar />
      <main className="container mx-auto px-4 lg:px-8 pt-28 pb-10">
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate("/");
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Hero Image */}
        <div
          className="relative w-full h-[50vh] md:h-[60vh] lg:h-[65vh] overflow-hidden rounded-xl shadow-lg cursor-zoom-in mb-8 bg-muted"
          onClick={() => openLightbox(0)}
        >
          <img
            src={displayImages[selectedImage]}
            alt={`${property.title} - ${property.type} in ${property.location}, Nairobi, Kenya`}
            className="w-full h-full object-contain"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8 lg:p-10">
            <div className="flex flex-wrap gap-2 mb-3">
              {property.status && (
                <Badge
                  variant={property.status === "for-sale" || property.status === "For Sale" ? "default" : property.status === "for-rent" || property.status === "For Rent" ? "secondary" : "outline"}
                  className={`font-semibold ${property.status === "for-sale" || property.status === "For Sale"
                    ? "gradient-gold text-secondary"
                    : property.status === "for-rent" || property.status === "For Rent"
                      ? "!text-white bg-secondary"
                      : "!text-white bg-muted"
                    }`}
                >
                  {property.status === "for-sale" || property.status === "For Sale"
                    ? "For Sale"
                    : property.status === "for-rent" || property.status === "For Rent"
                      ? "For Rent"
                      : property.status === "sold" || property.status === "Sold"
                        ? "Sold"
                        : property.status}
                </Badge>
              )}
              {property.featured && (
                <Badge className="gradient-gold text-secondary font-semibold">Featured</Badge>
              )}
              {property.offplan === true && (
                <Badge className="bg-blue-600 text-white font-semibold">Off-plan</Badge>
              )}
              <Badge variant="secondary" className="capitalize bg-white/90 text-foreground">{property.type}</Badge>
              {property.projectStage && (
                <Badge variant="outline" className="capitalize bg-white/90 text-foreground border-white/50">{property.projectStage}</Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{property.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/90">
              <span className="flex items-center gap-1.5 text-sm">
                <MapPin size={16} />
                {property.location}
              </span>
              {property.createdAt && (
                <span className="flex items-center gap-1.5 text-sm">
                  <Clock size={16} />
                  Posted {formatPostedDate(property.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Left Column - Details */}
          <div className="md:col-span-2 space-y-8">
            {/* Gallery */}
            {images.length > 1 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground">Gallery</h2>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(index);
                      }}
                      className={`relative aspect-square overflow-hidden rounded-lg transition-all duration-200 ${selectedImage === index ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
                        }`}
                    >
                      <img
                        src={thumbnailImages[index]}
                        alt={`${property.title} gallery image ${index + 1} - ${property.type} in ${property.location}, Nairobi`}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Metadata */}
            <div className="space-y-4 pb-6 border-b border-border">
              <div className="text-3xl md:text-4xl font-bold text-primary">
                {isRental && (property.priceDaily || property.priceMonthly) ? (
                  <div className="flex flex-col gap-1">
                    {property.priceMonthly && (
                      <span>
                        KES {property.priceMonthly.toLocaleString()}{' '}
                        <span className="text-lg text-muted-foreground font-normal">/ Month</span>
                      </span>
                    )}
                    {property.priceDaily && (
                      <span className="text-lg text-muted-foreground font-normal">
                        KES {property.priceDaily.toLocaleString()} / Day
                      </span>
                    )}
                  </div>
                ) : (
                  <span>
                    {property.priceType === 'from' && (
                      <span className="text-lg md:text-xl font-semibold text-primary/80 mr-1">From</span>
                    )}
                    {typeof property.price === 'number'
                      ? `KES ${property.price.toLocaleString()}`
                      : property.price}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-5 items-center text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Bed size={18} />
                  <span>{property.bedrooms ?? "-"} Beds</span>
                </span>
                <span className="flex items-center gap-2">
                  <Bath size={18} />
                  <span>{property.bathrooms ?? "-"} Baths</span>
                </span>
                <span className="flex items-center gap-2">
                  <Square size={18} />
                  <span>
                    {(() => {
                      const size = property.size?.trim();
                      if (!size) return "N/A";
                      const lower = size.toLowerCase();
                      const hasUnit = /sqm|sq\.?\s*m|sqft|sq\.?\s*ft|m²|ft²|acre/.test(lower);
                      return hasUnit ? size : `${size} sqm`;
                    })()}
                  </span>
                </span>
              </div>
            </div>

            {/* 1. Description */}
            {descriptionParagraphs.some((p) => p.trim()) && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground">Description</h2>
                <div className="space-y-1">{renderParagraphs(descriptionParagraphs)}</div>
              </section>
            )}

            {/* 2. Available Units & Prices */}
            {showAvailableUnits && property.availableUnits && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {property.availableUnits.title || 'Available Units & Prices'}
                </h2>

                <div className="space-y-5">
                  {property.availableUnits.categories.map((cat, catIndex) => (
                    cat.units.length > 0 && (
                      <div key={catIndex} className="space-y-2">
                        {cat.category && (
                          <h3 className="text-sm font-semibold text-foreground">{cat.category}</h3>
                        )}
                        <ul className="space-y-1.5">
                          {cat.units.map((unit, unitIndex) => (
                            <li
                              key={unitIndex}
                              className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed"
                            >
                              <span className="text-primary mt-0.5 shrink-0">•</span>
                              <span>
                                {unit.title}
                                {unit.price?.trim() && (
                                  <>
                                    {' '}
                                    —{' '}
                                    <span className="font-semibold text-foreground">{unit.price}</span>
                                  </>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  ))}
                </div>

                {property.availableUnits.closingParagraph?.trim() && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {property.availableUnits.closingParagraph}
                  </p>
                )}
              </section>
            )}

            {/* 3. Amenities */}
            {amenities.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground">Amenities & Features</h2>
                <ul className="space-y-1.5">
                  {amenities.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 4. Payment Plan */}
            {hasPaymentPlan && property.paymentPlan && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground">
                  {property.paymentPlan.title || 'Flexible Payment Plan'}
                </h2>

                {property.paymentPlan.paymentMethods && property.paymentPlan.paymentMethods.length > 0 && (
                  <ul className="space-y-1.5">
                    {property.paymentPlan.paymentMethods.includes('cash') && (
                      <li className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                        <span className="text-primary mt-0.5 shrink-0">•</span>
                        <span>Cash</span>
                      </li>
                    )}
                    {property.paymentPlan.paymentMethods.includes('mortgage') && (
                      <li className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                        <span className="text-primary mt-0.5 shrink-0">•</span>
                        <span>Mortgage</span>
                      </li>
                    )}
                  </ul>
                )}

                {paymentPlanParagraphs.some((p) => p.trim()) && (
                  <div className="space-y-1">{renderParagraphs(paymentPlanParagraphs)}</div>
                )}
              </section>
            )}

            {/* Legacy Payment Options fallback */}
            {!hasPaymentPlan && property.paymentOptions && property.paymentOptions.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground">Payment Options</h2>
                <ul className="space-y-1.5">
                  {property.paymentOptions.map((option, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      <span>{option}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 5. Completion Date */}
            {property.completionDate && (
              <section className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Completion Date</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{property.completionDate}</p>
              </section>
            )}
          </div>

          {/* Right Column - Contact / Booking Form */}
          <div className="md:col-span-1 space-y-6">
            <div className="md:sticky md:top-24">
              <PropertyEnquiryCard propertyName={property.title} propertyId={property.id} />
            </div>
            <OurListings />
            <LatestListings />
          </div>
        </div>

        {/* Similar Listings */}
        {property && <SimilarListings currentProperty={property} />}

        {/* Lightbox Modal */}
        {lightboxOpen && images.length > 0 && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
            >
              <X className="w-8 h-8" />
            </button>

            <button
              className="absolute left-4 text-white hover:text-gray-300 z-10 p-2"
              onClick={(e) => {
                e.stopPropagation();
                navigateImages('prev');
              }}
            >
              <ArrowLeft className="w-8 h-8" />
            </button>

            <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
              <img
                src={displayImages[selectedImage]}
                alt={`${property.title} full view - ${property.type} in ${property.location}, Nairobi, Kenya`}
                className="max-h-[90vh] max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
                onError={handleImageError}
              />
            </div>

            <button
              className="absolute right-4 text-white hover:text-gray-300 z-10 p-2"
              onClick={(e) => {
                e.stopPropagation();
                navigateImages('next');
              }}
            >
              <ArrowLeft className="w-8 h-8 transform rotate-180" />
            </button>

            <div className="absolute bottom-4 text-white text-center w-full text-sm">
              {selectedImage + 1} / {images.length}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetailsPage;
