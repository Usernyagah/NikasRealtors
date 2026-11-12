import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, Square, Loader2 } from "lucide-react";
import { propertiesService, type Property } from "@/services/firestore/properties";
import { getPropertyImageUrl } from "@/utils/imageUtils";
import { PROPERTY_IMAGE_FALLBACK } from "@/constants/propertyImages";
import { formatPropertyPrice } from "@/utils/propertyUtils";
import { getPropertyDetailPath } from "@/utils/propertyRoutes";

interface SimilarListingsProps {
  currentProperty: Property;
}

const SimilarListings = ({ currentProperty }: SimilarListingsProps) => {
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilarProperties = async () => {
      try {
        setLoading(true);
        const similar = await propertiesService.getSimilarProperties(currentProperty, 4);
        setSimilarProperties(similar);
      } catch (error) {
        console.error("Failed to fetch similar properties:", error);
        setSimilarProperties([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentProperty) {
      fetchSimilarProperties();
    }
  }, [currentProperty]);

  const formatSize = (val?: string) => {
    if (!val) return "N/A";
    const size = val.trim();
    const lower = size.toLowerCase();
    const hasUnit = /sqm|sq\.?\s*m|sqft|sq\.?\s*ft|m²|ft²|acre/.test(lower);
    return hasUnit ? size : `${size} sqm`;
  };

  if (loading) {
    return (
      <section className="mt-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">Similar Listings</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (similarProperties.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-foreground mb-6">Similar Listings</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {similarProperties.map((property) => {
          const mainImage = getPropertyImageUrl(
            property.images?.[0] || property.image || PROPERTY_IMAGE_FALLBACK,
            'card'
          );

          let displayPrice = formatPropertyPrice(property).replace(/^From\s/, '');

          if ((property.status === 'for-rent' || property.status === 'For Rent') && (property.priceDaily || property.priceMonthly)) {
            if (property.priceMonthly) {
              displayPrice = `KES ${property.priceMonthly?.toLocaleString() ?? '0'} / Month`;
            } else if (property.priceDaily) {
              displayPrice = `KES ${property.priceDaily?.toLocaleString() ?? '0'} / Day`;
            }
          }

          return (
            <Link key={property.id} to={getPropertyDetailPath(property)} className="block h-full">
            <Card className="overflow-hidden group hover:shadow-luxury transition-smooth h-full">
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-muted">
                <img
                  src={mainImage}
                  alt={property.title}
                  className="w-full h-full object-contain group-hover:scale-110 transition-smooth"
                  loading="lazy"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (!img.dataset.fallback) {
                      img.dataset.fallback = 'true';
                      img.src = PROPERTY_IMAGE_FALLBACK;
                    }
                  }}
                />
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  {property.status && (
                    <Badge
                      variant={property.status === "for-sale" || property.status === "For Sale" ? "default" : property.status === "for-rent" || property.status === "For Rent" ? "secondary" : "outline"}
                      className={`font-semibold shadow-lg text-xs ${property.status === "for-sale" || property.status === "For Sale"
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
                    <Badge className="gradient-gold text-secondary font-semibold shadow-lg text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content */}
              <CardHeader className="pb-3">
                <CardTitle className="text-base group-hover:text-primary transition-smooth line-clamp-1">
                  {property.title}
                </CardTitle>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={12} />
                  <span className="line-clamp-1">{property.location}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pb-3">
                {/* Property Details */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Bed size={14} />
                    <span>{property.bedrooms ?? "-"} Beds</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath size={14} />
                    <span>{property.bathrooms ?? "-"} Baths</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Square size={14} />
                    <span>{formatSize(property.size)}</span>
                  </div>
                </div>

                {/* Price */}
                <p className="text-lg font-bold text-primary">
                  {displayPrice}
                </p>
              </CardContent>

              <CardFooter>
                <Button className="w-full gradient-gold text-secondary font-semibold text-sm hover:scale-105 transition-smooth">
                  View Details
                </Button>
              </CardFooter>
            </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default SimilarListings;
