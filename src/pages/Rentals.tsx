import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Square, Loader2, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Link, useNavigate } from "react-router-dom";
import { propertiesService, type Property } from "@/services/firestore/properties";
import { getPropertyImageUrl } from "@/utils/imageUtils";
import { PROPERTY_IMAGE_FALLBACK } from "@/constants/propertyImages";
import { parsePrice } from "@/data/properties";
import { PROPERTY_CONFIG } from "@/config/constants";
import SEO from "@/components/SEO";


const RentalsPage = () => {
    const navigate = useNavigate();
    const [allRentals, setAllRentals] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [bedrooms, setBedrooms] = useState("all");
    const [propertyType, setPropertyType] = useState("all");
    const [location, setLocation] = useState("all");
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]); // Monthly rent range
    const [sortBy, setSortBy] = useState("newest");

    useEffect(() => {
        const fetchRentals = async () => {
            try {
                const data = await propertiesService.getAll();

                // Filter only rental properties
                const rentals = (data || []).filter(
                    (p) => p.status === "For Rent" || p.status === "for-rent"
                );

                if (import.meta.env.DEV) {
                    console.log('Rentals loaded:', rentals.length, 'from Firestore');
                }
                setAllRentals(rentals);
            } catch (error) {
                console.error("Failed to fetch rentals:", error);
                setAllRentals([]);
            } finally {
                setLoading(false);
            }
        };
        fetchRentals();
    }, []);

    const hasActiveFilters = search || bedrooms !== "all" || propertyType !== "all" ||
        location !== "all" || priceRange[0] > 0 || priceRange[1] < 200000;

    const clearFilters = () => {
        setSearch("");
        setBedrooms("all");
        setPropertyType("all");
        setLocation("all");
        setPriceRange([0, 200000]);
        setSortBy("newest");
    };

    const filteredRentals = allRentals.filter((p) => {
        const searchLower = search.toLowerCase().trim();
        const matchesSearch = !searchLower ||
            (p.title?.toLowerCase().includes(searchLower) ?? false) ||
            (p.location?.toLowerCase().includes(searchLower) ?? false) ||
            (p.description?.toLowerCase().includes(searchLower) ?? false);
        const matchesBedrooms = bedrooms === "all" ? true : String(p.bedrooms) === bedrooms;
        const matchesType = propertyType === "all" ? true : p.type === propertyType;
        const matchesLocation = location === "all"
            ? true
            : p.location?.toLowerCase().includes(location.toLowerCase());
        const priceNum = typeof p.price === "number" ? p.price : parsePrice(String(p.price));
        const matchesPrice = priceNum >= priceRange[0] && priceNum <= priceRange[1];

        return (
            matchesSearch &&
            matchesBedrooms &&
            matchesType &&
            matchesLocation &&
            matchesPrice
        );
    });

    const sortedRentals = [...filteredRentals].sort((a, b) => {
        const priceA = typeof a.price === "number" ? a.price : parsePrice(String(a.price));
        const priceB = typeof b.price === "number" ? b.price : parsePrice(String(b.price));
        if (sortBy === "price-asc") return priceA - priceB;
        if (sortBy === "price-desc") return priceB - priceA;
        return 0;
    });

    const formatSize = (val?: string) => {
        if (!val) return "N/A";
        const size = val.trim();
        const lower = size.toLowerCase();
        const hasUnit = /sqm|sq\.?\s*m|sqft|sq\.?\s*ft|m²|ft²|acre/.test(lower);
        return hasUnit ? size : `${size} sqm`;
    };

    return (
        <div className="min-h-screen">
            <SEO
                title="Apartments & Houses for Rent in Nairobi, Kenya | Nikas Realty"
                description="Find apartments and houses for rent in Nairobi, Kenya. Browse rental listings in Westlands, Kilimani, Kileleshwa, Langata, Syokimau and other neighbourhoods with Nikas Realty."
                path="/rentals"
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "CollectionPage",
                    name: "Apartments and houses for rent in Kenya",
                    description:
                        "Find apartments and houses for rent in Nairobi, Kenya.",
                    url: "https://nikasrealtors.com/rentals",
                }}
            />
            <Navbar />

            <section className="py-20 lg:py-32 bg-muted/30">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                            Apartments &amp; Houses for <span className="text-primary">Rent in Kenya</span>
                        </h1>
                        <div className="h-1 w-20 gradient-gold mx-auto" />
                        <p className="text-lg text-muted-foreground">
                            Browse rental apartments, maisonettes and homes across Nairobi and Kenya
                        </p>
                    </div>



                    {/* Search and Filter */}
                    <div className="flex flex-wrap gap-4 mb-10 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by title, location or description..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="min-w-[160px]">
                            <Select value={propertyType} onValueChange={setPropertyType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Property Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="Apartment">Apartment</SelectItem>
                                    <SelectItem value="Mansion">Mansion</SelectItem>
                                    <SelectItem value="Maisonette">Maisonette</SelectItem>
                                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                                    <SelectItem value="Bungalow">Bungalow</SelectItem>
                                    <SelectItem value="Duplex">Duplex</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="min-w-[130px]">
                            <Select value={bedrooms} onValueChange={setBedrooms}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Bedrooms" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="1">1</SelectItem>
                                    <SelectItem value="2">2</SelectItem>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="5">5+</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="min-w-[160px]">
                            <Select value={location} onValueChange={setLocation}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    {PROPERTY_CONFIG.locations.map((loc) => (
                                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[220px]">
                            <div className="text-xs text-muted-foreground mb-1">Monthly Rent (KES)</div>
                            <Slider
                                value={priceRange}
                                onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
                                min={0}
                                max={200000}
                                step={5000}
                            />
                            <div className="flex justify-between text-xs mt-1">
                                <span>{priceRange[0].toLocaleString()}</span>
                                <span>{priceRange[1].toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="min-w-[160px]">
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sort By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                                className="gap-1 text-sm"
                            >
                                <X className="h-4 w-4" />
                                Clear Filters
                            </Button>
                        )}
                    </div>

                    {/* Results count */}
                    <div className="mb-6 text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{sortedRentals.length}</span> rental {sortedRentals.length === 1 ? 'property' : 'properties'}
                    </div>

                    {/* Rentals Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            <div className="col-span-full flex justify-center py-12">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            </div>
                        ) : sortedRentals.length === 0 ? (
                            <div className="col-span-full text-center text-muted-foreground py-8 text-lg">
                                No rental properties match your search.
                            </div>
                        ) : (
                            sortedRentals.map((property) => {
                                const mainImage = getPropertyImageUrl(
                                    property.images?.[0] || property.image || PROPERTY_IMAGE_FALLBACK,
                                    'card'
                                );

                                return (
                                    <Card
                                        key={property.id}
                                        className="overflow-hidden group hover:shadow-luxury transition-smooth cursor-pointer"
                                        onClick={() => navigate(`/properties/${property.id}`)}
                                    >
                                        {/* Image */}
                                        <div className="relative h-64 overflow-hidden bg-muted">
                                            <img
                                                src={mainImage}
                                                alt={property.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                                                loading="lazy"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = PROPERTY_IMAGE_FALLBACK;
                                                }}
                                            />
                                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                                <Badge className="!text-white bg-secondary font-semibold shadow-lg">
                                                    For Rent
                                                </Badge>
                                                {property.featured && (
                                                    <Badge className="gradient-gold text-secondary font-semibold shadow-lg">
                                                        Featured
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <CardHeader>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {property.type && (
                                                    <Badge variant="secondary" className="capitalize">
                                                        {property.type}
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-xl group-hover:text-primary transition-smooth">
                                                {property.id ? (
                                                    <Link
                                                        to={`/properties/${property.id}`}
                                                        onClick={(event) => event.stopPropagation()}
                                                    >
                                                        {property.title}
                                                    </Link>
                                                ) : property.title}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-1 text-muted-foreground">
                                                <MapPin size={16} />
                                                {property.location}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            <p className="text-muted-foreground text-xs line-clamp-2">{property.description}</p>

                                            {/* Property Details */}
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Bed size={16} />
                                                    <span>{property.bedrooms ?? "-"} Beds</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Bath size={16} />
                                                    <span>{property.bathrooms ?? "-"} Baths</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Square size={16} />
                                                    <span>{formatSize(property.size)}</span>
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="pt-4 border-t border-border">
                                                {(property.priceDaily || property.priceMonthly) ? (
                                                    <div className="space-y-1">
                                                        {property.priceMonthly && (
                                                            <p className="text-2xl font-bold text-primary">
                                                                KES {property.priceMonthly?.toLocaleString() ?? '0'} <span className="text-base font-normal text-muted-foreground">/ Month</span>
                                                            </p>
                                                        )}
                                                        {property.priceDaily && (
                                                            <p className={`${property.priceMonthly ? 'text-lg' : 'text-2xl'} font-bold text-primary`}>
                                                                KES {property.priceDaily?.toLocaleString() ?? '0'} <span className="text-sm font-normal text-muted-foreground">/ Day</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-2xl font-bold text-primary">
                                                        {typeof property.price === "number"
                                                            ? `KES ${property.price.toLocaleString()}/month`
                                                            : `${property.price}/month`}
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>

                                        <CardFooter>
                                            <Button
                                                asChild
                                                className="w-full gradient-gold text-secondary font-semibold hover:scale-105 transition-smooth"
                                            >
                                                <Link
                                                    to={`/properties/${property.id}`}
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    View Details
                                                </Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default RentalsPage;
