# Sweet Shop API

A modern e-commerce web application for a sweet shop, built with React and Supabase.

## 🔗 Live Demo

**[https://sweet-shop-api-ivory.vercel.app](https://sweet-shop-api-ivory.vercel.app)**

## 📋 Features

- 🛍️ Browse and search sweet products
- 🛒 Shopping cart functionality
- 💳 Secure payment processing
- 👤 User authentication and authorization
- 📱 Responsive design for all devices
- 👨‍💼 Admin panel for product management
- 📦 Order tracking and management
- 🔒 Fraud prevention measures

## 🚀 Technologies Used

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn-ui
- **Backend**: Supabase (PostgreSQL database, Authentication, Storage)
- **Deployment**: Vercel
- **Testing**: Vitest

## 🛠️ Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or bun package manager

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd sweet-shop-api
```

2. Install dependencies:
```sh
npm install
# or
bun install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_URL=your_supabase_url
```

4. Start the development server:
```sh
npm run dev
# or
bun dev
```

The application will be available at `http://localhost:5173`

## 📂 Project Structure

```
sweet-shop-api/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # Supabase integration
│   ├── lib/            # Utility functions
│   ├── pages/          # Application pages
│   └── test/           # Test files
├── supabase/
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

## 🗄️ Database

The application uses Supabase with PostgreSQL. Database schema includes:
- Products
- Users
- Orders
- Cart items
- Payments
- Fraud prevention logs

Migrations are available in the `supabase/migrations` directory.

## 🧪 Testing

Run tests with:
```sh
npm run test
# or
bun test
```

## 📦 Deployment

The application is deployed on Vercel. To deploy your own instance:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables
4. Deploy

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

Developed independently with modern web technologies.
