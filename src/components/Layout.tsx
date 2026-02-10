import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ShoppingCart, Package, LogOut, LayoutDashboard, Cake } from "lucide-react";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: cartCount } = useQuery({
    queryKey: ["cart-count"],
    enabled: role === "customer",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity", { count: "exact" })
        .eq("user_id", user!.id);
      if (error) throw error;
      return data?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-lg">
              <Cake className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold font-display bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Sweet Shop
            </span>
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
                <Button variant={isActive("/cart") ? "default" : "ghost"} size="sm" asChild className="relative">
                  <Link to="/cart">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Cart
                    {cartCount > 0 && (
                      <Badge className="ml-1.5 h-5 min-w-[20px] rounded-full bg-primary px-1 text-[10px] font-bold">
                        {cartCount}
                      </Badge>
                    )}
                  </Link>
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
      
      <footer className="border-t mt-20 py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">🍰 Sweet Shop - Your Premium Dessert Destination</p>
          <p>&copy; 2026 Sweet Shop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
