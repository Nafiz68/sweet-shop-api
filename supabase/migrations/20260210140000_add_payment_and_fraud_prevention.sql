-- Add payment status and fraud prevention tracking

-- Add payment status to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Add cancellation tracking to profiles for fraud prevention
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cancellation_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_flagged_fraud BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_cancellation_date TIMESTAMPTZ;

-- Function to handle order cancellation with fraud tracking
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
  -- Get order and validate ownership
  SELECT * INTO v_order FROM public.orders 
  WHERE id = p_order_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or access denied';
  END IF;

  -- Only allow cancellation of pending/shipped orders
  IF v_order.status NOT IN ('pending', 'shipped') THEN
    RAISE EXCEPTION 'Cannot cancel order with status: %', v_order.status;
  END IF;

  v_user_id := v_order.user_id;

  -- Restore stock for all order items
  UPDATE public.products p
  SET stock_quantity = stock_quantity + oi.quantity
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id AND p.id = oi.product_id;

  -- Update order status
  UPDATE public.orders SET status = 'cancelled' WHERE id = p_order_id;

  -- Update cancellation tracking
  UPDATE public.profiles
  SET 
    cancellation_count = cancellation_count + 1,
    last_cancellation_date = now()
  WHERE id = v_user_id
  RETURNING cancellation_count INTO v_cancel_count;

  -- Flag user if they have > 3 cancellations in the system
  IF v_cancel_count >= 3 THEN
    UPDATE public.profiles
    SET is_flagged_fraud = true
    WHERE id = v_user_id;
  END IF;

END;
$$;

-- Function to process payment simulation
CREATE OR REPLACE FUNCTION public.process_payment(
  p_order_id UUID,
  p_payment_method TEXT,
  p_transaction_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_success BOOLEAN;
BEGIN
  -- Get order and validate ownership
  SELECT * INTO v_order FROM public.orders 
  WHERE id = p_order_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.payment_status = 'paid' THEN
    RAISE EXCEPTION 'Order already paid';
  END IF;

  -- Simulate payment (90% success rate for demo purposes)
  v_success := random() < 0.9;

  IF v_success THEN
    UPDATE public.orders 
    SET 
      payment_status = 'paid',
      payment_method = p_payment_method,
      transaction_id = p_transaction_id,
      status = 'pending'
    WHERE id = p_order_id;
  ELSE
    UPDATE public.orders 
    SET 
      payment_status = 'failed',
      payment_method = p_payment_method,
      transaction_id = p_transaction_id
    WHERE id = p_order_id;
  END IF;

  RETURN v_success;
END;
$$;

-- Seed real sweet shop products
INSERT INTO public.products (name, description, price, stock_quantity, image_url) VALUES
  ('Belgian Dark Chocolate Box', 'Premium Belgian dark chocolate assortment with 70% cacao, featuring exquisite pralines and truffles', 24.99, 50, 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=500&h=500&fit=crop'),
  ('Strawberry Cheesecake', 'Creamy New York-style cheesecake with fresh strawberry topping and graham cracker crust', 32.99, 25, 'https://images.unsplash.com/photo-1567327511958-f5a9ecd6bdad?w=500&h=500&fit=crop'),
  ('Gummy Bears Deluxe Mix', 'Rainbow assortment of fruit-flavored gummy bears in a 2lb bag', 12.99, 100, 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=500&h=500&fit=crop'),
  ('French Macarons Collection', 'Elegant box of 12 handcrafted macarons in assorted flavors including vanilla, chocolate, pistachio, and raspberry', 28.99, 40, 'https://images.unsplash.com/photo-1558668546-a7b1aef37e02?w=500&h=500&fit=crop'),
  ('Triple Chocolate Brownies', 'Fudgy brownies with dark, milk, and white chocolate chunks - pack of 6', 18.99, 60, 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=500&h=500&fit=crop'),
  ('Caramel Popcorn Bucket', 'Gourmet caramel-coated popcorn with sea salt, 1.5lb bucket', 15.99, 75, 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=500&h=500&fit=crop'),
  ('Red Velvet Cupcakes', 'Classic red velvet cupcakes with cream cheese frosting - box of 6', 22.99, 35, 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=500&h=500&fit=crop'),
  ('Artisan Lollipops', 'Hand-poured lollipops in various fruit flavors with swirl designs - pack of 10', 16.99, 80, 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=500&h=500&fit=crop'),
  ('Tiramisu Cake', 'Authentic Italian tiramisu with ladyfinger biscuits, mascarpone, and espresso', 35.99, 20, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&h=500&fit=crop'),
  ('Chocolate Chip Cookies', 'Fresh-baked jumbo chocolate chip cookies - dozen', 14.99, 90, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&h=500&fit=crop'),
  ('Mint Chocolate Truffles', 'Smooth mint chocolate ganache truffles dusted with cocoa powder - box of 16', 19.99, 55, 'https://images.unsplash.com/photo-1548848979-47519fe73dca?w=500&h=500&fit=crop'),
  ('Rainbow Sprinkle Donuts', 'Glazed donuts topped with colorful sprinkles - box of 6', 16.99, 45, 'https://images.unsplash.com/photo-1534803359379-964dadf4f533?w=500&h=500&fit=crop'),
  ('Pecan Pie Slice', 'Southern-style pecan pie with buttery crust and sweet filling', 8.99, 30, 'https://images.unsplash.com/photo-1587132118104-d5d6d2bb34ee?w=500&h=500&fit=crop'),
  ('Cotton Candy Tub', 'Fluffy cotton candy in pink vanilla flavor - 8oz tub', 9.99, 65, 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=500&h=500&fit=crop'),
  ('Cinnamon Rolls', 'Warm cinnamon rolls with cream cheese icing - pack of 4', 13.99, 50, 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=500&h=500&fit=crop'),
  ('Chocolate Covered Strawberries', 'Fresh strawberries hand-dipped in premium Belgian chocolate - dozen', 29.99, 40, 'https://images.unsplash.com/photo-1606312619070-d48b4cdb0e6f?w=500&h=500&fit=crop'),
  ('Vanilla Bean Ice Cream', 'Madagascar vanilla bean ice cream - 1 pint', 11.99, 70, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&h=500&fit=crop'),
  ('Salted Caramel Chocolates', 'Milk chocolate squares filled with gooey salted caramel - box of 20', 21.99, 60, 'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?w=500&h=500&fit=crop'),
  ('Blueberry Muffins', 'Freshly baked muffins bursting with blueberries - pack of 6', 12.99, 55, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500&h=500&fit=crop'),
  ('Peanut Butter Cups', 'Creamy peanut butter wrapped in rich chocolate - pack of 12', 14.99, 85, 'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?w=500&h=500&fit=crop')
ON CONFLICT DO NOTHING;
