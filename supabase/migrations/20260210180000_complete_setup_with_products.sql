-- Complete setup with payment features and 20 products

-- Add payment status columns (skip if already exist)
DO $$ BEGIN
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_id TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add fraud prevention columns (skip if already exist)
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cancellation_count INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_flagged_fraud BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_cancellation_date TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Cancel order function with fraud tracking
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_user_id UUID;
  v_cancel_count INTEGER;
BEGIN
  SELECT * INTO v_order FROM public.orders 
  WHERE id = p_order_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or access denied';
  END IF;

  IF v_order.status NOT IN ('pending', 'shipped') THEN
    RAISE EXCEPTION 'Cannot cancel order with status: %', v_order.status;
  END IF;

  v_user_id := v_order.user_id;

  UPDATE public.products p
  SET stock_quantity = stock_quantity + oi.quantity
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id AND p.id = oi.product_id;

  UPDATE public.orders SET status = 'cancelled' WHERE id = p_order_id;

  UPDATE public.profiles
  SET cancellation_count = cancellation_count + 1,
      last_cancellation_date = now(),
      is_flagged_fraud = CASE WHEN cancellation_count + 1 >= 3 THEN true ELSE is_flagged_fraud END
  WHERE id = v_user_id;
END;
$$;

-- Process payment function
CREATE OR REPLACE FUNCTION public.process_payment(
  p_order_id UUID,
  p_transaction_id TEXT,
  p_payment_method TEXT,
  p_success BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET payment_status = CASE WHEN p_success THEN 'paid' ELSE 'failed' END,
      payment_method = p_payment_method,
      transaction_id = p_transaction_id
  WHERE id = p_order_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or access denied';
  END IF;
END;
$$;

-- Insert 20 products with real sweet shop items
INSERT INTO public.products (name, description, price, stock_quantity, image_url) VALUES
('Belgian Dark Chocolate Box', 'Premium assorted Belgian dark chocolates with rich cocoa flavor', 24.99, 50, 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80'),
('Strawberry Cheesecake', 'Creamy New York style cheesecake with fresh strawberry topping', 32.99, 25, 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=800&q=80'),
('French Macarons', 'Delicate almond meringue cookies in assorted flavors', 28.99, 40, 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800&q=80'),
('Chocolate Lava Cake', 'Decadent molten chocolate cake with liquid center', 18.99, 30, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&q=80'),
('Tiramisu Slice', 'Classic Italian dessert with coffee-soaked ladyfingers', 15.99, 35, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80'),
('Rainbow Cupcake Box', 'Set of 6 colorful cupcakes with buttercream frosting', 22.99, 45, 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=800&q=80'),
('Caramel Brownie', 'Fudgy chocolate brownies with salted caramel swirl', 16.99, 60, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80'),
('Vanilla Bean Ice Cream', 'Premium vanilla ice cream made with real vanilla beans', 12.99, 55, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80'),
('Red Velvet Cake', 'Classic red velvet layer cake with cream cheese frosting', 38.99, 20, 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&q=80'),
('Chocolate Chip Cookies', 'Homemade cookies loaded with chocolate chips (12 pack)', 14.99, 70, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80'),
('Fruit Tart', 'Buttery pastry with vanilla custard and fresh seasonal fruits', 19.99, 30, 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800&q=80'),
('Cinnamon Rolls', 'Soft and gooey cinnamon rolls with cream cheese glaze', 17.99, 40, 'https://images.unsplash.com/photo-1551106652-a5bcf4b29447?w=800&q=80'),
('Lemon Meringue Pie', 'Tangy lemon filling with fluffy meringue topping', 26.99, 25, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80'),
('Chocolate Truffles', 'Handcrafted gourmet chocolate truffles (16 pieces)', 29.99, 35, 'https://images.unsplash.com/photo-1548848749-ddb0d0c8f925?w=800&q=80'),
('Apple Pie', 'Traditional apple pie with flaky crust and cinnamon spice', 24.99, 30, 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=800&q=80'),
('Donuts Variety Box', 'Assorted glazed, chocolate, and filled donuts (12 pack)', 19.99, 50, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80'),
('Panna Cotta', 'Silky Italian custard dessert with berry compote', 13.99, 40, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80'),
('Éclair', 'French choux pastry filled with cream and topped with chocolate', 8.99, 45, 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&q=80'),
('Baklava', 'Sweet pastry layers with honey and crushed pistachios', 21.99, 35, 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800&q=80'),
('Mango Sorbet', 'Refreshing dairy-free mango sorbet', 11.99, 40, 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&q=80')
ON CONFLICT DO NOTHING;
