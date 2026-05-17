'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.error('Error:', err);
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

  const handlePayNow = async (invoice) => {
    setProcessingId(invoice.id);
    
    try {
      // Get user email
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      
      // Initialize payment
      const paymentRes = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: invoice.total,
          email: userData.user.email,
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription_id,
          customerId: invoice.customer_id
        })
      });
      
      const payment = await paymentRes.json();
      
      if (payment.success) {
        // Redirect to Paystack payment page
        window.location.href = payment.authorization_url;
      } else {
        alert('Payment initialization failed');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to process payment');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading invoices...</div>;
  }

  return (
    <div>
      <h1>Billing History</h1>
      
      {invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-title">No Invoices Yet</div>
          <div className="empty-state-text">Your invoice history will appear here</div>
          <a href="/plans" className="btn-primary">View Plans</a>
        </div>
      ) : (
        <div className="table-container">
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>{invoice.invoice_number}</td>
                  <td>{new Date(invoice.created_at).toLocaleDateString()}</td>
                  <td>{invoice.plan_name}</td>
                  <td>{formatNaira(invoice.total)}</td>
                  <td>
                    <span className={`status-${invoice.status}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    {invoice.status === 'pending' && (
                      <button 
                        onClick={() => handlePayNow(invoice)}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                        disabled={processingId === invoice.id}
                      >
                        {processingId === invoice.id ? 'Processing...' : 'Pay Now'}
                      </button>
                    )}
                    {invoice.status === 'paid' && (
                      <span style={{ color: '#4CAF50' }}>✓ Paid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}