import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Search,
  Eye,
  Edit,
  Trash2,
  Building,
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { projectsService, type Project } from "@/services/firestore/projects";
import { toast } from "sonner";

export const AdminProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [constructionFilter, setConstructionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await projectsService.getAll({
        search: search || undefined,
        status: statusFilter,
        constructionStatus: constructionFilter,
      });
      setProjects(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, constructionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleTogglePublish = async (project: Project) => {
    if (!project.id) return;
    try {
      const newStatus = project.status === "published" ? "draft" : "published";
      await projectsService.togglePublish(project.id, project.status);
      toast.success(
        newStatus === "published"
          ? `"${project.name}" published! Public page is now live.`
          : `"${project.name}" moved to drafts.`
      );
      fetchProjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to change publication status");
    }
  };

  const handleDelete = async (project: Project) => {
    if (!project.id) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${project.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await projectsService.delete(project.id);
      toast.success(`Project "${project.name}" deleted successfully.`);
      fetchProjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete project");
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const paginatedProjects = projects.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const formatPrice = (val: number) => {
    if (!val) return "Price on Request";
    return `KES ${Number(val).toLocaleString()}`;
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return "—";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Projects Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage multi-unit real estate developments, configurations, and SEO.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProjects}
              className="gap-2"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button
              onClick={() => navigate("/admin/add-project")}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <PlusCircle className="h-4 w-4" /> Add New Project
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <Card className="border border-border/80 shadow-sm">
          <CardContent className="p-4">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by project name, developer, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>

              <div>
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Publication Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Drafts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={constructionFilter} onValueChange={(val) => { setConstructionFilter(val); setPage(1); }}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Construction Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Construction</SelectItem>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="Under Construction">Under Construction</SelectItem>
                    <SelectItem value="Nearing Completion">Nearing Completion</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Ready to Move">Ready to Move</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Projects List Table */}
        <Card className="border border-border/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/80">
                <tr>
                  <th className="py-3 px-4">Project Image</th>
                  <th className="py-3 px-4">Project Name & Developer</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Starting Price</th>
                  <th className="py-3 px-4">Construction</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading projects...
                    </td>
                  </tr>
                ) : paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground space-y-2">
                      <Building className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="font-medium text-foreground">No projects found</p>
                      <p className="text-xs">
                        {search || statusFilter !== "all" || constructionFilter !== "all"
                          ? "Try adjusting your filters or search query"
                          : "Get started by adding your first real estate development project."}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => navigate("/admin/add-project")}
                        className="mt-3 gap-1.5"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> Add Project
                      </Button>
                    </td>
                  </tr>
                ) : (
                  paginatedProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                      {/* Image */}
                      <td className="py-3 px-4">
                        <div className="w-16 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-border/60">
                          {project.featuredImage || project.gallery?.[0] ? (
                            <img
                              src={project.featuredImage || project.gallery?.[0]}
                              alt={project.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building className="h-6 w-6 text-muted-foreground/40" />
                          )}
                        </div>
                      </td>

                      {/* Name & Developer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground hover:text-primary transition-colors">
                          <Link to={`/admin/edit-project/${project.id}`}>{project.name}</Link>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          {project.developer ? (
                            <span>By {project.developer}</span>
                          ) : (
                            <span>Developer not set</span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Layers className="h-3 w-3" />
                            {project.configurations?.length || 0} unit types
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{project.location}</span>
                        </div>
                        {project.neighborhood && (
                          <div className="text-[11px] text-muted-foreground pl-5">
                            {project.neighborhood}
                          </div>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-semibold text-xs text-foreground whitespace-nowrap">
                        {formatPrice(project.startingPrice)}
                      </td>

                      {/* Construction */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs font-normal">
                          {project.constructionStatus || "Planning"}
                        </Badge>
                      </td>

                      {/* Publication Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(project)}
                          className={`h-7 px-2.5 rounded-full text-xs font-medium gap-1.5 border ${
                            project.status === "published"
                              ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 hover:bg-green-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                          }`}
                        >
                          {project.status === "published" ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                              Published
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              Draft
                            </>
                          )}
                        </Button>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(project.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View public / preview page */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => window.open(`/projects/${project.slug}`, "_blank")}
                            title={project.status === "published" ? "View live public page" : "Preview draft page"}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>

                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => navigate(`/admin/edit-project/${project.id}`)}
                            title="Edit Project"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(project)}
                            title="Delete Project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {(page - 1) * itemsPerPage + 1} to{" "}
                {Math.min(page * itemsPerPage, projects.length)} of {projects.length} projects
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="h-8 w-8 p-0"
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2.5"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminProjects;
