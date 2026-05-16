'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchUser();
    fetchPlans();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      setPlans(data.slice(0, 3)); // Show top 3 plans
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
          Subscription Billing Made Simple
        </h1>
        <p style={{ fontSize: '18px', color: '#888', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
          Accept recurring payments from Nigerian customers. Perfect for SaaS, memberships, and subscription businesses.
        </p>
        <Link href={user ? "/plans" : "/register"} className="btn-primary" style={{ textDecoration: 'none' }}>
          {user ? 'View Plans' : 'Get Started Free'}
        </Link>
      </div>

      {/* Features Section */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2>Why Choose SubBilling NG?</h2>
        <p style={{ color: '#888', marginTop: '10px' }}>Built for Nigerian businesses</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr)', gap: '30px', marginBottom: '40px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>💰</div>
          <h3>Nigerian Pricing</h3>
          <p style={{ color: '#888' }}>Accept payments in Naira. 7.5% VAT automatically calculated.</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔒</div>
          <h3>Secure Payments</h3>
          <p style={{ color: '#888' }}>Paystack integration with card, bank transfer, and USSD.</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>📊</div>
          <h3>Automated Billing</h3>
          <p style={{ color: '#888' }}>Automatic invoices and payment reminders.</p>
        </div>
      </div>

      {/* Popular Plans Preview */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2>Popular Plans</h2>
        <p style={{ color: '#888' }}>Choose the perfect plan for your business</p>
      </div>

      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.id} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
            {plan.popular && <div className="popular-badge">Most Popular</div>}
            <div className="plan-name">{plan.name}</div>
            <div className="plan-price">
              {formatNaira(plan.price_ngn)}
              <small>/{plan.billing_interval}</small>
            </div>
            <ul className="plan-features">
              {plan.features && plan.features.slice(0, 3).map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
            <Link href={user ? `/checkout?plan=${plan.id}` : "/register"} className="btn-primary" style={{ width: '100%', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              Get Started
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};