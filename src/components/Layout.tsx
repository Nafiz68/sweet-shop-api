import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ShoppingCart, Package, LogOut, LayoutDashboard } from "lucide-react";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-accent" />
            <span className="text-xl font-bold font-display text-foreground">MiniShop</span>
          </Link>
          <nav className="flex items-center gap-2">
            {role === "admin" && (
              <Button variant={isActive("/admin") ? "default" : "ghost"} size="sm" asChild>
                <Link to="/admin"><LayoutDashboard className="h-4 w-4 mr-1" />Admin</Link>
              </Button>
            )}
            {role === "customer" && (
              <>
                <Button variant={isActive("/") ? "default" : "ghost"} size="sm" asChild>
                  <Link to="/"><Package className="h-4 w-4 mr-1" />Products</Link>
                </Button>
                <Button variant={isActive("/cart") ? "default" : "ghost"} size="sm" asChild>
                  <Link to="/cart"><ShoppingCart className="h-4 w-4 mr-1" />Cart</Link>
                </Button>
                <Button variant={isActive("/orders") ? "default" : "ghost"} size="sm" asChild>
                  <Link to="/orders"><ShoppingBag className="h-4 w-4 mr-1" />Orders</Link>
                </Button>
              </>
            )}
            <Badge variant="outline" className="ml-2 capitalize">{role}</Badge>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
