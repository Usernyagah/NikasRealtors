import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { firebaseStorage } from "@/services/firebaseStorage";
import { projectsService, type ApartmentConfiguration, type ProjectFAQ } from "@/services/firestore/projects";
import { slugify } from "@/utils/text";
import { toast } from "sonner";
import { CalendarDays, Check, FileText, ImagePlus, MapPin, Plus, Search, Trash2 } from "lucide-react";

const AMENITY_OPTIONS = [
  "Heated Indoor Swimming Pool",
  "Fully Equipped Gym & Yoga Room",
  "Co-working Space",
  "Rooftop Lounge",
  "Borehole Water with Purifier",
  "Full Backup Generator",
  "High-Speed Lifts",
  "24/7 CCTV Security",
  "Kids Play Area",
];

type UnitDraft = {
  unitTitle: string;
  floorAreaLabel: string;
  buildingWing: string;
  cashPrice: string;
  installmentPriceRange: string;
};

type GalleryImage = { url: string; alt: string };

const FAQ_QUESTIONS = [
  "What is the starting price for units at {name}?",
  "When is {name} expected to be completed?",
  "What payment plan is available at {name}?",
];

const formatKES = (value: string | number) =>
  Number(value || 0).toLocaleString("en-KE");

const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  min,
  idSuffix = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  min?: number;
  idSuffix?: string;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={`project-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idSuffix}`}>{label}{required ? " *" : ""}</Label>
    <Input
      id={`project-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idSuffix}`}
      type={type}
      min={min}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required={required}
    />
  </div>
);

const ProjectCreate = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [neighborhood, setNeighborhood] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Nairobi");
  const [completionDate, setCompletionDate] = useState("");
  const [developer, setDeveloper] = useState("");
  const [pastProjects, setPastProjects] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [depositPercentage, setDepositPercentage] = useState("20");
  const [paymentPlanSummary, setPaymentPlanSummary] = useState("");
  const [units, setUnits] = useState<UnitDraft[]>([
    { unitTitle: "", floorAreaLabel: "", buildingWing: "", cashPrice: "", installmentPriceRange: "" },
  ]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroAlt, setHeroAlt] = useState("");
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [brochureUrl, setBrochureUrl] = useState("");
  const [faqs, setFaqs] = useState<ProjectFAQ[]>(() =>
    FAQ_QUESTIONS.map((question) => ({ question, answer: "" })),
  );
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [seoTitleEdited, setSeoTitleEdited] = useState(false);
  const [descriptionEdited, setDescriptionEdited] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const defaultSeoTitle = useMemo(() => {
    const unitNames = units.map((unit) => unit.unitTitle.trim()).filter(Boolean).join(", ");
    const price = startingPrice ? ` (From KES ${formatKES(startingPrice)})` : "";
    return `${name.trim() || "[Project Name]"} ${neighborhood.trim() || "[Neighborhood]"}: ${unitNames || "[Unit Types]"}${price}`;
  }, [name, neighborhood, units, startingPrice]);

  const defaultMetaDescription = useMemo(() => {
    const price = startingPrice ? ` from KES ${formatKES(startingPrice)}` : "";
    const location = [neighborhood.trim(), city.trim()].filter(Boolean).join(", ");
    return `Explore ${name.trim() || "this new development"} in ${location || "Nairobi"}${price}. View unit sizes, flexible payment options, amenities and request the brochure from Nikas Realty.`.slice(0, 160);
  }, [name, neighborhood, city, startingPrice]);

  const updateUnit = (index: number, field: keyof UnitDraft, value: string) => {
    setUnits((current) => current.map((unit, i) => i === index ? { ...unit, [field]: value } : unit));
  };

  const uploadImage = async (file: File, path: string) =>
    firebaseStorage.uploadFile(file, `${path}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`);

  const handleHeroUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file for the hero image.");
      return;
    }
    setUploading(true);
    try {
      setHeroImage(await uploadImage(file, "projects/featured"));
      toast.success("Hero image uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload hero image.");
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (selected.some((file) => !file.type.startsWith("image/"))) {
      toast.error("Choose image files for the gallery.");
      return;
    }
    setUploading(true);
    try {
      const urls = await firebaseStorage.uploadFiles(selected, `projects/gallery/${Date.now()}`);
      setGallery((current) => [
        ...current,
        ...urls.map((url, index) => ({ url, alt: `${name || "Project"} gallery image ${current.length + index + 1}` })),
      ]);
      toast.success(`${urls.length} gallery image${urls.length === 1 ? "" : "s"} uploaded.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload gallery images.");
    } finally {
      setUploading(false);
    }
  };

  const handleBrochureUpload = async (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("The brochure must be a PDF.");
      return;
    }
    setUploading(true);
    try {
      setBrochureUrl(await firebaseStorage.uploadDocument(
        file,
        `projects/brochures/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
      ));
      toast.success("Brochure uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload brochure.");
    } finally {
      setUploading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((current) => current.includes(amenity)
      ? current.filter((item) => item !== amenity)
      : [...current, amenity]);
  };

  const addCustomAmenity = () => {
    const value = customAmenity.trim();
    if (!value) return;
    if (!amenities.includes(value)) setAmenities((current) => [...current, value]);
    setCustomAmenity("");
  };

  const handleSubmit = async (status: "draft" | "published") => {
    const defaultFaqAnswers = new Map<string, string>([
      [
        FAQ_QUESTIONS[0].replace(/\{name\}/g, name.trim()),
        `${name} in ${neighborhood} has homes starting from KES ${formatKES(startingPrice)}, subject to availability.`,
      ],
      [
        FAQ_QUESTIONS[1].replace(/\{name\}/g, name.trim()),
        `${name} is expected to be completed in ${completionDate}. Please contact Nikas Realty to confirm the latest construction schedule.`,
      ],
      [
        FAQ_QUESTIONS[2].replace(/\{name\}/g, name.trim()),
        paymentPlanSummary.trim() || `The minimum deposit is ${depositPercentage}%, with the balance payable according to the agreed construction payment schedule. Contact Nikas Realty for the full plan.`,
      ],
    ]);
    const hasUnitValues = (unit: UnitDraft) => Object.values(unit).some((value) => value.trim());
    const incompleteUnit = units.some((unit) => hasUnitValues(unit) && (
      !unit.unitTitle.trim() ||
      !unit.floorAreaLabel.trim() ||
      !unit.cashPrice ||
      Number(unit.cashPrice) <= 0
    ));
    if (incompleteUnit) {
      toast.error("Complete the unit title, floor area, and a positive cash price for each started unit row.");
      return;
    }
    const validUnits = units.filter((unit) =>
      unit.unitTitle.trim() && unit.floorAreaLabel.trim() && unit.cashPrice && Number(unit.cashPrice) > 0,
    );
    if (!name.trim() || !slug.trim() || !neighborhood.trim() || !street.trim() || !city.trim()) {
      toast.error("Enter the project name, slug, street, neighborhood, and city.");
      return;
    }
    if (!completionDate.trim() || !developer.trim()) {
      toast.error("Enter the completion date and developer name.");
      return;
    }
    if (!startingPrice || Number(startingPrice) <= 0 || !validUnits.length) {
      toast.error("Enter a valid starting price and at least one complete unit type.");
      return;
    }
    if (!shortDescription.trim()) {
      toast.error("Add a short project overview for visitors and search engines.");
      return;
    }
    if (Number(depositPercentage) < 0 || Number(depositPercentage) > 100) {
      toast.error("The minimum deposit must be between 0% and 100%.");
      return;
    }
    if (metaDescription.length > 160) {
      toast.error("The meta description must be no more than 160 characters.");
      return;
    }
    if (heroImage && !heroAlt.trim()) {
      toast.error("Add descriptive alt text for the hero image.");
      return;
    }
    if (gallery.some((image) => !image.alt.trim())) {
      toast.error("Add descriptive alt text for every gallery image.");
      return;
    }
    if (!faqs.length || faqs.some((faq) => {
      const question = faq.question.trim().replace(/\{name\}/g, name.trim());
      return !question || (!faq.answer.trim() && !defaultFaqAnswers.has(question));
    })) {
      toast.error("Complete each FAQ question and answer, or remove the empty row.");
      return;
    }

    setSubmitting(true);
    try {
      const normalizedFaqs = faqs
        .map((faq) => {
          const question = faq.question.trim().replace(/\{name\}/g, name.trim());
          const answer = faq.answer.trim() || defaultFaqAnswers.get(question) || "";
          return { question, answer };
        })
        .filter((faq) => faq.question && faq.answer);
      const configurations: ApartmentConfiguration[] = validUnits.map((unit) => ({
        id: uuidv4(),
        unitName: unit.unitTitle.trim(),
        unitTitle: unit.unitTitle.trim(),
        propertyType: unit.unitTitle.trim(),
        bedrooms: Number(unit.unitTitle.match(/\d+/)?.[0] || 0),
        bathrooms: 0,
        floorAreaSqM: Number(unit.floorAreaLabel.match(/[\d.]+/)?.[0] || 0) || undefined,
        floorAreaSqFt: 0,
        startingPrice: Number(unit.cashPrice),
        cashPrice: Number(unit.cashPrice),
        installmentPriceRange: unit.installmentPriceRange.trim() || undefined,
        floorAreaLabel: unit.floorAreaLabel.trim(),
        buildingWing: unit.buildingWing.trim() || undefined,
        availabilityStatus: "Available",
      }));

      await projectsService.create({
        name: name.trim(),
        slug: slug.trim(),
        developer: developer.trim(),
        location: city.trim(),
        neighborhood: neighborhood.trim(),
        street: street.trim(),
        county: city.trim(),
        country: "Kenya",
        shortDescription: shortDescription.trim(),
        fullDescription: shortDescription.trim(),
        startingPrice: Number(startingPrice),
        minimumDepositPercentage: Number(depositPercentage),
        paymentPlanSummary: paymentPlanSummary.trim(),
        status,
        constructionStatus: "Under Construction",
        expectedCompletionDate: completionDate.trim(),
        featuredImage: heroImage || gallery[0]?.url || "",
        featuredImageAlt: heroAlt.trim(),
        gallery: gallery.map((image) => image.url),
        galleryAltTexts: gallery.map((image) => image.alt.trim()),
        brochureUrl: brochureUrl || undefined,
        amenities,
        paymentPlans: paymentPlanSummary.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
        nearbyLandmarks: [],
        configurations,
        faqs: normalizedFaqs,
        pastNotableProjects: pastProjects.split(",").map((project) => project.trim()).filter(Boolean),
        contactPhone: "+254710132320",
        contactWhatsApp: "+254710132320",
        contactEmail: "nikasrealty@gmail.com",
        seo: {
          seoTitle: (seoTitle.trim() || defaultSeoTitle).slice(0, 200),
          metaDescription: (metaDescription.trim() || defaultMetaDescription).slice(0, 160),
          searchEngineIndexing: "index",
          socialSharingImage: heroImage || undefined,
        },
      });
      toast.success(status === "published" ? "Project published successfully." : "Project saved as a draft.");
      navigate("/admin/projects");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <form className="mx-auto max-w-5xl space-y-6 pb-12" onSubmit={(event) => event.preventDefault()}>
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Create Project</h1>
            <p className="text-sm text-muted-foreground">Add an off-plan development and publish its public listing page.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/projects")} disabled={submitting || uploading}>Cancel</Button>
            <Button type="button" variant="secondary" onClick={() => handleSubmit("draft")} disabled={submitting || uploading}>Save Draft</Button>
            <Button type="button" onClick={() => handleSubmit("published")} disabled={submitting || uploading}>
              <Check className="mr-2 h-4 w-4" /> Publish
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Basic & Location Information</CardTitle>
            <CardDescription>Project identity, location, developer, and completion details.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <TextField label="Project Name" value={name} onChange={(value) => {
              setName(value);
              if (!slugEdited) setSlug(slugify(value));
            }} placeholder="Ivy Park Residence" required />
            <div className="space-y-1.5">
              <Label>URL Slug *</Label>
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-xs text-muted-foreground">/projects/</span>
                <Input required value={slug} onChange={(event) => {
                  setSlug(slugify(event.target.value));
                  setSlugEdited(true);
                }} placeholder="ivy-park-residence" />
              </div>
            </div>
            <TextField label="Neighborhood" value={neighborhood} onChange={setNeighborhood} placeholder="Kilimani" required />
            <TextField label="Street / Road" value={street} onChange={setStreet} placeholder="Kirichwa Road" required />
            <TextField label="City" value={city} onChange={setCity} placeholder="Nairobi" required />
            <TextField label="Completion Date" value={completionDate} onChange={setCompletionDate} placeholder="Q4 2028" required />
            <TextField label="Developer Name" value={developer} onChange={setDeveloper} placeholder="Developer name" required />
            <TextField label="Past Notable Projects" value={pastProjects} onChange={setPastProjects} placeholder="Diamond Ivy, Blossom Ivy" />
            <div className="space-y-1.5 md:col-span-2">
              <Label>Short Project Overview *</Label>
              <Textarea required value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} rows={3} placeholder="Describe the development, location, and buyer appeal." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Pricing & Payment Plan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Starting Cash / Early-Bird Price (KES) *</Label>
              <Input type="number" min="1" value={startingPrice} onChange={(event) => setStartingPrice(event.target.value)} placeholder="6700000" required />
              <p className="text-sm text-muted-foreground">Displayed price: KES {formatKES(startingPrice || 0)}</p>
            </div>
            <TextField label="Minimum Deposit (%)" type="number" min={0} value={depositPercentage} onChange={setDepositPercentage} placeholder="20" required />
            <div className="space-y-1.5 md:col-span-2">
              <Label>Payment Plan Summary</Label>
              <Textarea value={paymentPlanSummary} onChange={(event) => setPaymentPlanSummary(event.target.value)} rows={3} placeholder="20% deposit on booking; balance in quarterly installments during construction." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div><CardTitle>Unit Types & Pricing</CardTitle><CardDescription>Add a row for each available apartment configuration.</CardDescription></div>
            <Button type="button" variant="outline" size="sm" onClick={() => setUnits((current) => [...current, { unitTitle: "", floorAreaLabel: "", buildingWing: "", cashPrice: "", installmentPriceRange: "" }])}><Plus className="mr-1 h-4 w-4" /> Add Unit</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {units.map((unit, index) => (
              <div key={index} className="grid gap-3 rounded-lg border p-4 md:grid-cols-2 lg:grid-cols-3">
                <TextField idSuffix={`unit-${index}`} label="Unit Title" value={unit.unitTitle} onChange={(value) => updateUnit(index, "unitTitle", value)} placeholder="2 Bedroom + DSQ" required />
                <TextField idSuffix={`unit-${index}`} label="Floor Area" value={unit.floorAreaLabel} onChange={(value) => updateUnit(index, "floorAreaLabel", value)} placeholder="62 - 76 sqm" required />
                <TextField idSuffix={`unit-${index}`} label="Building Wing" value={unit.buildingWing} onChange={(value) => updateUnit(index, "buildingWing", value)} placeholder="Wing A & C" />
                <TextField idSuffix={`unit-${index}`} label="Cash Price (KES)" type="number" min={1} value={unit.cashPrice} onChange={(value) => updateUnit(index, "cashPrice", value)} placeholder="6700000" required />
                <TextField idSuffix={`unit-${index}`} label="Installment Price Range" value={unit.installmentPriceRange} onChange={(value) => updateUnit(index, "installmentPriceRange", value)} placeholder="KES 7.1M - 8.4M" />
                <div className="flex items-end justify-end">
                  <Button type="button" variant="ghost" size="sm" disabled={units.length === 1} onClick={() => setUnits((current) => current.filter((_, i) => i !== index))}><Trash2 className="mr-2 h-4 w-4" /> Remove</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lifestyle Amenities & Features</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {AMENITY_OPTIONS.map((amenity) => (
                <label key={amenity} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="mt-1 accent-primary" />
                  {amenity}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={customAmenity} onChange={(event) => setCustomAmenity(event.target.value)} onKeyDown={(event) => {
                if (event.key === "Enter") { event.preventDefault(); addCustomAmenity(); }
              }} placeholder="Add a custom amenity" />
              <Button type="button" variant="outline" onClick={addCustomAmenity}>Add</Button>
            </div>
            {!!amenities.length && <div className="flex flex-wrap gap-2">{amenities.map((amenity) => <span key={amenity} className="rounded-full bg-muted px-3 py-1 text-xs">{amenity}<button type="button" aria-label={`Remove ${amenity}`} onClick={() => toggleAmenity(amenity)} className="ml-2 text-muted-foreground">×</button></span>)}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-primary" /> Media & Brochure</CardTitle><CardDescription>Provide descriptive alt text for every project image.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 md:items-end">
              <div className="space-y-2">
                <Label>Hero Image</Label>
                <Input type="file" accept="image/*" onChange={(event) => void handleHeroUpload(event.target.files?.[0])} />
                {heroImage && <img src={heroImage} alt={heroAlt || "Project hero preview"} className="h-40 w-full rounded-md object-cover" />}
              </div>
              <TextField label="Hero Image Alt Text" value={heroAlt} onChange={setHeroAlt} placeholder="Exterior of Ivy Park Residence in Kilimani" />
            </div>
            <div className="space-y-3">
              <Label>Image Gallery</Label>
              <Input type="file" accept="image/*" multiple onChange={(event) => void handleGalleryUpload(event.target.files)} />
              {gallery.map((image, index) => (
                <div key={image.url} className="grid gap-3 rounded-md border p-3 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                  <img src={image.url} alt={image.alt} className="h-20 w-full rounded object-cover" />
                  <Input aria-label={`Gallery image ${index + 1} alt text`} value={image.alt} onChange={(event) => setGallery((current) => current.map((item, i) => i === index ? { ...item, alt: event.target.value } : item))} placeholder="Describe this image" />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove gallery image" onClick={() => setGallery((current) => current.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Project Brochure (PDF)</Label>
              <Input type="file" accept="application/pdf,.pdf" onChange={(event) => void handleBrochureUpload(event.target.files?.[0])} />
              <Input aria-label="Brochure URL" value={brochureUrl} onChange={(event) => setBrochureUrl(event.target.value)} placeholder="Or paste an existing brochure PDF URL" />
              {brochureUrl && <a className="text-sm text-primary underline" href={brochureUrl} target="_blank" rel="noreferrer">View uploaded brochure</a>}
            </div>
            {uploading && <p role="status" className="text-sm text-muted-foreground">Uploading media…</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div><CardTitle>Frequently Asked Questions</CardTitle><CardDescription>Three SEO-focused questions are preloaded; add or remove questions as needed.</CardDescription></div>
            <Button type="button" variant="outline" size="sm" onClick={() => setFaqs((current) => [...current, { question: "", answer: "" }])}><Plus className="mr-1 h-4 w-4" /> Add FAQ</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="grid gap-3 rounded-lg border p-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-1.5"><Label>Question</Label><Input value={faq.question} onChange={(event) => setFaqs((current) => current.map((item, i) => i === index ? { ...item, question: event.target.value } : item))} placeholder="Enter a visitor question" /></div>
                  <Button type="button" variant="ghost" size="icon" className="mt-6" aria-label="Remove FAQ" onClick={() => setFaqs((current) => current.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-1.5"><Label>Answer</Label><Textarea value={faq.answer} onChange={(event) => setFaqs((current) => current.map((item, i) => i === index ? { ...item, answer: event.target.value } : item))} rows={2} placeholder="An answer will be generated from the project details if left blank." /></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" /> SEO Metadata</CardTitle><CardDescription>Defaults update from project data until you provide your own overrides.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label>SEO Title</Label><Input value={seoTitleEdited ? seoTitle : defaultSeoTitle} maxLength={200} onChange={(event) => { setSeoTitle(event.target.value); setSeoTitleEdited(true); }} /></div>
            <div className="space-y-1.5">
              <Label>Meta Description ({(descriptionEdited ? metaDescription : defaultMetaDescription).length}/160)</Label>
              <Textarea value={descriptionEdited ? metaDescription : defaultMetaDescription} maxLength={160} onChange={(event) => { setMetaDescription(event.target.value); setDescriptionEdited(true); }} rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/projects")} disabled={submitting || uploading}>Cancel</Button>
          <Button type="button" variant="secondary" onClick={() => handleSubmit("draft")} disabled={submitting || uploading}>Save Draft</Button>
          <Button type="button" onClick={() => handleSubmit("published")} disabled={submitting || uploading}>Publish Project</Button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default ProjectCreate;
