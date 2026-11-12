import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";
import { useEffect } from "react";
import { initGA, logPageView } from "@/lib/analytics";
import Index from "./pages/Index";
import AboutPage from "./pages/About";
import ContactPage from "./pages/Contact";
import ServicesPage from "./pages/Services";
import NotFound from "./pages/NotFound";
import Blog from "./pages/Blog";
import BlogDetailsPage from "./pages/BlogDetails";
import PropertiesPage from "./pages/Properties";
import RentalsPage from "./pages/Rentals";
import PropertyDetailsPage from "./pages/PropertyDetails";
import MediaPage from "./pages/Media";
import MediaWatchPage from "./pages/MediaWatch";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProjects from "./pages/admin/Projects";
import AdminAddProject from "./pages/admin/AddProject";
import AdminEditProject from "./pages/admin/EditProject";
import ProjectsPage from "./pages/Projects";
import ProjectDetailsPage from "./pages/ProjectDetails";
import AdminProperties from "./pages/admin/Properties";
import AdminAddProperty from "./pages/admin/AddProperty";
import AdminBlogs from "./pages/admin/Blogs";
import AdminAddBlog from "./pages/admin/AddBlog";
import AdminEditBlog from "./pages/admin/EditBlog";
import AdminMedia from "./pages/admin/Media";
import AdminAddMedia from "./pages/admin/AddMedia";
import AdminEditMedia from "./pages/admin/EditMedia";
import AdminEditProperty from "./pages/admin/EditProperty";
import AdminRequests from "./pages/admin/Requests";
import AdminTeam from "./pages/admin/Team";
import AdminAddTeamMember from "./pages/admin/AddTeamMember";
import AdminEditTeamMember from "./pages/admin/EditTeamMember";
import AdminSettings from "./pages/admin/Settings";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminNewsletter from "./pages/admin/Newsletter";

const queryClient = new QueryClient();

import { analyticsService } from "@/services/firestore/analytics";
import { v4 as uuidv4 } from 'uuid';

// Analytics tracker component
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize GA on mount
    initGA();

    // Initialize or get sessionId
    let sessionId = localStorage.getItem('nikas_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('nikas_session_id', sessionId);
    }
  }, []);

  useEffect(() => {
    const path = location.pathname + location.search;
    // Track page views in GA4
    logPageView(path);

    // Track in real-time Firestore analytics
    const sessionId = localStorage.getItem('nikas_session_id') || 'anonymous';
    analyticsService.logVisit(location.pathname, sessionId);
  }, [location]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AnalyticsTracker />
          <ScrollToTop />
          <CookieConsent />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogDetailsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectDetailsPage />} />
            <Route path="/sales" element={<PropertiesPage />} />
            <Route path="/sales/:id" element={<PropertyDetailsPage />} />
            <Route path="/properties" element={<Navigate to="/sales" replace />} />
            <Route path="/rentals" element={<RentalsPage />} />
            <Route path="/rentals/:id" element={<PropertyDetailsPage />} />
            <Route path="/properties/:id" element={<PropertyDetailsPage />} />
            <Route path="/media" element={<MediaPage />} />
            <Route path="/media/:id" element={<MediaWatchPage />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/projects" element={<ProtectedRoute><AdminProjects /></ProtectedRoute>} />
            <Route path="/admin/add-project" element={<ProtectedRoute><AdminAddProject /></ProtectedRoute>} />
            <Route path="/admin/edit-project/:id" element={<ProtectedRoute><AdminEditProject /></ProtectedRoute>} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/properties"
              element={
                <ProtectedRoute>
                  <AdminProperties />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-property"
              element={
                <ProtectedRoute>
                  <AdminAddProperty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/edit-property/:id"
              element={
                <ProtectedRoute>
                  <AdminEditProperty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/blogs"
              element={
                <ProtectedRoute>
                  <AdminBlogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-blog"
              element={
                <ProtectedRoute>
                  <AdminAddBlog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/edit-blog/:id"
              element={
                <ProtectedRoute>
                  <AdminEditBlog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/media"
              element={
                <ProtectedRoute>
                  <AdminMedia />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-media"
              element={
                <ProtectedRoute>
                  <AdminAddMedia />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/edit-media/:id"
              element={
                <ProtectedRoute>
                  <AdminEditMedia />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <ProtectedRoute>
                  <AdminRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/team"
              element={
                <ProtectedRoute>
                  <AdminTeam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-team-member"
              element={
                <ProtectedRoute>
                  <AdminAddTeamMember />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/edit-team-member/:id"
              element={
                <ProtectedRoute>
                  <AdminEditTeamMember />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/newsletter"
              element={
                <ProtectedRoute>
                  <AdminNewsletter />
                </ProtectedRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
