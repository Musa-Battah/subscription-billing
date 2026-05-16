'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      setUser(data.user);
      fetchAdminData();
    } catch (err) {
      console.error('Error:', err);
      router.push('/login');
    }
  };

  const fetchAdminData = async () => {
    try {
      const [statsRes, customersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/customers')
      ]);
      const statsData = await statsRes.json();
      const customersData = await customersRes.json();
      setStats(statsData);
      setCustomers(customersData);
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

  if (loading) {
    return <div className="loading">Loading admin panel...</div>;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">{formatNaira(stats?.totalRevenue || 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Subscriptions</div>
          <div className="stat-value">{stats?.activeSubscriptions || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{stats?.totalCustomers || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">MRR</div>
          <div className="stat-value">{formatNaira(stats?.mrr || 0)}</div>
        </div>
      </div>
      
      <h2>Recent Customers</h2>
      <div className="table-container">
        <table className="subscriptions-table">
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Type</th>
              <th>Phone</th>
              <th>City</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td>{customer.business_name || customer.user_name}</td>
                <td>{customer.business_type}</td>
                <td>{customer.phone || '-'}</td>
                <td>{customer.city || '-'}</td>
                <td>{new Date(customer.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}