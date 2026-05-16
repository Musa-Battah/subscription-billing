'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  
  const [plan, setPlan] = useState(null);
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [businessInfo, setBusinessInfo] = useState({
    business_name: '',
    business_type: 'individual',
    phone: '',
    address: '',
    city: '',
    state: ''
  });

  useEffect(() => {
    if (!planId) {
      router.push('/plans');
      return;
    }
    fetchData();
  }, [planId]);

  // Rest of your existing component logic stays the same...
  // (keep all your existing functions: fetchData, formatNaira, handleSubmit, etc.)

  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    
    try {
      // Validate required fields
      if (!businessInfo.business_name) {
        setError('Business name is required');
        setProcessing(false);
        return;
      }
      
      if (!businessInfo.phone) {
        setError('Phone number is required');
        setProcessing(false);
        return;
      }
      
      // Create/update customer
      const customerRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessInfo)
      });
      
      if (!customerRes.ok) {
        const errorData = await customerRes.json();
        throw new Error(errorData.error || 'Failed to create customer');
      }
      
      const customerData = await customerRes.json();
      
      // Create subscription
      const subRes = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          customer_id: customerData.id,
          payment_method: 'card'
        })
      });
      
      if (!subRes.ok) {
        const errorData = await subRes.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }
      
      const subscription = await subRes.json();
      
      // Create invoice for first payment
      const invoiceRes = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: subscription.id,
          amount: plan.price_ngn
        })
      });
      
      if (!invoiceRes.ok) {
        const errorData = await invoiceRes.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }
      
      // Redirect to success
      router.push(`/payment/success?subscription=${subscription.id}`);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to create subscription');
    } finally {
      setProcessing(false);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch user
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push(`/login?redirect=/checkout?plan=${planId}`);
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);
      
      // Fetch plan details
      const planRes = await fetch('/api/plans');
      const plans = await planRes.json();
      const selectedPlan = plans.find(p => p.id === parseInt(planId));
      if (!selectedPlan) {
        setError('Plan not found');
        setLoading(false);
        return;
      }
      setPlan(selectedPlan);
      
      // Check if user already has customer record
      try {
        const customerRes = await fetch('/api/customers/me');
        if (customerRes.ok) {
          const customerData = await customerRes.json();
          setCustomer(customerData);
          setBusinessInfo({
            business_name: customerData.business_name || '',
            business_type: customerData.business_type || 'individual',
            phone: customerData.phone || '',
            address: customerData.address || '',
            city: customerData.city || '',
            state: customerData.state || ''
          });
        }
      } catch (err) {
        // No customer yet, that's fine
        console.log('No existing customer');
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
    'Taraba', 'Yobe', 'Zamfara'
  ];

  if (loading) {
    return <div className="loading">Loading checkout...</div>;
  }

  if (error && !plan) {
    return (
      <div className="card">
        <h2>Error</h2>
        <p>{error}</p>
        <a href="/plans" className="btn-primary">Back to Plans</a>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="card">
        <h2>Plan Not Found</h2>
        <a href="/plans" className="btn-primary">View Plans</a>
      </div>
    );
  }

  const subtotal = plan.price_ngn;
  const vat = subtotal * 0.075;
  const total = subtotal + vat;

  return (
    <div>
      <h1>Complete Your Subscription</h1>
      
      {error && (
        <div className="card" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444', marginBottom: '20px' }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
        {/* Business Information Form */}
        <form onSubmit={handleSubmit} className="card">
          <h2>Business Information</h2>
          
          <div className="form-group">
            <label>Business Name *</label>
            <input
              type="text"
              value={businessInfo.business_name}
              onChange={(e) => setBusinessInfo({...businessInfo, business_name: e.target.value})}
              placeholder="e.g., Battah Technologies"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Business Type *</label>
            <select
              value={businessInfo.business_type}
              onChange={(e) => setBusinessInfo({...businessInfo, business_type: e.target.value})}
              required
            >
              <option value="individual">Individual</option>
              <option value="business">Registered Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              value={businessInfo.phone}
              onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
              placeholder="08012345678"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Address</label>
            <textarea
              rows="2"
              value={businessInfo.address}
              onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
              placeholder="Street address"
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={businessInfo.city}
                onChange={(e) => setBusinessInfo({...businessInfo, city: e.target.value})}
                placeholder="Lagos"
              />
            </div>
            
            <div className="form-group">
              <label>State</label>
              <select
                value={businessInfo.state}
                onChange={(e) => setBusinessInfo({...businessInfo, state: e.target.value})}
              >
                <option value="">Select State</option>
                {nigerianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button type="submit" className="btn-primary" disabled={processing} style={{ width: '100%' }}>
            {processing ? 'Processing...' : `Subscribe to ${plan.name} - ${formatNaira(total)}/month`}
          </button>
        </form>
        
        {/* Order Summary */}
        <div className="card">
          <h2>Order Summary</h2>
          
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{plan.name} Plan</div>
            <div style={{ fontSize: '14px', color: '#888' }}>{plan.description}</div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222' }}>
              <span>Subtotal</span>
              <span>{formatNaira(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222' }}>
              <span>VAT (7.5%)</span>
              <span>{formatNaira(vat)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', fontSize: '18px', fontWeight: 'bold' }}>
              <span>Total (Monthly)</span>
              <span>{formatNaira(total)}</span>
            </div>
          </div>
          
          <div style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>
            <p>✓ Cancel anytime</p>
            <p>✓ Secure payment via Paystack</p>
            <p>✓ 14-day money-back guarantee</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="loading">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}