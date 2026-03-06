-- Allow anonymous users to read products
-- This enables guests to browse products without authentication

CREATE POLICY "Anonymous can read products" ON public.products 
FOR SELECT TO anon 
USING (true);
