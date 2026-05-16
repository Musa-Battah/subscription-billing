'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSubscribe = async (planId) => {
    // Check if user is logged in
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      router.push('/login?redirect=/plans');
      return;
    }
    
    router.push(`/checkout?plan=${planId}`);
  };

  if (loading) {
    return <div className="loading">Loading plans...</div>;
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>Choose Your Plan</h1>
        <p style={{ color: '#888', marginTop: '10px' }}>
          Simple, transparent pricing for Nigerian businesses
        </p>
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
              {plan.features && plan.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
            
            <button 
              onClick={() => handleSubscribe(plan.id)}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              Subscribe Now
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ color: '#888' }}>
          🔒 Secure payments via Paystack • 7.5% VAT included • Cancel anytime
        </p>
      </div>
    </div>
  );
}