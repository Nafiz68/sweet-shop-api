import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, ShoppingBag, AlertTriangle } from "lucide-react";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  image_url: string;
}

const emptyForm: ProductForm = { name: "", description: "", price: "", stock_quantity: "", image_url: "" };

export default function Admin() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Admin orders query error:", error);
        throw error;
      }
      
      // Fetch user profiles separately if needed
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(order => order.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);
        
        // Merge profiles into orders
        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        data.forEach(order => {
          order.profiles = profileMap.get(order.user_id) || null;
        });
      }
      
      console.log("Admin orders data:", data);
      return data;
    },
  });

  const { data: flaggedUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["flagged-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .gte("cancellation_count", 2)
        .order("cancellation_count", { ascending: false });
      
      if (error) {
        console.error("Flagged users query error:", error);
        throw error;
      }
      
      console.log("Flagged users data:", data);
      return data;
    },
  });

  const saveProduct = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity),
        image_url: form.image_url || null,
      };
      if (editId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Product updated!" : "Product created!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openEdit = (product: any) => {
    setEditId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
      image_url: product.image_url ?? "",
    });
    setDialogOpen(true);
  };

  const paymentStatusColor: Record<string, string> = {
    pending: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    paid: "bg-green-500/10 text-green-500 border-green-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
    refunded: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const statusColor: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    shipped: "bg-primary/10 text-primary border-primary/20",
    delivered: "bg-success/10 text-success border-success/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-8">Admin Dashboard</h1>
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products"><Package className="h-4 w-4 mr-1" />Products</TabsTrigger>
          <TabsTrigger value="orders"><ShoppingBag className="h-4 w-4 mr-1" />Orders</TabsTrigger>
          <TabsTrigger value="fraud"><AlertTriangle className="h-4 w-4 mr-1" />Fraud Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-semibold">Manage Products</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Add Product</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">{editId ? "Edit Product" : "New Product"}</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveProduct.mutate();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                  </div>
                  <Button type="submit" className="w-full" disabled={saveProduct.isPending}>
                    {saveProduct.isPending ? "Saving..." : editId ? "Update Product" : "Create Product"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {productsLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>${Number(p.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={p.stock_quantity > 0 ? "secondary" : "destructive"}>
                          {p.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteProduct.mutate(p.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <h2 className="text-xl font-display font-semibold mb-6">Manage Orders</h2>
          {ordersLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-4">
              {orders?.map((order: any) => (
                <Card key={order.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle className="font-display text-base">
                        Order #{order.id.slice(0, 8)}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <p className="font-medium text-foreground">{order.profiles?.email || 'No email'}</p>
                        <p>{order.profiles?.full_name && `${order.profiles.full_name} • `}{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <Select
                          value={order.status}
                          onValueChange={(status) => updateOrderStatus.mutate({ id: order.id, status })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge className={paymentStatusColor[order.payment_status] ?? ""} variant="outline">
                          {order.payment_status}
                        </Badge>
                      </div>
                      <span className="font-bold font-display">${Number(order.total_price).toFixed(2)}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between py-1 text-sm">
                          <span>{item.products?.name}</span>
                          <span className="text-muted-foreground">{item.quantity} × ${Number(item.price_at_purchase).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {order.payment_method && (
                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                        <span className="font-medium">Payment:</span> {order.payment_method.replace('_', ' ').toUpperCase()}
                        {order.transaction_id && ` • ${order.transaction_id}`}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fraud" className="mt-6">
          <div className="mb-6">
            <h2 className="text-xl font-display font-semibold">Fraud Prevention & User Monitoring</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Users with suspicious activity (3+ cancellations or flagged accounts)
            </p>
          </div>
          {usersLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : flaggedUsers && flaggedUsers.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cancellations</TableHead>
                    <TableHead>Last Cancellation</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.cancellation_count >= 3 ? "destructive" : "secondary"}>
                          {user.cancellation_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.last_cancellation_date 
                          ? new Date(user.last_cancellation_date).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {user.is_flagged_fraud && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Flagged
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No suspicious activity detected</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
