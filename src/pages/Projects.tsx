import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  MapPin,
  Search,
  Layers,
  ArrowRight,
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
    url: "https://nikasrealtors.com/projects",
    hasPart: projects.map((p) => ({
      "@type": "RealEstateListing",
      name: p.name,
      url: `https://nikasrealtors.com/projects/${p.slug}`,
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

      <main className="flex-1">
        <section className="bg-muted/30 py-20 lg:py-32">
          <div className="container mx-auto px-4 lg:px-8">
            {/* Section Header */}
            <div className="mx-auto mb-12 max-w-3xl space-y-4 text-center">
              <h1 className="text-4xl font-bold text-foreground md:text-5xl">
                Real Estate Projects for <span className="text-primary">Sale in Kenya</span>
              </h1>
              <div className="mx-auto h-1 w-20 gradient-gold" />
              <p className="text-lg text-muted-foreground">
                Browse new developments and off-plan residential projects in Nairobi and across Kenya.
              </p>
            </div>

            {/* Search and Filter Row */}
            <div className="mb-10 flex flex-wrap items-end gap-4">
              <div className="min-w-[220px] flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by project, developer or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="min-w-[180px]">
                <select
                  aria-label="Filter by neighborhood"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="min-w-[180px]">
                <select
                  aria-label="Filter by construction stage"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">All Stages</option>
                  <option value="Planning">Planning</option>
                  <option value="Under Construction">Under Construction</option>
                  <option value="Nearing Completion">Nearing Completion</option>
                  <option value="Completed">Completed / Ready to Move</option>
                </select>
              </div>
            </div>

            {/* Projects Grid */}
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="space-y-3 py-8 text-center text-lg text-muted-foreground">
              <Building2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <h3 className="font-semibold text-foreground">No Projects Found</h3>
              <p className="text-sm">
                {searchTerm || locationFilter !== "all" || statusFilter !== "all"
                  ? "Try resetting your filters or search keywords to view available developments."
                  : "New projects are currently being prepared. Check back soon or contact our advisory team."}
              </p>
              {(searchTerm || locationFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
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
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.slug}`}
                  className="group block h-full"
                >
                  <Card className="h-full overflow-hidden transition-smooth group-hover:shadow-luxury">
                    <div className="relative h-64 flex-shrink-0 overflow-hidden bg-muted">
                      <img
                        src={project.featuredImage || project.gallery?.[0] || "/placeholder.svg"}
                        alt={`${project.name} in ${project.location}`}
                        className="h-full w-full object-cover transition-smooth group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute right-4 top-4 flex flex-col gap-2">
                        <Badge className="gradient-gold text-secondary font-semibold shadow-lg">
                          {project.constructionStatus || "New Development"}
                        </Badge>
                        {project.expectedCompletionDate && (
                          <Badge className="bg-secondary text-white font-semibold shadow-lg">
                            {project.expectedCompletionDate}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardHeader>
                      {project.developer && (
                        <p className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          {project.developer}
                        </p>
                      )}
                      <CardTitle className="text-xl transition-smooth group-hover:text-primary">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {project.neighborhood ? `${project.neighborhood}, ` : ""}
                        {project.location}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-grow space-y-4">
                      <p className="line-clamp-2 text-xs text-muted-foreground">{project.shortDescription}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Layers className="h-4 w-4" />
                          {project.configurations?.length || 0} Unit Types
                        </span>
                        {project.configurations?.length > 0 && (
                          <span>
                            {Math.min(...project.configurations.map((c) => c.bedrooms))} - {Math.max(
                              ...project.configurations.map((c) => c.bedrooms)
                            )} Beds
                          </span>
                        )}
                      </div>
                      <div className="border-t border-border pt-4">
                        <span className="mr-1 text-sm font-semibold text-primary/80">From</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(project.startingPrice)}
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <span className="inline-flex h-10 w-full items-center justify-center gap-2 gradient-gold font-semibold text-secondary transition-smooth group-hover:scale-[1.02]">
                        View Details <ArrowRight className="h-4 w-4" />
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectsPage;
