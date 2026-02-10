import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { PaymentDialog } from "@/components/PaymentDialog";

export default function Cart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, products(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("Removed from cart");
    },
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      const items = cartItems!.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));
      const { data, error } = await supabase.rpc("place_order", {
        p_items: items,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (orderId) => {
      toast.success("Order created! Please complete payment.");
      setCurrentOrderId(orderId);
      setPaymentDialogOpen(true);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const total = cartItems?.reduce(
    (sum, item) => sum + Number(item.products?.price ?? 0) * item.quantity,
    0
  ) ?? 0;

  if (isLoading) return <div className="flex justify-center py-20 text-muted-foreground">Loading cart...</div>;

  if (!cartItems?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ShoppingBag className="h-16 w-16 mb-4" />
        <p className="text-lg mb-4">Your cart is empty</p>
        <Button onClick={() => navigate("/")}>Browse Products</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold font-display mb-8">Shopping Cart</h1>
      <div className="space-y-4 mb-8">
        {cartItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                {item.products?.image_url ? (
                  <img src={item.products.image_url} alt={item.products?.name} className="object-cover w-full h-full rounded-lg" />
                ) : (
                  <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold truncate">{item.products?.name}</h3>
                <p className="text-sm text-muted-foreground">${Number(item.products?.price ?? 0).toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity - 1 })}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity + 1 })}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="font-bold w-20 text-right">${(Number(item.products?.price ?? 0) * item.quantity).toFixed(2)}</span>
              <Button variant="ghost" size="icon" onClick={() => removeItem.mutate(item.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-3xl font-bold font-display">${total.toFixed(2)}</p>
          </div>
          <Button size="lg" onClick={() => placeOrder.mutate()} disabled={placeOrder.isPending}>
            {placeOrder.isPending ? "Creating order..." : "Proceed to Payment"}
          </Button>
        </CardContent>
      </Card>

      {currentOrderId && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          orderId={currentOrderId}
          totalAmount={total}
          onSuccess={() => navigate("/orders")}
        />
      )}
    </div>
  );
}
