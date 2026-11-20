import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { projectsService, type ApartmentConfiguration, type Project, type ProjectFAQ } from "@/services/firestore/projects";
import { requestsService } from "@/services/firestore/requests";
import "./ProjectDetails.css";

const formatKES = (price?: number) =>
  price ? `KES ${Number(price).toLocaleString("en-KE")}` : "Price on request";

const getUnitTitle = (unit: ApartmentConfiguration) =>
  unit.unitTitle || unit.unitName || (unit.bedrooms ? `${unit.bedrooms} Bedroom ${unit.propertyType}` : unit.propertyType);

const makeFaqs = (project: Project): ProjectFAQ[] => {
  if (project.faqs?.length) return project.faqs;
  const projectName = project.name;
  const paymentPlan = project.paymentPlanSummary || project.paymentPlans?.join("; ") ||
    `A minimum deposit of ${project.minimumDepositPercentage ?? 20}% is required, with the balance payable on the agreed payment schedule.`;
  return [
    {
      question: `What is the starting price for units at ${projectName}?`,
      answer: `${projectName} has units starting from ${formatKES(project.startingPrice)}. Contact Nikas Realty to confirm current availability and pricing.`,
    },
    {
      question: `When will ${projectName} be completed?`,
      answer: `${projectName} is expected to be completed in ${project.expectedCompletionDate || "the date confirmed by the developer"}. Contact Nikas Realty for the latest construction update.`,
    },
    {
      question: `What payment plan is available at ${projectName}?`,
      answer: paymentPlan,
    },
  ];
};

const PublicProjectPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [similarProjects, setSimilarProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredUnitType, setPreferredUnitType] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchProject = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        if (!slug) {
          setProject(null);
          return;
        }
        const found = await projectsService.getBySlug(slug);
        if (!active) return;
        if (!found || (found.status !== "published" && !user)) {
          setProject(null);
          return;
        }
        setProject(found);
        setPreferredUnitType(found.configurations?.[0] ? getUnitTitle(found.configurations[0]) : "");
        try {
          const published = await projectsService.getPublished();
          if (!active) return;
          const candidates = published.filter((item) => item.slug !== found.slug);
          const area = (found.neighborhood || found.location).toLowerCase();
          const local = candidates.filter((item) =>
            (item.neighborhood || item.location).toLowerCase() === area,
          );
          setSimilarProjects((local.length ? local : candidates).slice(0, 3));
        } catch (error) {
          console.error("Failed to load similar projects:", error);
          if (active) setSimilarProjects([]);
        }
      } catch (error) {
        console.error("Failed to load project:", error);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchProject();
    return () => { active = false; };
  }, [slug, user]);

  const faqs = useMemo(() => project ? makeFaqs(project) : [], [project]);
  const seoTitle = project?.seo?.seoTitle?.trim() ||
    (project
      ? `${project.name} ${project.neighborhood || project.location}: ${project.configurations?.map(getUnitTitle).join(", ") || "Apartments"} (From KES ${Number(project.startingPrice).toLocaleString("en-KE")})`
      : "Project Not Found | Nikas Realty");
  const metaDescription = project?.seo?.metaDescription?.trim() ||
    (project
      ? `${project.shortDescription} Explore pricing, floor plans, amenities and payment options for ${project.name} in ${project.neighborhood || project.location}.`.slice(0, 160)
      : "The requested real estate development is not available.");
  const canonicalUrl = `https://www.nikasrealtors.com/projects/${project?.slug || slug || ""}`;
  const imageUrls = project
    ? [...new Set([project.featuredImage, ...(project.gallery || [])].filter((image): image is string => Boolean(image)))]
    : [];
  const heroImage = project?.featuredImage || project?.gallery?.[0];
  const heroAlt = project?.featuredImage
    ? project.featuredImageAlt
    : project?.galleryAltTexts?.[0];
  const address = project ? {
    "@type": "PostalAddress",
    streetAddress: project.street || undefined,
    addressLocality: project.neighborhood || project.location,
    addressRegion: project.county || project.location,
    addressCountry: project.country || "KE",
  } : undefined;
  const structuredData = project ? [
    {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: project.name,
      description: project.shortDescription || metaDescription,
      url: canonicalUrl,
      image: imageUrls,
      address,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "KES",
        lowPrice: project.startingPrice,
        offerCount: project.configurations?.length || 1,
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ] : undefined;
  const isDraft = project?.status !== "published";

  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;
    if (!name.trim() || !phone.trim()) {
      toast.error("Enter your name and phone number so our team can reach you.");
      return;
    }
    setSubmitting(true);
    try {
      await requestsService.create({
        type: "project-inquiry",
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        preferredUnitType: preferredUnitType || undefined,
        message: message.trim() || `Please contact me about ${project.name}.`,
        propertyId: project.id,
        propertyTitle: project.name,
      });
      toast.success("Thank you. Our team will contact you shortly.");
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send your request. Please try WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappUrl = project
    ? `https://wa.me/${(project.contactWhatsApp || "254710132320").replace(/\D/g, "")}?text=${encodeURIComponent(`Hello Nikas Realty, I am interested in ${project.name} in ${project.neighborhood || project.location}. Please share availability and the brochure.`)}`
    : "#";
  const unitRows = project?.configurations || [];
  const publicSeo = project?.seo?.searchEngineIndexing === "noindex";

  if (loading) {
    return <div className="project-detail-page min-h-screen bg-background"><Navbar /><div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-primary" /></div><Footer /></div>;
  }

  if (!project) {
    return (
      <div className="project-detail-page min-h-screen bg-background">
        <SEO title="Project Not Found | Nikas Realty" description="The requested real estate development is not available." noindex />
        <Navbar />
        <main className="container mx-auto px-4 py-20 text-center">
          <Building2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h1 className="text-3xl font-bold">{loadError ? "Project unavailable" : "Project not found"}</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{loadError ? "We could not load this project right now. Please try again shortly." : "This development may have been unpublished or the address may be incorrect."}</p>
          <Button asChild className="mt-6"><Link to="/projects">Browse Projects</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const city = project.location || project.county || "Nairobi";
  const locationText = [project.neighborhood, city].filter(Boolean).join(", ");

  return (
    <div className="project-detail-page min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={metaDescription}
        canonicalUrl={canonicalUrl}
        image={project.seo?.socialSharingImage || project.featuredImage || "/logo.png"}
        keywords={project.seo?.focusKeyword || `${project.name}, off-plan apartments ${locationText}, real estate Kenya`}
        noindex={isDraft || publicSeo}
        schemaData={structuredData}
      />
      <Navbar />
      {isDraft && <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-900 dark:text-amber-200">Admin preview — this project is not published. <Link className="underline" to={`/admin/edit-project/${project.id}`}>Edit project</Link></div>}

      <main className="pb-16">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 py-4 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link><span aria-hidden="true">/</span>
            <Link to="/projects" className="hover:text-primary">Projects</Link><span aria-hidden="true">/</span>
            <span className="text-foreground">{project.name}</span>
          </nav>

          <section aria-label="Project overview" className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="relative min-h-[280px] bg-muted md:min-h-[480px]">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={heroAlt || `${project.name} development in ${locationText}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : <div className="absolute inset-0 flex items-center justify-center"><Building2 className="h-16 w-16 text-muted-foreground/30" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-10">
                <Badge className="mb-3">{project.constructionStatus || "Off-plan development"}</Badge>
                <h1 className="max-w-4xl text-3xl font-bold leading-tight md:text-5xl">
                  {project.name}, {project.street || project.location} – {project.neighborhood || project.location}, {city}
                </h1>
                <p className="mt-3 flex items-center gap-2 text-sm text-white/90 md:text-base"><MapPin className="h-4 w-4" />{locationText}</p>
              </div>
            </div>
            {imageUrls.length > 1 && (
              <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-5 md:grid-cols-6">
                {imageUrls.slice(1, 7).map((image, index) => (
                  <img key={image} src={image} alt={project.galleryAltTexts?.[index] || `${project.name} gallery image ${index + 1}`} className="h-24 w-full rounded-md object-cover md:h-32" loading="lazy" />
                ))}
              </div>
            )}
          </section>

          <section aria-label="Key project highlights" className="my-6 grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 md:grid-cols-4 md:p-6">
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Starting Price</p><p className="mt-1 font-bold text-primary md:text-lg">{formatKES(project.startingPrice)}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Completion</p><p className="mt-1 font-semibold">{project.expectedCompletionDate || "Contact for details"}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Location</p><p className="mt-1 font-semibold">{locationText}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Minimum Deposit</p><p className="mt-1 font-semibold">{project.minimumDepositPercentage ?? "Contact us"}{project.minimumDepositPercentage !== undefined ? "%" : ""}</p></div>
          </section>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_350px]">
            <div className="min-w-0 space-y-12">
              <section>
                <p className="max-w-3xl leading-7 text-muted-foreground">{project.shortDescription}</p>
                {project.fullDescription && project.fullDescription !== project.shortDescription && <p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">{project.fullDescription}</p>}
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold">Unit Types, Floor Plans & Pricing</h2>
                {unitRows.length ? (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[650px] text-left text-sm">
                      <thead className="bg-muted/70 text-xs uppercase text-muted-foreground"><tr>
                        <th scope="col" className="px-4 py-3">Unit Type</th><th scope="col" className="px-4 py-3">Floor Area</th><th scope="col" className="px-4 py-3">Wing</th><th scope="col" className="px-4 py-3">Cash Price</th><th scope="col" className="px-4 py-3">Installment Price</th>
                      </tr></thead>
                      <tbody className="divide-y">
                        {unitRows.map((unit, index) => (
                          <tr key={unit.id || index}>
                            <th scope="row" className="px-4 py-4 font-semibold">{getUnitTitle(unit)}</th>
                            <td className="px-4 py-4">{unit.floorAreaLabel || (unit.floorAreaSqM ? `${unit.floorAreaSqM} sqm` : `${unit.floorAreaSqFt} sq ft`)}</td>
                            <td className="px-4 py-4">{unit.buildingWing || "—"}</td>
                            <td className="px-4 py-4 font-semibold">{formatKES(unit.cashPrice || unit.startingPrice)}</td>
                            <td className="px-4 py-4">{unit.installmentPriceRange || "Contact for plan pricing"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-muted-foreground">Contact our team for current unit availability and pricing.</p>}
                <p className="mt-3 text-xs text-muted-foreground">Prices and availability may change. Please confirm current details with Nikas Realty.</p>
              </section>

              <section className="rounded-xl border bg-muted/20 p-5 md:p-7">
                <h2 className="text-2xl font-bold">Flexible Payment Plan & Investment Highlights</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{project.paymentPlanSummary || project.paymentPlans?.join(" ") || `A minimum deposit of ${project.minimumDepositPercentage ?? 20}% is required. Ask our team for the current payment schedule.`}</p>
                {project.developer && <p className="mt-4 flex items-start gap-2 text-sm"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><strong>Developer:</strong> {project.developer}</span></p>}
                {!!project.pastNotableProjects?.length && <div className="mt-4"><h3 className="font-semibold">Developer track record</h3><ul className="mt-2 flex flex-wrap gap-2">{project.pastNotableProjects.map((pastProject) => <li key={pastProject}><Badge variant="secondary">{pastProject}</Badge></li>)}</ul></div>}
                {!!project.nearbyLandmarks?.length && <ul className="mt-4 space-y-2">{project.nearbyLandmarks.map((landmark) => <li key={landmark} className="flex gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />{landmark}</li>)}</ul>}
              </section>

              <section>
                <h2 className="mb-5 text-2xl font-bold">Lifestyle Amenities & Building Features</h2>
                {project.amenities?.length ? <ul className="grid gap-3 sm:grid-cols-2">
                  {project.amenities.map((amenity) => <li key={amenity} className="flex items-center gap-3 rounded-lg border bg-card p-4"><span className="rounded-full bg-primary/10 p-2 text-primary"><Sparkles className="h-4 w-4" /></span><span className="text-sm font-medium">{amenity}</span></li>)}
                </ul> : <p className="text-muted-foreground">Contact our team for details about building features.</p>}
              </section>

              {!!project.brochureUrl && <section className="rounded-xl border p-5">
                <h2 className="text-xl font-bold">Download the Project Brochure</h2>
                <p className="mt-2 text-sm text-muted-foreground">Get the project information, layouts and specifications.</p>
                <Button asChild className="mt-4"><a href={project.brochureUrl} target="_blank" rel="noreferrer"><FileText className="mr-2 h-4 w-4" /> View Brochure</a></Button>
              </section>}

              <section>
                <h2 className="mb-3 text-2xl font-bold">Frequently Asked Questions</h2>
                <div className="divide-y rounded-xl border px-5">
                  {faqs.map((faq, index) => <details key={`${faq.question}-${index}`} className="group py-4">
                    <summary className="cursor-pointer list-none pr-6 font-semibold marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{faq.question}<span aria-hidden="true" className="float-right text-primary group-open:rotate-45">+</span></summary>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                  </details>)}
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card id="inquiry-card" className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl">Request Call-Back & Brochure</CardTitle>
                  <p className="text-sm text-muted-foreground">Ask about pricing, availability, or arrange a viewing.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitInquiry} className="space-y-3">
                    <div><label htmlFor="lead-name" className="mb-1 block text-sm font-medium">Name *</label><Input id="lead-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></div>
                    <div><label htmlFor="lead-phone" className="mb-1 block text-sm font-medium">Phone / WhatsApp *</label><Input id="lead-phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required /></div>
                    <div><label htmlFor="lead-email" className="mb-1 block text-sm font-medium">Email</label><Input id="lead-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
                    <div><label htmlFor="lead-unit" className="mb-1 block text-sm font-medium">Preferred Unit Type</label>
                      <select id="lead-unit" value={preferredUnitType} onChange={(event) => setPreferredUnitType(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Any unit type</option>{unitRows.map((unit, index) => <option key={unit.id || index} value={getUnitTitle(unit)}>{getUnitTitle(unit)}</option>)}
                      </select>
                    </div>
                    <div><label htmlFor="lead-message" className="mb-1 block text-sm font-medium">Message</label><Textarea id="lead-message" rows={3} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="How can we help?" /></div>
                    <Button type="submit" className="w-full" disabled={submitting}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PhoneCall className="mr-2 h-4 w-4" />}Request a Call-Back</Button>
                  </form>
                  <Button asChild variant="outline" className="mt-3 w-full"><a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />Chat on WhatsApp</a></Button>
                  <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" />Your details are shared only with our property team.</p>
                </CardContent>
              </Card>
            </aside>
          </div>

          <section className="mt-14 border-t pt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div><h2 className="text-2xl font-bold">Similar Projects in {project.neighborhood || city}</h2><p className="mt-1 text-sm text-muted-foreground">Explore more developments and compare your options.</p></div>
              <Button asChild variant="link"><Link to="/projects">All Projects <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            </div>
            {similarProjects.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similarProjects.map((similar) => <Link key={similar.id} to={`/projects/${similar.slug}`} className="group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
                {similar.featuredImage ? <img src={similar.featuredImage} alt={similar.featuredImageAlt || `${similar.name} in ${similar.neighborhood || similar.location}`} loading="lazy" className="h-48 w-full object-cover transition-transform group-hover:scale-[1.02]" /> : <div className="flex h-48 items-center justify-center bg-muted"><Home className="h-10 w-10 text-muted-foreground/40" /></div>}
                <div className="p-4"><h3 className="font-semibold group-hover:text-primary">{similar.name}</h3><p className="mt-1 text-sm text-muted-foreground">{similar.neighborhood || similar.location}</p><p className="mt-3 text-sm font-bold text-primary">From {formatKES(similar.startingPrice)}</p></div>
              </Link>)}
            </div> : <p className="text-sm text-muted-foreground">More developments in this area are coming soon. <Link to="/projects" className="text-primary underline">Browse all projects.</Link></p>}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicProjectPage;
