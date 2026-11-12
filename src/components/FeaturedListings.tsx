import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { projectsService, type Project } from "@/services/firestore/projects";
import { propertiesService, type Property } from "@/services/firestore/properties";
import { getPropertyDetailPath } from "@/utils/propertyRoutes";

const FeaturedListings = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sales, setSales] = useState<Property[]>([]);
  const [rentals, setRentals] = useState<Property[]>([]);

  useEffect(() => {
    const fetchListings = async () => {
      const [projectResult, propertyResult] = await Promise.allSettled([
        projectsService.getPublished(),
        propertiesService.getAll(),
      ]);

      if (projectResult.status === "fulfilled") {
        setProjects(projectResult.value.slice(0, 3));
      } else {
        console.error("Failed to load featured projects:", projectResult.reason);
      }

      if (propertyResult.status === "fulfilled") {
        const properties = propertyResult.value
          .slice()
          .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        setSales(properties.filter((property) => ["for-sale", "for sale"].includes(property.status.toLowerCase())).slice(0, 3));
        setRentals(properties.filter((property) => ["for-rent", "for rent"].includes(property.status.toLowerCase())).slice(0, 3));
      } else {
        console.error("Failed to load featured properties:", propertyResult.reason);
      }
    };

    void fetchListings();
  }, []);

  return (
    <section className="py-16 lg:py-24" aria-labelledby="featured-listings-heading">
      <div className="container mx-auto space-y-12 px-4 lg:px-8">
        <h2 id="featured-listings-heading" className="text-center text-3xl font-bold text-foreground">
          Latest Projects &amp; Featured Properties
        </h2>
        <ListingGroup
          heading="Latest Projects"
          href="/projects"
          items={projects.map((project) => ({
            title: project.name,
            location: project.neighborhood ? `${project.neighborhood}, ${project.location}` : project.location,
            href: `/projects/${encodeURIComponent(project.slug)}`,
          }))}
        />
        <ListingGroup
          heading="Featured Properties for Sale"
          href="/sales"
          items={sales.map((property) => ({
            title: property.title,
            location: property.location,
            href: getPropertyDetailPath(property),
          }))}
        />
        <ListingGroup
          heading="Featured Rentals"
          href="/rentals"
          items={rentals.map((property) => ({
            title: property.title,
            location: property.location,
            href: getPropertyDetailPath(property),
          }))}
        />
      </div>
    </section>
  );
};

const ListingGroup = ({
  heading,
  href,
  items,
}: {
  heading: string;
  href: string;
  items: Array<{ title: string; location: string; href: string }>;
}) => (
  <div>
    <div className="mb-5 flex items-center justify-between gap-4">
      <h3 className="text-2xl font-semibold text-foreground">{heading}</h3>
      <Link to={href} className="text-sm font-semibold text-primary hover:underline">
        View all
      </Link>
    </div>
    {items.length > 0 && (
      <ul className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.href} className="rounded-lg border border-border bg-card p-5">
            <Link to={item.href} className="font-semibold text-foreground hover:text-primary">
              {item.title}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">{item.location}</p>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default FeaturedListings;
