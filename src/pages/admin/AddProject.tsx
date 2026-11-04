import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload,
  X,
  Plus,
  Trash2,
  Building,
  MapPin,
  Sparkles,
  Search,
  Eye,
  FileText,
  Calendar,
  CheckCircle2,
  Layers,
  Phone,
  Mail,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import { firebaseStorage } from "@/services/firebaseStorage";
import { projectsService, generateSensibleSEO, type Project, type ApartmentConfiguration, type ProjectSEO } from "@/services/firestore/projects";
import ApartmentConfigurationsBuilder from "@/components/admin/ApartmentConfigurationsBuilder";
import SearchSnippetPreview from "@/components/admin/SearchSnippetPreview";
import { toast } from "sonner";
import { slugify } from "@/utils/text";

const COMMON_AMENITIES = [
  "Swimming Pool",
  "Fully Equipped Gym",
  "High Speed Elevators",
  "Borehole Water Supply",
  "Full Backup Generator",
  "CCTV Surveillance & 24/7 Security",
  "Children's Play Area",
  "Rooftop Terrace / Lounge",
  "Ample Secure Parking",
  "Intercom System",
  "Solar Water Heating",
  "Landscaped Gardens",
  "Clubhouse",
  "Sauna & Steam Bath",
  "Electric Fence",
];

const AdminAddProject = () => {
  const navigate = useNavigate();

  // Basic info
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [developer, setDeveloper] = useState("");
  const [location, setLocation] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [county, setCounty] = useState("Nairobi");
  const [country, setCountry] = useState("Kenya");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");

  // Pricing & Status
  const [startingPrice, setStartingPrice] = useState<number | "">("");
  const [constructionStatus, setConstructionStatus] = useState<Project["constructionStatus"]>("Under Construction");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("draft");

  // Media
  const [featuredImage, setFeaturedImage] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [brochureUrl, setBrochureUrl] = useState("");
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);

  // Lists
  const [amenities, setAmenities] = useState<string[]>([
    "Swimming Pool",
    "Fully Equipped Gym",
    "High Speed Elevators",
    "Full Backup Generator",
    "Borehole Water Supply",
  ]);
  const [newAmenity, setNewAmenity] = useState("");

  const [paymentPlans, setPaymentPlans] = useState<string[]>([
    "20% Down payment on booking",
    "10% Quarterly installments across construction period",
    "Balance due on handover / mortgage financing accepted",
  ]);
  const [newPaymentPlan, setNewPaymentPlan] = useState("");

  const [nearbyLandmarks, setNearbyLandmarks] = useState<string[]>([
    "5 minutes to major shopping malls",
    "Proximity to top international schools",
    "Easy access to Nairobi Expressway & CBD",
  ]);
  const [newLandmark, setNewLandmark] = useState("");

  // Configurations
  const [configurations, setConfigurations] = useState<ApartmentConfiguration[]>([
    {
      id: "config-1",
      propertyType: "Apartment",
      bedrooms: 2,
      bathrooms: 2,
      floorAreaSqFt: 1100,
      startingPrice: 12500000,
      availabilityStatus: "Available",
      floorPlanImage: "",
    },
    {
      id: "config-2",
      propertyType: "Apartment",
      bedrooms: 3,
      bathrooms: 3,
      floorAreaSqFt: 1650,
      startingPrice: 16500000,
      availabilityStatus: "Available",
      floorPlanImage: "",
    },
  ]);

  // Contact
  const [contactPhone, setContactPhone] = useState("+254 700 000 000");
  const [contactEmail, setContactEmail] = useState("info@nikasrealtor.com");
  const [contactWhatsApp, setContactWhatsApp] = useState("+254 700 000 000");

  // SEO Settings
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [socialSharingImage, setSocialSharingImage] = useState("");
  const [searchEngineIndexing, setSearchEngineIndexing] = useState<"index" | "noindex">("index");
  const [isSeoManuallyEdited, setIsSeoManuallyEdited] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Auto-generate slug when name changes
  const handleNameChange = (val: string) => {
    setName(val);
    const newSlug = slugify(val);
    setSlug(newSlug);
  };

  // Compute sensible default SEO
  const sensibleSEO = generateSensibleSEO({
    name,
    location: neighborhood ? `${neighborhood}, ${location}` : location,
    developer,
    startingPrice: startingPrice ? Number(startingPrice) : undefined,
    shortDescription,
    slug,
  });

  // Effective preview SEO values (defaults if empty)
  const effectiveTitle = seoTitle.trim() || sensibleSEO.title;
  const effectiveDescription = metaDescription.trim() || sensibleSEO.description;
  const effectiveCanonical = canonicalUrl.trim() || sensibleSEO.canonical;

  const handleApplySensibleDefaults = () => {
    setSeoTitle(sensibleSEO.title);
    setMetaDescription(sensibleSEO.description);
    setCanonicalUrl(sensibleSEO.canonical);
    setFocusKeyword(`${name} apartments ${location || "Nairobi"}`);
    setIsSeoManuallyEdited(true);
    toast.info("Applied auto-generated SEO defaults.");
  };

  // Media upload handlers
  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFeatured(true);
    try {
      const url = await firebaseStorage.uploadFile(
        file,
        `projects/featured/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
      );
      setFeaturedImage(url);
      if (!socialSharingImage) setSocialSharingImage(url);
      toast.success("Featured image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingFeatured(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    try {
      const urls = await firebaseStorage.uploadFiles(
        Array.from(files),
        `projects/gallery/${Date.now()}`
      );
      setGallery([...gallery, ...urls]);
      toast.success(`Uploaded ${urls.length} images to gallery`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload images");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBrochure(true);
    try {
      const url = await firebaseStorage.uploadFile(
        file,
        `projects/brochures/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
      );
      setBrochureUrl(url);
      toast.success("Brochure uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload brochure");
    } finally {
      setUploadingBrochure(false);
    }
  };

  // Amenities list helpers
  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return;
    if (!amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
    }
    setNewAmenity("");
  };

  const handleTogglePresetAmenity = (item: string) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter((a) => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  // Payment plan list helpers
  const handleAddPaymentPlan = () => {
    if (!newPaymentPlan.trim()) return;
    setPaymentPlans([...paymentPlans, newPaymentPlan.trim()]);
    setNewPaymentPlan("");
  };

  // Landmarks list helpers
  const handleAddLandmark = () => {
    if (!newLandmark.trim()) return;
    setNearbyLandmarks([...nearbyLandmarks, newLandmark.trim()]);
    setNewLandmark("");
  };

  // Submit
  const handleSubmit = async (submitStatus: "published" | "draft") => {
    if (!name.trim()) {
      toast.error("Please enter a project name.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Please enter a valid project slug.");
      return;
    }
    if (!location.trim()) {
      toast.error("Please specify the project location.");
      return;
    }
    if (!startingPrice || Number(startingPrice) <= 0) {
      toast.error("Please enter a starting price.");
      return;
    }
    if (!shortDescription.trim()) {
      toast.error("Please provide a short summary description.");
      return;
    }

    setSubmitting(true);
    try {
      const projectPayload: Omit<Project, "id" | "createdAt" | "updatedAt" | "publishedAt"> = {
        name: name.trim(),
        slug: slug.trim(),
        developer: developer.trim() || undefined,
        location: location.trim(),
        neighborhood: neighborhood.trim() || undefined,
        county: county.trim() || "Nairobi",
        country: country.trim() || "Kenya",
        googleMapsUrl: googleMapsUrl.trim() || undefined,
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription.trim() || shortDescription.trim(),

        startingPrice: Number(startingPrice),
        status: submitStatus,
        constructionStatus,
        expectedCompletionDate: expectedCompletionDate.trim() || undefined,

        featuredImage: featuredImage || gallery[0] || "",
        gallery,
        brochureUrl: brochureUrl || undefined,

        amenities,
        paymentPlans,
        nearbyLandmarks,

        configurations,

        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactWhatsApp: contactWhatsApp.trim() || undefined,

        seo: {
          seoTitle: seoTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          canonicalUrl: canonicalUrl.trim() || undefined,
          focusKeyword: focusKeyword.trim() || undefined,
          socialSharingImage: socialSharingImage || featuredImage || undefined,
          searchEngineIndexing,
        },
      };

      await projectsService.create(projectPayload);
      toast.success(
        submitStatus === "published"
          ? `Project "${name}" published successfully! Public page is now live.`
          : `Project "${name}" saved as draft.`
      );
      navigate("/admin/projects");
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Add New Project</h1>
            <p className="text-sm text-muted-foreground">
              Create a new off-plan or new development real estate project with unit configurations and SEO.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/admin/projects")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={submitting}
            >
              Save Draft
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit("published")}
              disabled={submitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" /> Publish Project
            </Button>
          </div>
        </div>

        {/* Section 1: Basic Information */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" /> Basic Information
            </CardTitle>
            <CardDescription>
              Core identity, branding, developer, and location of the real estate project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Ivy Park Residences"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug">Project URL Slug *</Label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground hidden sm:inline">/projects/</span>
                  <Input
                    id="slug"
                    placeholder="ivy-park-residences"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="developer">Developer Name</Label>
                <Input
                  id="developer"
                  placeholder="e.g. Prime Living Developments"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Project Location / City *</Label>
                <Input
                  id="location"
                  placeholder="e.g. Nairobi"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="neighborhood">Neighborhood / Suburb</Label>
                <Input
                  id="neighborhood"
                  placeholder="e.g. Kilimani, Westlands, Kileleshwa"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="county">County</Label>
                  <Input
                    id="county"
                    placeholder="Nairobi"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="Kenya"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="googleMapsUrl">Google Maps Link / Embed URL</Label>
              <Input
                id="googleMapsUrl"
                placeholder="https://maps.google.com/..."
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shortDescription">Short Description (Summary) *</Label>
              <Textarea
                id="shortDescription"
                rows={2}
                placeholder="A compelling 2-3 sentence overview of this development."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fullDescription">Full Project Description</Label>
              <Textarea
                id="fullDescription"
                rows={6}
                placeholder="Detailed architectural concept, lifestyle highlights, construction craftsmanship, investment ROI, and location benefits..."
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Pricing, Status & Dates */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Project Timeline & Starting Price
            </CardTitle>
            <CardDescription>
              Set the benchmark starting price, current construction stage, and handover horizon.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startingPrice">Starting Price (KES) *</Label>
              <Input
                id="startingPrice"
                type="number"
                min="0"
                placeholder="e.g. 12500000"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value ? Number(e.target.value) : "")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="constructionStatus">Construction Status</Label>
              <Select
                value={constructionStatus}
                onValueChange={(val: any) => setConstructionStatus(val)}
              >
                <SelectTrigger id="constructionStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning / Concept</SelectItem>
                  <SelectItem value="Under Construction">Under Construction</SelectItem>
                  <SelectItem value="Nearing Completion">Nearing Completion</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Ready to Move">Ready to Move</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expectedCompletionDate">Expected Completion Date</Label>
              <Input
                id="expectedCompletionDate"
                placeholder="e.g. Q4 2026 or Dec 2026"
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Apartment Configurations */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> Apartment Configurations
            </CardTitle>
            <CardDescription>
              Configure the available unit types (e.g. 1, 2, 3 bedrooms, penthouses), square footage, price range, and floor plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApartmentConfigurationsBuilder
              configurations={configurations}
              onChange={setConfigurations}
            />
          </CardContent>
        </Card>

        {/* Section 4: Media, Imagery & Brochure */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Project Media & Brochure
            </CardTitle>
            <CardDescription>
              Upload high-resolution architectural renders, interior mockups, and PDF brochure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Featured Image */}
            <div className="space-y-2">
              <Label>Featured / Cover Image *</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-full sm:w-48 h-32 rounded-lg border-2 border-dashed border-border overflow-hidden bg-muted/40 flex items-center justify-center relative">
                  {featuredImage ? (
                    <img
                      src={featuredImage}
                      alt="Featured preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building className="h-8 w-8 text-muted-foreground/40" />
                  )}
                  {uploadingFeatured && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center text-xs">
                      Uploading...
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    id="featured-upload"
                    className="hidden"
                    onChange={handleFeaturedImageUpload}
                  />
                  <div className="flex gap-2">
                    <label
                      htmlFor="featured-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    >
                      <Upload className="h-3.5 w-3.5" /> Choose Cover Image
                    </label>
                    {featuredImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFeaturedImage("")}
                        className="text-xs text-destructive hover:bg-destructive/10"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 1920x1080px (16:9 ratio). High resolution render of the building exterior.
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Images */}
            <div className="space-y-2">
              <Label>Project Gallery</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                id="gallery-upload"
                className="hidden"
                onChange={handleGalleryUpload}
              />
              <div className="flex items-center gap-2 mb-3">
                <label
                  htmlFor="gallery-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingGallery ? "Uploading Images..." : "Upload Gallery Photos"}
                </label>
                <span className="text-xs text-muted-foreground">
                  {gallery.length} images added
                </span>
              </div>

              {gallery.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                  {gallery.map((imgUrl, index) => (
                    <div
                      key={index}
                      className="relative group aspect-video rounded-lg overflow-hidden border bg-muted"
                    >
                      <img
                        src={imgUrl}
                        alt={`Gallery preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setGallery(gallery.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PDF Brochure */}
            <div className="space-y-2">
              <Label>Project Brochure (PDF or Link)</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="https://... or upload PDF document below"
                  value={brochureUrl}
                  onChange={(e) => setBrochureUrl(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="file"
                  accept=".pdf,image/*"
                  id="brochure-upload"
                  className="hidden"
                  onChange={handleBrochureUpload}
                />
                <label
                  htmlFor="brochure-upload"
                  className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground whitespace-nowrap"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {uploadingBrochure ? "Uploading..." : "Upload PDF Brochure"}
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Amenities, Payment Plans & Landmarks */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Amenities, Payment Plans & Landmarks
            </CardTitle>
            <CardDescription>
              Highlight building features, flexible payment schedules, and key neighborhood destinations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amenities */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Amenities</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_AMENITIES.map((item) => {
                  const active = amenities.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleTogglePresetAmenity(item)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {active ? `✓ ${item}` : `+ ${item}`}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom amenity..."
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAmenity();
                    }
                  }}
                  className="h-9"
                />
                <Button type="button" size="sm" onClick={handleAddAmenity} variant="outline">
                  Add
                </Button>
              </div>

              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {amenities.map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-md"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => setAmenities(amenities.filter((_, idx) => idx !== i))}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Plans */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-semibold">Payment Milestones / Plans</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 20% Deposit, 70% in quarterly installments, 10% on handover"
                  value={newPaymentPlan}
                  onChange={(e) => setNewPaymentPlan(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPaymentPlan();
                    }
                  }}
                  className="h-9"
                />
                <Button type="button" size="sm" onClick={handleAddPaymentPlan} variant="outline">
                  Add
                </Button>
              </div>

              <div className="space-y-1.5">
                {paymentPlans.map((plan, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/40 text-xs border"
                  >
                    <span>{plan}</span>
                    <button
                      type="button"
                      onClick={() => setPaymentPlans(paymentPlans.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby Landmarks */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-semibold">Nearby Landmarks & Connectivity</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 5 min to Sarit Centre, 10 min to UN Gigiri"
                  value={newLandmark}
                  onChange={(e) => setNewLandmark(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLandmark();
                    }
                  }}
                  className="h-9"
                />
                <Button type="button" size="sm" onClick={handleAddLandmark} variant="outline">
                  Add
                </Button>
              </div>

              <div className="space-y-1.5">
                {nearbyLandmarks.map((lm, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/40 text-xs border"
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-primary" /> {lm}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNearbyLandmarks(nearbyLandmarks.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Contact Information */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" /> Project Inquiries & Sales Contact
            </CardTitle>
            <CardDescription>
              Direct contact channels shown on the project page for private tours and booking inquiries.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contactPhone" className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" /> Direct Sales Phone
              </Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail" className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" /> Sales Email
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactWhatsApp" className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3 text-green-600" /> WhatsApp Direct Number
              </Label>
              <Input
                id="contactWhatsApp"
                placeholder="+254 700 000 000"
                value={contactWhatsApp}
                onChange={(e) => setContactWhatsApp(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 7: SEO Settings with Live Google Search Snippet Preview */}
        <Card className="border border-border/80 shadow-sm bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" /> Search Engine Optimization (SEO)
              </CardTitle>
              <CardDescription>
                Customize how search engines index and rank this project. Defaults are automatically generated.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplySensibleDefaults}
              className="text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
            >
              <Sparkles className="h-3.5 w-3.5" /> Auto-fill Sensible Defaults
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Live Search Snippet Preview */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Live Google Search Snippet Preview
              </Label>
              <SearchSnippetPreview
                title={effectiveTitle}
                url={effectiveCanonical}
                description={effectiveDescription}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seoTitle" className="text-xs font-medium">
                    SEO Title Tag
                  </Label>
                  <span className={`text-[11px] ${effectiveTitle.length > 60 ? "text-amber-500 font-medium" : "text-muted-foreground"}`}>
                    {seoTitle.length || effectiveTitle.length}/60 chars
                  </span>
                </div>
                <Input
                  id="seoTitle"
                  placeholder={sensibleSEO.title}
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoTitle(e.target.value);
                    setIsSeoManuallyEdited(true);
                  }}
                />
                <p className="text-[11px] text-muted-foreground">
                  Leave empty to use automatic default based on project name and location.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="focusKeyword" className="text-xs font-medium">
                  Focus Keyword (for reference)
                </Label>
                <Input
                  id="focusKeyword"
                  placeholder="e.g. ivy park residences kilimani"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Primary phrase you are targeting (no keyword stuffing).
                </p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaDescription" className="text-xs font-medium">
                    Meta Description
                  </Label>
                  <span className={`text-[11px] ${effectiveDescription.length > 160 ? "text-amber-500 font-medium" : "text-muted-foreground"}`}>
                    {metaDescription.length || effectiveDescription.length}/160 chars
                  </span>
                </div>
                <Textarea
                  id="metaDescription"
                  rows={2}
                  placeholder={sensibleSEO.description}
                  value={metaDescription}
                  onChange={(e) => {
                    setMetaDescription(e.target.value);
                    setIsSeoManuallyEdited(true);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="canonicalUrl" className="text-xs font-medium">
                  Canonical URL
                </Label>
                <Input
                  id="canonicalUrl"
                  placeholder={sensibleSEO.canonical}
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="indexing" className="text-xs font-medium">
                  Search Engine Indexing
                </Label>
                <Select
                  value={searchEngineIndexing}
                  onValueChange={(val: any) => setSearchEngineIndexing(val)}
                >
                  <SelectTrigger id="indexing">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="index">Index (Recommended - allow search engines)</SelectItem>
                    <SelectItem value="noindex">Noindex (Hide from search results)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="socialSharingImage" className="text-xs font-medium">
                  Social Sharing Image (og:image / Twitter card)
                </Label>
                <Input
                  id="socialSharingImage"
                  placeholder="Defaults to Featured Cover Image"
                  value={socialSharingImage}
                  onChange={(e) => setSocialSharingImage(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Actions Bar */}
        <div className="sticky bottom-4 z-20 bg-background/95 backdrop-blur border border-border p-4 rounded-xl shadow-luxury flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Status: <span className="font-semibold text-foreground uppercase">{status}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/projects")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSubmit("draft")}
              disabled={submitting}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit("published")}
              disabled={submitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" /> Publish Project
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAddProject;
