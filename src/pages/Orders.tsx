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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold font-display mb-8">My Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="font-display text-lg">
                  Order #{order.id.slice(0, 8)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <Badge className={statusColor[order.status] ?? ""} variant="outline">
                    {order.status}
                  </Badge>
                  <Badge className={paymentStatusColor[order.payment_status] ?? ""} variant="outline">
                    {order.payment_status}
                  </Badge>
                </div>
                <span className="font-bold font-display text-lg">${Number(order.total_price).toFixed(2)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <span className="text-sm">{item.products?.name ?? "Unknown"}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.quantity} × ${Number(item.price_at_purchase).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              {order.payment_method && (
                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                  Payment: {order.payment_method.replace('_', ' ').toUpperCase()}
                  {order.transaction_id && ` • ${order.transaction_id}`}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                {order.payment_status === "pending" && order.status !== "cancelled" && (
                  <Button
                    size="sm"
                    onClick={() => handleRetryPayment(order)}
                    className="flex-1"
                  >
                    Complete Payment
                  </Button>
                )}
                {order.payment_status === "failed" && (
                  <Button
                    size="sm"
                    onClick={() => handleRetryPayment(order)}
                    className="flex-1"
                  >
                    Retry Payment
                  </Button>
                )}
                {(order.status === "pending" || order.status === "shipped") && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => cancelOrder.mutate(order.id)}
                    disabled={cancelOrder.isPending}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel Order
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
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
