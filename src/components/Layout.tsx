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
    enabled: !!user && role === "customer",
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id);
      if (error) {
        console.error("Cart count error:", error);
        return 0;
      }
      return data?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    },
  });

  const { data: orderCount } = useQuery({
    queryKey: ["order-count"],
    enabled: !!user && role === "customer",
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .neq("status", "delivered")
        .neq("status", "cancelled");
      if (error) {
        console.error("Order count error:", error);
        return 0;
      }
      return data?.length ?? 0;
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  console.log("Layout - User:", user?.id, "Role:", role); // Debug log

  return (
    <div className="min-h-screen">
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
            {user && (
              <>
                {role === "admin" ? (
                  <Button variant={isActive("/admin") ? "default" : "ghost"} size="sm" asChild>
                    <Link to="/admin"><LayoutDashboard className="h-4 w-4 mr-1" />Admin</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant={isActive("/") ? "default" : "ghost"} size="sm" asChild>
                      <Link to="/"><Package className="h-4 w-4 mr-1" />Products</Link>
                    </Button>
                    <Button variant={isActive("/cart") ? "default" : "ghost"} size="sm" asChild>
                      <Link to="/cart" className="relative">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Cart
                        {cartCount !== undefined && cartCount > 0 && (
                          <Badge className="absolute -top-2 -right-2 h-5 min-w-[20px] rounded-full bg-red-500 hover:bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-lg">
                            {cartCount}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                    <Button variant={isActive("/orders") ? "default" : "ghost"} size="sm" asChild>
                      <Link to="/orders" className="relative">
                        <ShoppingBag className="h-4 w-4 mr-1" />
                        Orders
                        {orderCount !== undefined && orderCount > 0 && (
                          <Badge className="absolute -top-2 -right-2 h-5 min-w-[20px] rounded-full bg-orange-500 hover:bg-orange-500 px-1.5 text-[11px] font-bold text-white shadow-lg">
                            {orderCount}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                  </>
                )}
                {role && <Badge variant="outline" className="ml-2 capitalize">{role}</Badge>}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
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
