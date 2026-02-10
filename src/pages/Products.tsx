import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Package } from "lucide-react";

export default function Products() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-8">Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
              ) : (
                <Package className="h-16 w-16 text-muted-foreground/40" />
              )}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-display">${Number(product.price).toFixed(2)}</span>
                <Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"}>
                  {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                </Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={product.stock_quantity <= 0}
                onClick={() => addToCart.mutate(product.id)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
