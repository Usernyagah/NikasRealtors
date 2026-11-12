import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { propertiesService, type Property } from "@/services/firestore/properties";
import { getPropertyImageUrl } from "@/utils/imageUtils";
import { PROPERTY_IMAGE_FALLBACK } from "@/constants/propertyImages";
import { formatPropertyPrice } from "@/utils/propertyUtils";
import { getPropertyDetailPath } from "@/utils/propertyRoutes";
import { Loader2 } from "lucide-react";

const LatestListings = () => {
  const [latestProperties, setLatestProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestProperties = async () => {
      try {
        setLoading(true);
        // Get all properties sorted by createdAt (most recent first)
        const allProperties = await propertiesService.getAll({ sortBy: 'createdAt', order: 'desc' });
        // Take the latest 5 properties
        setLatestProperties(allProperties.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch latest properties:", error);
        setLatestProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProperties();
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Latest Listing</h3>
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (latestProperties.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">Latest Listing</h3>
      <div className="space-y-4">
        {latestProperties.map((property) => {
          const mainImage = getPropertyImageUrl(
            property.images?.[0] || property.image || PROPERTY_IMAGE_FALLBACK,
            'thumbnail'
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
            <Link
              key={property.id}
              to={getPropertyDetailPath(property)}
              className="flex gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            >
              {/* Image */}
              <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                <img
                  src={mainImage}
                  alt={property.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (!img.dataset.fallback) {
                      img.dataset.fallback = 'true';
                      img.src = PROPERTY_IMAGE_FALLBACK;
                    }
                  }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="text-sm font-semibold text-foreground line-clamp-1 mb-1">
                  {property.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                  {property.location}
                </p>
                <p className="text-sm font-bold text-primary">
                  {displayPrice}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default LatestListings;
