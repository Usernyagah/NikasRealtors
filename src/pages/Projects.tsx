import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  MapPin,
  Search,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
  Loader2,
} from "lucide-react";
import { projectsService, type Project } from "@/services/firestore/projects";

export const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const published = await projectsService.getPublished();
        setProjects(published);
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const locations = Array.from(
    new Set(projects.map((p) => p.neighborhood || p.location).filter(Boolean))
  );

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.developer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      locationFilter === "all" ||
      (p.neighborhood || p.location).toLowerCase() === locationFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      p.constructionStatus?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesLocation && matchesStatus;
  });

  const formatPrice = (val?: number) => {
    if (!val) return "Price on Request";
    return `KES ${Number(val).toLocaleString()}`;
  };

  const projectsJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Real Estate Development Projects in Kenya | Nikas Realty",
    description: "Browse high-end new developments, off-plan residential apartments, and luxury gated communities in Nairobi.",
    url: "https://www.nikasrealtor.com/projects",
    hasPart: projects.map((p) => ({
      "@type": "RealEstateListing",
      name: p.name,
      url: `https://www.nikasrealtor.com/projects/${p.slug}`,
      image: p.featuredImage || p.gallery?.[0],
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="New Real Estate Projects & Off-Plan Developments in Kenya | Nikas Realty"
        description="Discover luxury off-plan apartments, penthouses, and new residential developments for sale in Kilimani, Westlands, Kileleshwa, and Nairobi with Nikas Realty."
        path="/projects"
        keywords="new projects nairobi, off plan apartments kenya, luxury developments nairobi, buy off plan property kenya, nikas realty projects"
        jsonLd={projectsJsonLd}
      />

      <Navbar />

      <main className="flex-1 pb-20">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-b from-primary/10 via-background to-background py-16 lg:py-24 border-b border-border/60">
          <div className="container mx-auto px-4 lg:px-8 text-center max-w-3xl space-y-4">
            <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-semibold text-xs">
              Exclusive New Developments
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              Real Estate Projects in Kenya
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Explore meticulously curated luxury residential projects and off-plan investment opportunities with flexible payment plans in Nairobi’s most desirable neighborhoods.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <section className="container mx-auto px-4 lg:px-8 -mt-7">
          <Card className="border border-border/80 shadow-luxury bg-card/95 backdrop-blur">
            <CardContent className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search developments, developers, amenities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>

              <div>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">All Neighborhood Enclaves</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">All Construction Stages</option>
                  <option value="Planning">Planning</option>
                  <option value="Under Construction">Under Construction</option>
                  <option value="Nearing Completion">Nearing Completion</option>
                  <option value="Completed">Completed / Ready to Move</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Projects Grid */}
        <section className="container mx-auto px-4 lg:px-8 pt-12">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
              <p className="text-muted-foreground text-sm">Discovering developments...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-muted/20 border border-dashed rounded-2xl max-w-xl mx-auto p-8">
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <h3 className="font-bold text-foreground text-lg">No Projects Found</h3>
              <p className="text-xs text-muted-foreground">
                {searchTerm || locationFilter !== "all" || statusFilter !== "all"
                  ? "Try resetting your filters or search keywords to view available developments."
                  : "New projects are currently being prepared. Check back soon or contact our advisory team."}
              </p>
              {(searchTerm || locationFilter !== "all" || statusFilter !== "all") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setLocationFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.slug}`}
                  className="group rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-luxury transition-all flex flex-col"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <img
                      src={project.featuredImage || project.gallery?.[0] || "/placeholder.svg"}
                      alt={`${project.name} in ${project.location}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className="bg-primary text-primary-foreground text-xs font-semibold shadow-md">
                        {project.constructionStatus || "New Development"}
                      </Badge>
                    </div>
                    {project.expectedCompletionDate && (
                      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur text-white text-[11px] font-medium px-2.5 py-1 rounded-md">
                        {project.expectedCompletionDate}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      {project.developer && (
                        <p className="text-xs text-primary font-semibold tracking-wider uppercase">
                          {project.developer}
                        </p>
                      )}
                      <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {project.name}
                      </h2>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>
                          {project.neighborhood ? `${project.neighborhood}, ` : ""}
                          {project.location}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 pt-1 leading-relaxed">
                        {project.shortDescription}
                      </p>
                    </div>

                    {/* Unit types count & configurations */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        {project.configurations?.length || 0} Unit Types
                      </span>
                      <span>
                        {project.configurations?.length > 0 &&
                          `${Math.min(...project.configurations.map((c) => c.bedrooms))} - ${Math.max(
                            ...project.configurations.map((c) => c.bedrooms)
                          )} Beds`}
                      </span>
                    </div>

                    {/* Footer / Price */}
                    <div className="pt-2 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-muted-foreground uppercase block font-medium">
                          Starting From
                        </span>
                        <span className="text-lg font-extrabold text-primary">
                          {formatPrice(project.startingPrice)}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Explore <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectsPage;

