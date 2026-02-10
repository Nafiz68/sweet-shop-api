import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";

const statusColor: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  shipped: "bg-primary/10 text-primary border-primary/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Orders() {
  const { user } = useAuth();

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
                <Badge className={statusColor[order.status] ?? ""} variant="outline">
                  {order.status}
                </Badge>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
