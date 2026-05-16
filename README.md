# 💳 Subscription Billing System (Nigeria)

A complete subscription billing system built for Nigerian businesses. Supports monthly subscriptions, automated invoicing, VAT calculation (7.5%), and customer management.

## 🚀 Live Demo

[View Live Demo](https://subscription-billing-nu.vercel.app/)

## ✨ Features

### Customer Features
- **Browse Plans** - View available subscription tiers (Basic, Pro, Enterprise)
- **Subscribe** - Sign up for monthly subscriptions with business information
- **Dashboard** - View active subscriptions and upcoming payments
- **Cancel Anytime** - Cancel subscriptions with end-of-period access
- **Invoice History** - View all past invoices and payment status
- **Nigerian Pricing** - All prices in ₦ Naira with 7.5% VAT

### Admin Features
- **Revenue Analytics** - Track total revenue, MRR, and active subscribers
- **Customer Management** - View all customers and their subscriptions
- **Real-time Stats** - Monitor business performance

### Technical Features
- **Automated Billing** - Automatic period calculation for subscriptions
- **VAT Compliance** - Automatic 7.5% VAT calculation for Nigerian tax
- **Secure Authentication** - JWT-based authentication with HTTP-only cookies
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Theme** - Pure black & white with Playpen Sans font

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 16 (App Router) |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL (Neon) |
| **Authentication** | JWT + HTTP-only Cookies |
| **Styling** | Custom CSS (Playpen Sans font) |
| **Deployment** | Vercel |

## 📊 Database Schema

```sql
-- Subscription plans
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_ngn DECIMAL(10,2) NOT NULL,
    billing_interval VARCHAR(20),
    features JSONB,
    popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

-- Customers (Nigerian businesses)
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    tax_id VARCHAR(50)
);

-- Subscriptions
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    plan_id INTEGER REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'active',
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    payment_method VARCHAR(50)
);

-- Invoices (with Nigerian VAT)
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES subscriptions(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 7.5,
    vat_amount DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP
);

# Clone the repository
git clone https://github.com/Musa-Battah/subscription-billing.git
cd subscription-billing

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

Create .env.local with your credentials:
# Database (Neon)
PGHOST=your_neon_host
PGPORT=5432
PGDATABASE=neondb
PGUSER=your_user
PGPASSWORD=your_password
PGSSLMODE=require

# JWT Authentication
JWT_SECRET=your_super_secret_key

# App URL
NEXTAUTH_URL=http://localhost:3000

Database Setup
Create a database on Neon.tech

Run the schema SQL from above in the Neon SQL Editor

Insert sample subscription plans:

INSERT INTO subscription_plans (name, description, price_ngn, billing_interval, features, popular) VALUES
    ('Basic', 'For individuals and small businesses', 5000, 'monthly', 
     '["Basic support", "Up to 100 customers", "Basic reports"]', false),
    ('Pro', 'For growing businesses', 15000, 'monthly',
     '["Priority support", "Up to 1000 customers", "Advanced reports", "API access"]', true),
    ('Enterprise', 'For large organizations', 50000, 'monthly',
     '["24/7 phone support", "Unlimited customers", "Custom reports", "Dedicated account manager"]', false);