# 🍰 Sweet Shop E-Commerce Platform

A modern, full-featured e-commerce platform built with React, TypeScript, Supabase, and Tailwind CSS. This application simulates a premium sweet shop with complete authentication, role-based access control, payment processing, and fraud prevention.

## ✨ Features Implemented

### 🔐 Authentication & Authorization
- ✅ User registration and login
- ✅ Role-based access control (Admin/Customer)
- ✅ Secure session management with Supabase Auth
- ✅ Protected routes based on user roles

### 👤 Customer Features
- ✅ Browse products with search functionality
- ✅ Add/remove items to/from cart
- ✅ Update cart quantities
- ✅ Place orders with stock validation
- ✅ Payment simulation with multiple payment methods
- ✅ View order history with payment status
- ✅ Cancel orders (with fraud tracking)
- ✅ Retry failed payments

### 👨‍💼 Admin Features
- ✅ Complete product management (CRUD operations)
- ✅ Stock management
- ✅ View all orders with customer details
- ✅ Update order status (Pending → Shipped → Delivered)
- ✅ Monitor payment status
- ✅ **Fraud Prevention Dashboard**
  - Track users with multiple cancellations
  - Automatic flagging of suspicious accounts (3+ cancellations)
  - View cancellation history

### 💳 Payment System
- ✅ Multiple payment methods (Credit Card, Debit Card, Net Banking, UPI/Wallet)
- ✅ Payment simulation (90% success rate for testing)
- ✅ Transaction tracking
- ✅ Payment retry functionality
- ✅ Failed payment handling

### 🛡️ Business Logic & Data Integrity
- ✅ Stock validation before order placement
- ✅ Automatic stock deduction on successful orders
- ✅ Stock restoration on order cancellation
- ✅ Backend-calculated order totals
- ✅ Prevention of negative inventory
- ✅ Database transactions for order processing
- ✅ Row Level Security (RLS) policies

### 🎨 UI/UX Features
- ✅ Modern, gradient-rich design
- ✅ Responsive layout (mobile-first)
- ✅ Real product images (20 premium sweet shop items)
- ✅ Search and filter products
- ✅ Product hover effects and animations
- ✅ Cart badge with item count
- ✅ Status badges for orders and payments
- ✅ Loading states and error handling
- ✅ Toast notifications

## 📦 Database Schema

### Core Tables
- **profiles** - User information with fraud tracking
- **user_roles** - Role assignments (admin/customer)
- **products** - Product catalog with stock
- **cart_items** - Shopping cart items
- **orders** - Order records with payment info
- **order_items** - Order line items

### Key Functions
- `place_order()` - Handles order creation with stock validation
- `process_payment()` - Simulates payment processing
- `cancel_order()` - Cancels orders and tracks fraud
- `has_role()` - Role checking for authorization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Bun (recommended) or npm/yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sweet-shop-api
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Set up Supabase:
   - Create a new Supabase project at https://supabase.com
   - Copy your project URL and anon key
   - Create `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. Run migrations:
   - Go to Supabase SQL Editor
   - Run the migration files in order:
     1. `supabase/migrations/20260210082257_867d4b9e-d96d-472d-a936-310be67bd625.sql`
     2. `supabase/migrations/20260210140000_add_payment_and_fraud_prevention.sql`

5. Start the development server:
```bash
bun run dev
# or
npm run dev
```

6. Open http://localhost:5173

### Creating an Admin User

After registration, manually promote a user to admin via Supabase SQL Editor:

```sql
-- Replace with your user's email
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id, role) DO UPDATE SET role = 'admin';
```

## 🎯 Usage Guide

### Customer Flow
1. **Register/Login** → Create account or sign in
2. **Browse Products** → Search and filter 20+ premium sweets
3. **Add to Cart** → Select items (stock validation)
4. **Place Order** → Review cart and proceed to payment
5. **Complete Payment** → Choose payment method and process
6. **Track Orders** → View order history and status

### Admin Flow
1. **Login** → Sign in with admin credentials
2. **Products Tab** → Add/edit/delete products and manage stock
3. **Orders Tab** → View all orders, update status, track payments
4. **Fraud Tracking Tab** → Monitor users with suspicious activity

### Payment Simulation
- 90% success rate (for testing purposes)
- Supports: Credit Card, Debit Card, Net Banking, UPI/Wallet
- Failed payments can be retried from Orders page
- Transaction IDs are generated automatically

## 📊 Product Catalog

The application comes pre-seeded with 20 premium sweet shop products:
- Belgian Dark Chocolate Box ($24.99)
- Strawberry Cheesecake ($32.99)
- French Macarons Collection ($28.99)
- Triple Chocolate Brownies ($18.99)
- Red Velvet Cupcakes ($22.99)
- Tiramisu Cake ($35.99)
- And 14 more delicious items!

All products include real images sourced from Unsplash.

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- Secure authentication with Supabase Auth
- Role-based permission checks
- SECURITY DEFINER functions for sensitive operations
- Fraud prevention tracking
- Input validation and sanitization
- Protected API endpoints

## 🧪 Testing

The application includes:
- Payment simulation (90% success rate)
- Stock validation scenarios
- Fraud detection (3+ cancellations)
- Order flow testing
- Cart operations testing

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   ├── Layout.tsx     # Main layout with navigation
│   └── PaymentDialog.tsx
├── hooks/             # Custom React hooks
│   └── useAuth.tsx    # Authentication hook
├── integrations/      # External service integrations
│   └── supabase/      # Supabase client & types
├── pages/             # Page components
│   ├── Products.tsx   # Customer product browsing
│   ├── Cart.tsx       # Shopping cart
│   ├── Orders.tsx     # Order history
│   ├── Admin.tsx      # Admin dashboard
│   └── Auth.tsx       # Login/Register
└── lib/               # Utility functions

supabase/
└── migrations/        # Database migration files
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Notifications**: Sonner
- **Icons**: Lucide React

## 📝 API Endpoints (Supabase Functions)

### Database RPCs
- `place_order(p_items)` - Create order with stock validation
- `process_payment(p_order_id, p_payment_method, p_transaction_id)` - Process payment
- `cancel_order(p_order_id)` - Cancel order and track fraud
- `has_role(_user_id, _role)` - Check user role

### REST API (via Supabase)
All CRUD operations through Supabase client with RLS policies.

## 🎨 Design Highlights

- Modern gradient hero section with subtle pattern overlay
- Animated product cards with hover scale effects
- Real-time cart badge counter in navigation
- Responsive grid layouts (1-4 columns)
- Color-coded status badges for orders and payments
- Professional payment method selection UI
- Comprehensive fraud tracking dashboard
- Clean admin interface with tabs

## 🐛 Known Limitations

- Payment is simulated (not real payment gateway)
- Stock is restored immediately on cancellation
- Email notifications not implemented
- Single currency (USD)
- No product reviews/ratings

## 🚀 Future Enhancements

- [ ] Real payment gateway integration (Stripe/PayPal)
- [ ] Email notifications for orders
- [ ] Product reviews and ratings
- [ ] Image upload for products
- [ ] Multi-currency support
- [ ] Advanced analytics dashboard
- [ ] Inventory alerts
- [ ] Customer address management
- [ ] Wishlist functionality
- [ ] Order tracking with shipping

## 📄 License

This project is for educational and demonstration purposes.

## 👨‍💻 Development

### Available Scripts

```bash
# Development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run tests
bun run test
```

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your own use.

---

**⚠️ Important Note**: This is a demo application with simulated payment processing. Do not use in production without implementing:
- Real payment gateway integration
- Production-grade security measures
- Email notification system
- Proper error tracking and monitoring
- Compliance with data protection regulations

Built with ❤️ to demonstrate modern full-stack e-commerce capabilities.
