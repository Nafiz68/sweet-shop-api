import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { PaymentDialog } from "@/components/PaymentDialog";
import { CheckoutConfirmDialog } from "@/components/CheckoutConfirmDialog";
import { CheckoutTransitionDialog } from "@/components/CheckoutTransitionDialog";
import { 
  getLocalCart, 
  updateLocalCartQuantity, 
  removeFromLocalCart 
} from "@/lib/cartUtils";

export default function Cart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false);
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [localCartItems, setLocalCartItems] = useState<any[]>([]);

  // Load local cart for anonymous users
  useEffect(() => {
    if (!user) {
      const loadLocalCart = async () => {
        const localCart = getLocalCart();
        if (localCart.length === 0) {
          setLocalCartItems([]);
          return;
        }
        
        // Fetch product details for local cart items
        const productIds = localCart.map(item => item.product_id);
        const { data: products, error } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);
        
        if (error) {
          console.error("Error fetching products:", error);
          return;
        }
        
        const items = localCart.map(cartItem => {
          const product = products?.find(p => p.id === cartItem.product_id);
          return {
            id: cartItem.product_id, // Use product_id as id for local items
            product_id: cartItem.product_id,
            quantity: cartItem.quantity,
            products: product
          };
        });
        
        setLocalCartItems(items);
      };
      
      loadLocalCart();
    }
  }, [user]);

  // If user is not logged in, show local cart
  if (!user) {
    const handleLocalUpdateQuantity = (productId: string, newQuantity: number) => {
      updateLocalCartQuantity(productId, newQuantity);
      // Reload local cart
      const localCart = getLocalCart();
      const updatedItems = localCartItems
        .map(item => {
          if (item.product_id === productId) {
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
      setLocalCartItems(updatedItems);
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    };
    
    const handleLocalRemove = (productId: string) => {
      removeFromLocalCart(productId);
      setLocalCartItems(prev => prev.filter(item => item.product_id !== productId));
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("Removed from cart");
    };
    
    const localTotal = localCartItems.reduce(
      (sum, item) => sum + Number(item.products?.price ?? 0) * item.quantity,
      0
    );
    
    if (localCartItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShoppingBag className="h-16 w-16 mb-4" />
          <p className="text-lg mb-4">Your cart is empty</p>
          <Button onClick={() => navigate("/")}>Browse Products</Button>
        </div>
      );
    }
    
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Cart Items Section */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight">Shopping Cart</h1>
              <span className="text-muted-foreground font-medium">{localCartItems.length} {localCartItems.length === 1 ? 'Item' : 'Items'}</span>
            </div>

            <div className="space-y-4">
              {localCartItems.map((item) => (
                <div key={item.id} className="group relative bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-4 transition-all duration-300 hover:bg-card/60 hover:shadow-lg hover:border-primary/20 flex gap-4 md:gap-6 items-center">

                  {/* Product Image */}
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-secondary/30 rounded-xl overflow-hidden shrink-0 relative">
                    {item.products?.image_url ? (
                      <img src={item.products.image_url} alt={item.products?.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full text-muted-foreground/30">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-24 md:h-32 py-1">
                    <div>
                      <h3 className="font-display font-bold text-lg md:text-xl truncate pr-8">{item.products?.name}</h3>
                      <p className="text-sm text-muted-foreground font-medium">${Number(item.products?.price ?? 0).toFixed(2)}</p>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-secondary/50 rounded-lg p-1 border border-border/50">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md hover:bg-background/80"
                          onClick={() => handleLocalUpdateQuantity(item.product_id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md hover:bg-background/80"
                          onClick={() => handleLocalUpdateQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Total Price for Item */}
                      <p className="font-display font-bold text-lg tracking-tight">
                        ${(Number(item.products?.price ?? 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleLocalRemove(item.product_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="w-full md:w-[380px] shrink-0">
            <div className="sticky top-24">
              <h2 className="text-xl font-bold font-display mb-6">Order Summary</h2>
              <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl shadow-black/5 overflow-hidden">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${localTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">Free</span>
                    </div>
                    <div className="border-t border-border/50 pt-4">
                      <div className="flex justify-between">
                        <span className="font-display font-bold text-lg">Total</span>
                        <span className="font-display font-bold text-2xl text-primary">${localTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20" 
                    size="lg"
                    onClick={() => {
                      toast.info("Please sign in to complete your purchase");
                      setTimeout(() => navigate("/auth"), 1000);
                    }}
                  >
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Sign In to Checkout
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Your cart will be saved when you sign in
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rest of the component is for authenticated users
  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, products(*)")
        .eq("user_id", user.id);
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
      // toast.success("Order created! Please complete payment.");
      setCheckoutConfirmOpen(false);
      setCurrentOrderId(orderId);

      // Start transition
      setTransitionOpen(true);

      // After 2s, close transition and navigate to orders
      setTimeout(() => {
        setTransitionOpen(false);
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        queryClient.invalidateQueries({ queryKey: ["cart-count"] });
        queryClient.invalidateQueries({ queryKey: ["order-count"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        navigate("/orders");
      }, 2000);
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
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        {/* Cart Items Section */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight">Shopping Cart</h1>
            <span className="text-muted-foreground font-medium">{cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}</span>
          </div>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="group relative bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-4 transition-all duration-300 hover:bg-card/60 hover:shadow-lg hover:border-primary/20 flex gap-4 md:gap-6 items-center">

                {/* Product Image */}
                <div className="w-24 h-24 md:w-32 md:h-32 bg-secondary/30 rounded-xl overflow-hidden shrink-0 relative">
                  {item.products?.image_url ? (
                    <img src={item.products.image_url} alt={item.products?.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full text-muted-foreground/30">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-24 md:h-32 py-1">
                  <div>
                    <h3 className="font-display font-bold text-lg md:text-xl truncate pr-8">{item.products?.name}</h3>
                    <p className="text-sm text-muted-foreground font-medium">${Number(item.products?.price ?? 0).toFixed(2)}</p>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    {/* Quantity Controls */}
                    <div className="flex items-center bg-secondary/50 rounded-lg p-1 border border-border/50">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-background/80"
                        onClick={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity - 1 })}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-background/80"
                        onClick={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity + 1 })}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Total Price for Item */}
                    <p className="font-display font-bold text-lg tracking-tight">
                      ${(Number(item.products?.price ?? 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeItem.mutate(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="w-full md:w-[380px] shrink-0">
          <div className="sticky top-24">
            <h2 className="text-xl font-bold font-display mb-6">Order Summary</h2>
            <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl shadow-black/5 overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-500 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (Estimated)</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <div className="flex justify-between items-end mb-6">
                    <span className="font-medium text-lg">Total</span>
                    <span className="font-display font-bold text-3xl tracking-tight text-primary">
                      ${total.toFixed(2)}
                    </span>
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => setCheckoutConfirmOpen(true)}
                    disabled={placeOrder.isPending}
                  >
                    {placeOrder.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></span>
                        Creating Order...
                      </span>
                    ) : (
                      "Proceed to Checkout"
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Secure checkout powered by Stripe
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CheckoutConfirmDialog
        open={checkoutConfirmOpen}
        onOpenChange={setCheckoutConfirmOpen}
        onConfirm={() => placeOrder.mutate()}
        totalAmount={total}
        itemCount={cartItems?.length ?? 0}
        isPending={placeOrder.isPending}
      />

      <CheckoutTransitionDialog open={transitionOpen} />

      {currentOrderId && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          orderId={currentOrderId}
          totalAmount={total}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            queryClient.invalidateQueries({ queryKey: ["cart-count"] });
            queryClient.invalidateQueries({ queryKey: ["order-count"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            navigate("/orders");
          }}
        />
      )}
    </div>
  );
}
