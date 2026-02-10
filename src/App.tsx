import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Auth from "@/pages/Auth";
import Products from "@/pages/Products";
import Cart from "@/pages/Cart";
import Orders from "@/pages/Orders";
import Admin from "@/pages/Admin";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requiredRole }: { children: ReactNode; requiredRole?: string }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AuthRoute() {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (user) {
    return <Navigate to={role === "admin" ? "/admin" : "/"} replace />;
  }
  return <Auth />;
}

function CustomerHome() {
  const { role } = useAuth();
  if (role === "admin") return <Navigate to="/admin" replace />;
  return <Products />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/" element={<ProtectedRoute><CustomerHome /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute requiredRole="customer"><Cart /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute requiredRole="customer"><Orders /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
