import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShoppingCart, Package, Search, Sparkles } from "lucide-react";
import { addToLocalCart } from "@/lib/cartUtils";

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [localCartTrigger, setLocalCartTrigger] = useState(0);

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
      if (!user) {
        // For anonymous users, store in localStorage
        addToLocalCart(productId, 1);
        return;
      }
      
      // For authenticated users, store in database
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
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
          .insert({ user_id: user.id, product_id: productId, quantity: 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Added to cart!");
      if (user) {
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      } else {
        // Trigger re-render for local cart
        setLocalCartTrigger(prev => prev + 1);
        queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
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
    <div className="relative min-h-[80vh] space-y-12 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Floating Sweet Emojis */}
        <div className="absolute top-32 left-[15%] text-6xl animate-bounce delay-200 opacity-20">🍰</div>
        <div className="absolute top-20 right-[20%] text-5xl animate-bounce delay-500 opacity-20">🧁</div>
        <div className="absolute top-60 left-[8%] text-4xl animate-bounce delay-700 opacity-15">🍪</div>
        <div className="absolute top-48 right-[12%] text-7xl animate-bounce delay-1000 opacity-15">🍩</div>
        <div className="absolute bottom-40 left-[25%] text-5xl animate-bounce delay-300 opacity-20">🍭</div>
        <div className="absolute bottom-32 right-[30%] text-6xl animate-bounce delay-900 opacity-15">🎂</div>
        <div className="absolute top-72 left-[45%] text-4xl animate-bounce delay-1200 opacity-20">🍬</div>
        <div className="absolute bottom-60 right-[15%] text-5xl animate-bounce delay-600 opacity-15">🧇</div>
      </div>

      {/* SaaS Style Hero Section */}
      <section className="relative pt-4 pb-12 md:pt-6 md:pb-20 z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6 px-4">
          <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium border-primary/30 bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary rounded-full animate-in fade-in slide-in-from-bottom-4 duration-500 hover:scale-110 transition-transform cursor-default shadow-lg shadow-primary/5">
            <Sparkles className="w-3.5 h-3.5 mr-2 inline-block animate-pulse" />
            Premium Confectionery
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            Curated Sweets for the <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Digital Age
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Experience the future of gourmet desserts. Handcrafted, data-driven sweetness delivered instantly to your doorstep. 🎉
          </p>

          {/* Integrated Search Bar */}
          <div className="max-w-xl mx-auto mt-10 relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-blue-600/30 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 group-focus-within:opacity-60 transition-all duration-500 animate-gradient bg-[length:200%_auto]"></div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary group-focus-within:scale-110 transition-all duration-300" />
                <Input
                  placeholder="Search collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg bg-background/90 backdrop-blur-xl border-primary/20 shadow-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/40 rounded-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                />
              </div>
            </div>
          </div>

          {/* Animated CTA or Stats */}
          <div className="flex items-center justify-center gap-8 pt-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <div className="text-center group cursor-default">
              <div className="text-2xl font-bold text-primary group-hover:scale-110 transition-transform">
                {products?.length || 0}+
              </div>
              <div className="text-sm text-muted-foreground">Sweet Treats</div>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center group cursor-default">
              <div className="text-2xl font-bold text-primary group-hover:scale-110 transition-transform">
                🌟 4.9
              </div>
              <div className="text-sm text-muted-foreground">Rating</div>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center group cursor-default">
              <div className="text-2xl font-bold text-primary group-hover:scale-110 transition-transform">
                ⚡ Fast
              </div>
              <div className="text-sm text-muted-foreground">Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid Section */}
      <section className="px-4 md:px-6 max-w-7xl mx-auto pb-24">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-display tracking-tight">Latest Collection</h2>
          <span className="text-sm text-muted-foreground font-medium bg-secondary/50 px-3 py-1 rounded-full border border-border/50">
            {filteredProducts.length} Results
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 rounded-3xl border border-dashed border-border/60 bg-card/30 backdrop-blur-sm">
            <div className="bg-secondary/50 p-6 rounded-full mb-4">
              <Search className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
              <Card 
                key={product.id} 
                className="group relative border-border/40 bg-card/40 backdrop-blur-md overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-2 transition-all duration-500 rounded-2xl animate-in fade-in slide-in-from-bottom-8 cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Animated Gradient Border on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-xl animate-gradient bg-[length:200%_auto]"></div>
                </div>

                <div className="relative">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-secondary/30 to-secondary/50 relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-110 group-hover:rotate-2 transition-transform duration-700 ease-in-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground/20 group-hover:scale-110 transition-transform duration-500">
                        <Package className="h-16 w-16" />
                      </div>
                    )}

                    {/* Overlay Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
                        <Badge variant="secondary" className="bg-orange-500/90 text-white border-orange-500/20 backdrop-blur-md shadow-lg animate-pulse">
                          ⚡ Low Stock
                        </Badge>
                      )}
                    </div>

                    {product.stock_quantity === 0 && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <Badge variant="destructive" className="px-4 py-1.5 text-base shadow-lg animate-pulse">Sold Out</Badge>
                      </div>
                    )}
                    
                    {/* Shine Effect on Hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 h-10 leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">{product.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/40 group-hover:border-primary/20 transition-colors duration-300">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Price</span>
                        <span className="text-2xl font-bold font-display tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text group-hover:text-transparent transition-all duration-300">${Number(product.price).toFixed(2)}</span>
                      </div>
                      <Button
                        size="lg"
                        className={`rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 ${
                          product.stock_quantity > 0 
                            ? 'hover:scale-110 hover:shadow-xl hover:shadow-primary/30 active:scale-95 hover:bg-gradient-to-r hover:from-primary hover:to-purple-600' 
                            : ''
                        }`}
                        disabled={product.stock_quantity <= 0}
                        onClick={() => addToCart.mutate(product.id)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
