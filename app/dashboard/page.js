'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);
      
      const subsRes = await fetch('/api/subscriptions');
      const subsData = await subsRes.json();
      setSubscriptions(subsData);
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

  const cancelSubscription = async (id) => {
    if (confirm('Cancel this subscription? You will continue until the end of the billing period.')) {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Subscriptions</div>
          <div className="stat-value">{subscriptions.filter(s => s.status === 'active').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Monthly Spend</div>
          <div className="stat-value">
            {formatNaira(subscriptions.reduce((sum, s) => sum + (s.status === 'active' ? s.plan_price : 0), 0))}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Invoices</div>
          <div className="stat-value">{subscriptions.length}</div>
        </div>
      </div>
      
      <h2>Your Subscriptions</h2>
      
      {subscriptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">No Active Subscriptions</div>
          <div className="empty-state-text">Choose a plan to get started</div>
          <a href="/plans" className="btn-primary">View Plans</a>
        </div>
      ) : (
        <div className="table-container">
          <table className="subscriptions-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Price</th>
                <th>Status</th>
                <th>Current Period</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(sub => (
                <tr key={sub.id}>
                  <td>{sub.plan_name}</td>
                  <td>{formatNaira(sub.plan_price)} / {sub.billing_interval}</td>
                  <td>
                    <span className={`status-${sub.status}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td>
                    {new Date(sub.current_period_start).toLocaleDateString()} - 
                    {new Date(sub.current_period_end).toLocaleDateString()}
                  </td>
                  <td>
                    {sub.status === 'active' && (
                      <button 
                        onClick={() => cancelSubscription(sub.id)}
                        className="btn-danger"
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                      >
                        Cancel
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