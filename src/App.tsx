import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { FullPageLoader3D } from "@/components/Loader3D";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";

// Lazy-load pages for better performance
const LoginPage = lazy(() => import("./pages/LoginPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewComplaint = lazy(() => import("./pages/NewComplaint"));
const MyComplaints = lazy(() => import("./pages/MyComplaints"));
const PublicComplaints = lazy(() => import("./pages/PublicComplaints"));
const ComplaintDetail = lazy(() => import("./pages/ComplaintDetail"));
const AssignedComplaints = lazy(() => import("./pages/AssignedComplaints"));
const AllComplaints = lazy(() => import("./pages/AllComplaints"));
const CategoryManagement = lazy(() => import("./pages/CategoryManagement"));
const FacultyApproval = lazy(() => import("./pages/FacultyApproval"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader3D />;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader3D />;

  return (
    <>
      {user && <Navbar />}
      <Suspense fallback={<FullPageLoader3D />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/new-complaint" element={<ProtectedRoute allowedRoles={['student', 'faculty']}><NewComplaint /></ProtectedRoute>} />
            <Route path="/my-complaints" element={<ProtectedRoute allowedRoles={['student', 'faculty']}><MyComplaints /></ProtectedRoute>} />
            <Route path="/public-complaints" element={<ProtectedRoute><PublicComplaints /></ProtectedRoute>} />
            <Route path="/complaints/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
            <Route path="/assigned" element={<ProtectedRoute allowedRoles={['faculty']}><AssignedComplaints /></ProtectedRoute>} />
            <Route path="/all-complaints" element={<ProtectedRoute allowedRoles={['admin']}><AllComplaints /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute allowedRoles={['admin']}><CategoryManagement /></ProtectedRoute>} />
            <Route path="/faculty-approval" element={<ProtectedRoute allowedRoles={['admin']}><FacultyApproval /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
