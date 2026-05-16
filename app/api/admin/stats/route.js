import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Total revenue from paid invoices
    const revenueResult = await query(`
      SELECT COALESCE(SUM(total), 0) as total_revenue
      FROM invoices
      WHERE status = 'paid'
    `);
    
    // Active subscriptions count
    const activeSubsResult = await query(`
      SELECT COUNT(*) as active_count
      FROM subscriptions
      WHERE status = 'active'
    `);
    
    // Total customers
    const customersResult = await query(`
      SELECT COUNT(*) as total_customers
      FROM customers
    `);
    
    // Monthly Recurring Revenue (MRR)
    const mrrResult = await query(`
      SELECT COALESCE(SUM(sp.price_ngn), 0) as mrr
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.status = 'active' AND sp.billing_interval = 'monthly'
    `);
    
    return NextResponse.json({
      totalRevenue: parseFloat(revenueResult.rows[0].total_revenue),
      activeSubscriptions: parseInt(activeSubsResult.rows[0].active_count),
      totalCustomers: parseInt(customersResult.rows[0].total_customers),
      mrr: parseFloat(mrrResult.rows[0].mrr)
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}