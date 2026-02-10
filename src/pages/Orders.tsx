import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PaymentDialog } from "@/components/PaymentDialog";

const statusColor: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  shipped: "bg-primary/10 text-primary border-primary/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const paymentStatusColor: Record<string, string> = {
  pending: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  paid: "bg-green-500/10 text-green-500 border-green-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
  refunded: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export default function Orders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, image_url))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.rpc("cancel_order", {
        p_order_id: orderId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleRetryPayment = (order: any) => {
    setSelectedOrder(order);
    setPaymentDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center py-20 text-muted-foreground">Loading orders...</div>;

  if (!orders?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ShoppingBag className="h-16 w-16 mb-4" />
        <p className="text-lg">No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
      <div className="flex items-center justify-between mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight">Order History</h1>
        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-sm">
          {orders.length} Total
        </Badge>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="group bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-black/5 hover:border-primary/20 transition-all duration-300"
          >
            {/* Order Header */}
            <div className="bg-secondary/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                  <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start md:self-auto">
                <Badge className={`${statusColor[order.status]} shadow-sm`} variant="outline">
                  {order.status}
                </Badge>
                <Badge className={`${paymentStatusColor[order.payment_status]} shadow-sm`} variant="outline">
                  {order.payment_status}
                </Badge>
                <div className="h-8 w-[1px] bg-border/60 mx-2 hidden md:block"></div>
                <span className="font-display font-bold text-xl tracking-tight">${Number(order.total_price).toFixed(2)}</span>
              </div>
            </div>

            {/* Order Content */}
            <div className="p-6">
              <div className="space-y-2 mb-6">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {item.products?.image_url && (
                        <img src={item.products.image_url} alt="" className="w-8 h-8 rounded-md object-cover opacity-80" />
                      )}
                      <span className="text-sm font-medium">{item.products?.name ?? "Unknown Product"}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{item.quantity}</span> × ${Number(item.price_at_purchase).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-border/40">
                <div className="text-xs text-muted-foreground/70 flex items-center gap-2">
                  {order.payment_method && (
                    <>
                      <span className="uppercase font-semibold tracking-wider">{order.payment_method.replace('_', ' ')}</span>
                      {order.transaction_id && <span>• ID: <span className="font-mono">{order.transaction_id.slice(-8)}</span></span>}
                    </>
                  )}
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  {order.payment_status === "pending" && order.status !== "cancelled" && (
                    <Button
                      size="sm"
                      onClick={() => handleRetryPayment(order)}
                      className="flex-1 md:flex-none shadow-lg shadow-primary/20"
                    >
                      Complete Payment
                    </Button>
                  )}
                  {order.payment_status === "failed" && (
                    <Button
                      size="sm"
                      onClick={() => handleRetryPayment(order)}
                      className="flex-1 md:flex-none shadow-lg shadow-primary/20"
                    >
                      Retry Payment
                    </Button>
                  )}
                  {(order.status === "pending" || order.status === "shipped") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => cancelOrder.mutate(order.id)}
                      disabled={cancelOrder.isPending}
                      className="flex-1 md:flex-none text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          orderId={selectedOrder.id}
          totalAmount={Number(selectedOrder.total_price)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
          }}
        />
      )}
    </div>
  );
}
