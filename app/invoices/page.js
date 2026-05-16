'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const payInvoice = async (id) => {
    alert('Payment integration will go here');
    // Integrate Paystack here
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
                        onClick={() => payInvoice(invoice.id)}
                        className="btn-primary"
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                      >
                        Pay Now
                      </button>
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