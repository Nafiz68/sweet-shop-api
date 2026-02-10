import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShoppingCart, Package, Search, Sparkles } from "lucide-react";

export default function Products() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addToCart = useMutation({
    mutationFn: async (productId: string) => {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user!.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: user!.id, product_id: productId, quantity: 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Added to cart!");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <div className="flex justify-center py-20 text-muted-foreground">Loading products...</div>;

  if (!products?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Package className="h-16 w-16 mb-4" />
        <p className="text-lg">No products available yet.</p>
      </div>
    );
  }

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative mb-12 rounded-2xl overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-12 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-6 w-6" />
            <span className="text-sm font-semibold uppercase tracking-wider">Premium Sweet Shop</span>
          </div>
          <h1 className="text-5xl font-bold font-display mb-4">
            Indulge in Sweetness
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mb-6">
            Discover our handcrafted collection of gourmet sweets, chocolates, and desserts. 
            Made with love, delivered with care.
          </p>
          <div className="flex gap-3">
            <Badge variant="secondary" className="text-base py-1.5 px-4">
              🎂 Fresh Daily
            </Badge>
            <Badge variant="secondary" className="text-base py-1.5 px-4">
              🚚 Free Shipping Over $50
            </Badge>
            <Badge variant="secondary" className="text-base py-1.5 px-4">
              ⭐ Premium Quality
            </Badge>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-30"></div>
      </div>

      {/* Search Bar */}
      <div className="mb-8 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for chocolates, cakes, candies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {/* Products Count */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display">
          Our Products
          <span className="text-muted-foreground font-normal text-lg ml-2">
            ({filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'})
          </span>
        </h2>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg">No products found matching "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300 group">
              <div className="aspect-square bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-t-lg flex items-center justify-center overflow-hidden relative">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <Package className="h-16 w-16 text-muted-foreground/40" />
                )}
                {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
                  <Badge className="absolute top-3 left-3 bg-orange-500">
                    Only {product.stock_quantity} left!
                  </Badge>
                )}
                {product.stock_quantity === 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge variant="destructive" className="text-lg py-2 px-4">
                      Out of Stock
                    </Badge>
                  </div>
                )}
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg line-clamp-1">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold font-display text-primary">
                    ${Number(product.price).toFixed(2)}
                  </span>
                  <Badge variant={product.stock_quantity > 10 ? "secondary" : product.stock_quantity > 0 ? "outline" : "destructive"}>
                    {product.stock_quantity > 0 ? `${product.stock_quantity} left` : "Out of stock"}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  className="w-full h-11 text-base font-semibold"
                  disabled={product.stock_quantity <= 0}
                  onClick={() => addToCart.mutate(product.id)}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
