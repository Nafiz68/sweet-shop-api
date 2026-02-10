import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, ShoppingBag, AlertTriangle, TrendingUp, Users, DollarSign, Search, Filter } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(order => order.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        data.forEach((order: any) => {
          order.profiles = profileMap.get(order.user_id) || null;
        });
      }
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
      if (error) throw error;
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

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const paymentStatusColor: Record<string, string> = {
    pending: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    failed: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    refunded: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  };

  // KPI Calculations
  const totalRevenue = orders?.reduce((acc, order) => acc + (order.payment_status === 'paid' ? Number(order.total_price) : 0), 0) || 0;
  const totalOrders = orders?.length || 0;
  const lowStockProducts = products?.filter(p => p.stock_quantity < 10).length || 0;
  const activeFraudAlerts = flaggedUsers?.length || 0;

  const filteredProducts = products?.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Chart Data Preparation
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toLocaleDateString());
    }
    return dates;
  };

  const last7Days = getLast7Days();

  const revenueData = last7Days.map(date => {
    const dayRevenue = orders?.filter((order: any) =>
      new Date(order.created_at).toLocaleDateString() === date &&
      order.payment_status === 'paid'
    ).reduce((sum, order: any) => sum + Number(order.total_price), 0) || 0;

    return { date, revenue: dayRevenue };
  });

  const ordersData = last7Days.map(date => {
    const dayCount = orders?.filter((order: any) =>
      new Date(order.created_at).toLocaleDateString() === date
    ).length || 0;

    return { date, count: dayCount };
  });

  const [selectedUserForReview, setSelectedUserForReview] = useState<any>(null);
  const userOrders = orders?.filter((o: any) => o.user_id === selectedUserForReview?.id) || [];

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>

      {/* DASHBOARD OVERVIEW */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display">${totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">+180 from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display">{lowStockProducts}</div>
                <p className="text-xs text-muted-foreground">Products with &lt; 10 units</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fraud Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display text-destructive">{activeFraudAlerts}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>
          </div>

          {/* GRAPHS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over time.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#ec4899" fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders Volume</CardTitle>
                <CardDescription>Number of orders per day.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? <div className="text-sm text-muted-foreground">Loading...</div> :
                  <div className="space-y-4">
                    {orders?.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{order.profiles?.email}</p>
                            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">${order.total_price}</p>
                          <Badge variant="outline" className={paymentStatusColor[order.payment_status]}>{order.payment_status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* PRODUCTS MANAGMENT */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-display font-bold">Products</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add New</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="font-display font-bold text-xl">{editId ? "Edit Product" : "Create Product"}</DialogTitle>
                    <CardDescription>Fill in the details below to {editId ? "update" : "create"} a product.</CardDescription>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveProduct.mutate();
                    }}
                    className="space-y-4 py-4"
                  >
                    <div className="space-y-2">
                      <Label>Product Name</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea className="resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price ($)</Label>
                        <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock Quantity</Label>
                        <Input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={saveProduct.isPending}>
                        {saveProduct.isPending ? "Saving..." : editId ? "Update Product" : "Create Product"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading products...</TableCell></TableRow>
                ) : filteredProducts?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No products found</TableCell></TableRow>
                ) : (
                  filteredProducts?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10 rounded-md">
                          <AvatarImage src={p.image_url} alt={p.name} className="object-cover" />
                          <AvatarFallback className="rounded-md">IMG</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate w-48">{p.description?.slice(0, 50)}...</div>
                      </TableCell>
                      <TableCell>${Number(p.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={p.stock_quantity > 10 ? "secondary" : "destructive"}>
                          {p.stock_quantity} Units
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteProduct.mutate(p.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ORDERS MANAGEMENT */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-bold">Order Management</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading orders...</TableCell></TableRow>
                ) : (
                  orders?.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{order.profiles?.email || 'Guest'}</div>
                        {order.profiles?.full_name && <div className="text-xs text-muted-foreground">{order.profiles.full_name}</div>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(status) => updateOrderStatus.mutate({ id: order.id, status })}
                        >
                          <SelectTrigger className="h-8 w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={paymentStatusColor[order.payment_status]}>
                          {order.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${Number(order.total_price).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* FRAUD DETECTION */}
      {activeTab === "fraud" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Fraud Monitoring
            </h2>
            <p className="text-muted-foreground">Accounts flagged for suspicious activity or high cancellation rates.</p>
          </div>

          {usersLoading ? (
            <div className="text-center py-10">Loading...</div>
          ) : flaggedUsers && flaggedUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flaggedUsers.map((user) => (
                <Card key={user.id} className="border-destructive/20 bg-destructive/5">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="destructive" className="mb-2">High Risk</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><Filter className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Ban User</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-base break-all">{user.email}</CardTitle>
                    <CardDescription>{user.full_name || "No name provided"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-destructive/10 pb-2">
                      <span className="text-muted-foreground">Cancellations</span>
                      <span className="font-bold text-destructive">{user.cancellation_count}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-destructive/10 pb-2">
                      <span className="text-muted-foreground">Last Incident</span>
                      <span>{user.last_cancellation_date ? new Date(user.last_cancellation_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="pt-2">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full border-destructive/30 hover:bg-destructive/10 text-destructive"
                            onClick={() => setSelectedUserForReview(user)}
                          >
                            Review Activity
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>User Activity Review</SheetTitle>
                            <SheetDescription>
                              Detailed order history for {user.email}
                            </SheetDescription>
                          </SheetHeader>

                          <div className="mt-6 space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">{user.full_name || 'No Name'}</h3>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="destructive" className="text-[10px] h-5">High Risk</Badge>
                                  <Badge variant="outline" className="text-[10px] h-5">{user.cancellation_count} Cancellations</Badge>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" /> Order History
                              </h4>
                              {userOrders.length > 0 ? (
                                <div className="space-y-3">
                                  {userOrders.map((order: any) => (
                                    <div key={order.id} className="border rounded-lg p-3 flex justify-between items-center text-sm">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-xs">{order.id.slice(0, 8)}</span>
                                          <Badge variant="secondary" className="text-[10px] h-5">{order.status}</Badge>
                                        </div>
                                        <p className="text-muted-foreground mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold">${order.total_price}</p>
                                        <p className={`text-xs capitalize ${order.payment_status === 'failed' ? 'text-red-500' : 'text-muted-foreground'}`}>{order.payment_status}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No orders found for this user.</p>
                              )}
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/20 border-dashed">
              <div className="bg-background p-4 rounded-full mb-4 shadow-sm">
                <Users className="h-8 w-8 opacity-20" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No Flags Detected</h3>
              <p>Great! No suspicious user activity found.</p>
            </Card>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

